import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { validatePhoneNumber } from '@/lib/phoneUtils';
import { smsService } from '@/lib/smsService';
import { sanitizeName, safeProfileForOutput, safePreferences, escapeRegex } from '@/lib/sanitize';
import { logger } from '@/lib/logger';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

const isDevelopment = process.env.NODE_ENV === 'development';

let flowlineConnection: mongoose.Connection | null = null;

const connectFlowlineDB = async () => {
  if (flowlineConnection) return flowlineConnection;
  try {
    if (!process.env.FLOWLINE_MONGODB_URI) return null;
    flowlineConnection = await mongoose.createConnection(process.env.FLOWLINE_MONGODB_URI);
    return flowlineConnection;
  } catch (error: any) {
    return null;
  }
};

const StudentSchema = new mongoose.Schema(
  {
    fullName: { type: String },
    phone: { type: String },
    phoneE164: { type: String },
    phoneDigits: { type: String },
    phoneRaw: { type: String },
    email: { type: String },
    course: { type: String },
    enrollmentDate: { type: String },
    assignedSalesperson: { type: String },
    tag: { type: String },
    batchId: { type: String },
    status: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const findFlowlineStudent = async (phoneNumber: string, phoneE164: string, phoneDigits: string) => {
  try {
    const flowlineDB = await connectFlowlineDB();
    if (!flowlineDB) return null;
    const Student = flowlineDB.model('Student', StudentSchema, 'students');
    const cleanPhone = phoneNumber.replace(/\s+/g, '').trim();
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    let localNumber = phoneNumber;
    if (phoneE164 && phoneE164.startsWith('+')) {
      const commonCountryCodes = ['+49', '+91', '+1', '+44', '+33', '+86', '+81', '+55', '+61'];
      for (const cc of commonCountryCodes) {
        if (phoneE164.startsWith(cc)) {
          localNumber = phoneE164.substring(cc.length);
          break;
        }
      }
    }
    const escapedCleanPhone = escapeRegex(cleanPhone);
    const escapedLocalNumber = escapeRegex(localNumber);
    const escapedDigitsOnly = escapeRegex(digitsOnly);
    const escapedLocalNumberDigits = escapeRegex(localNumber.replace(/\D/g, ''));
    const searchQueries = [
      { phoneE164: phoneE164 },
      { phoneDigits: phoneDigits },
      { phone: phoneNumber },
      { phone: cleanPhone },
      { phoneRaw: phoneNumber },
      { phoneRaw: cleanPhone },
      { phone: localNumber },
      { phone: localNumber.replace(/\D/g, '') },
      { phoneRaw: localNumber },
      { phoneRaw: localNumber.replace(/\D/g, '') },
      { phone: digitsOnly },
      { phoneRaw: digitsOnly },
      { phoneDigits: digitsOnly },
      { phone: { $regex: `^${escapedCleanPhone}\\s*$` } },
      { phoneRaw: { $regex: `^${escapedCleanPhone}\\s*$` } },
      { phone: { $regex: `^${escapedLocalNumber}\\s*$` } },
      { phoneRaw: { $regex: `^${escapedLocalNumber}\\s*$` } },
      { phone: { $regex: `^${escapedDigitsOnly}\\s*$` } },
      { phoneRaw: { $regex: `^${escapedDigitsOnly}\\s*$` } },
      { phone: { $regex: escapedLocalNumberDigits + '$' } },
      { phoneRaw: { $regex: escapedLocalNumberDigits + '$' } },
      { phoneDigits: { $regex: escapedLocalNumberDigits + '$' } },
    ];
    const uniqueQueries = searchQueries.filter((query, index, self) => {
      const key = Object.keys(query)[0];
      const value = query[key as keyof typeof query];
      if (!value || (typeof value === 'string' && value.trim() === '')) return false;
      return index === self.findIndex((q) => JSON.stringify(q) === JSON.stringify(query));
    });
    const student = await Student.findOne({ $or: uniqueQueries }).lean();
    return student;
  } catch (error: any) {
    return null;
  }
};

const generateToken = (id: string, tokenVersion: number = 0) => {
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  return jwt.sign({ id, tokenVersion }, process.env.JWT_SECRET, {
    expiresIn: expiresIn,
  });
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phoneNumber, countryCode = '+91', otp } = body;

    if (!phoneNumber || !otp) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Phone number and OTP are required',
          errors: ['MISSING_FIELDS'],
        },
        { status: 400 }
      );
    }

    if (otp.length !== 6) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'OTP must be 6 digits',
          errors: ['INVALID_OTP_FORMAT'],
        },
        { status: 400 }
      );
    }

    const phoneValidation = validatePhoneNumber(phoneNumber, countryCode);
    if (!phoneValidation.isValid) {
      return NextResponse.json(
        {
          status: 'error',
          message: phoneValidation.error || 'Invalid phone number',
          errors: phoneValidation.error ? [phoneValidation.error] : ['INVALID_PHONE_NUMBER'],
        },
        { status: 400 }
      );
    }

    const { formattedNumber } = phoneValidation;

    await connectDB();

    const user = await User.findOne({
      fullPhoneNumber: formattedNumber,
      isActive: true,
    }).select('+otp +otpExpires');

    if (!user) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'User not found. Please request OTP first.',
          errors: ['USER_NOT_FOUND'],
        },
        { status: 404 }
      );
    }

    if (!(await user.verifyOTP(otp))) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Invalid or expired OTP',
          errors: ['INVALID_OTP'],
        },
        { status: 400 }
      );
    }

    const isFirstTimeLogin = !user.isVerified;
    user.isVerified = true;
    user.clearOTP();
    user.updateLastLogin();

    let flowlineStudent = null;
    let isFlowlineStudent = false;
    try {
      flowlineStudent = await findFlowlineStudent(
        phoneValidation.phoneNumber,
        formattedNumber,
        phoneValidation.phoneNumber.replace(/[^\d]/g, '')
      );
      if (flowlineStudent) {
        isFlowlineStudent = true;
      }
    } catch (error: any) {
      console.error('Error fetching Flowline student:', error.message);
    }

    if (isFirstTimeLogin) {
      if (flowlineStudent && flowlineStudent.fullName) {
        const sanitizedFlowlineName = sanitizeName(flowlineStudent.fullName);
        user.profile.firstName = sanitizedFlowlineName || 'User';
      } else if (!user.profile.firstName) {
        user.profile.firstName = 'User';
      }
      user.preferences = {
        language: 'en',
        notifications: true,
      };
      user.registeredAt = new Date();
      logger.info(`🎉 New user registered: ${formattedNumber}`);
    } else if (flowlineStudent && flowlineStudent.fullName && !user.profile.firstName) {
      const sanitizedFlowlineName = sanitizeName(flowlineStudent.fullName);
      if (sanitizedFlowlineName && sanitizedFlowlineName.length >= 2) {
        user.profile.firstName = sanitizedFlowlineName;
      }
    }

    await user.save();

    const token = generateToken(user._id.toString(), user.tokenVersion || 0);

    if (isFirstTimeLogin) {
      try {
        const welcomeResult = await smsService.sendWelcomeMessage(formattedNumber);
        if (!welcomeResult.success) {
          console.warn(`⚠️ Welcome message failed but login succeeded: ${welcomeResult.error}`);
        }
      } catch (error: any) {
        console.error(`⚠️ Error sending welcome message (non-critical):`, error.message);
      }
    }

    const requiresRegistration = !isFlowlineStudent;

    return NextResponse.json({
      status: 'success',
      message: isFirstTimeLogin ? 'Registration successful' : 'Login successful',
      data: {
        token,
        isFirstTimeLogin,
        isFlowlineStudent,
        requiresRegistration,
        user: {
          id: user._id,
          phoneNumber: user.phoneNumber,
          countryCode: user.countryCode,
          fullPhoneNumber: user.fullPhoneNumber,
          isVerified: user.isVerified,
          profile: safeProfileForOutput(user.profile),
          preferences: safePreferences(user.preferences),
          lastLogin: user.lastLogin,
          registeredAt: user.registeredAt,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error: any) {
    logger.error('Verify OTP error:', error.message || 'Unknown error');
    return NextResponse.json(
      {
        status: 'error',
        message: 'An error occurred while verifying OTP. Please try again.',
        errors: ['INTERNAL_SERVER_ERROR'],
      },
      { status: 500 }
    );
  }
}

