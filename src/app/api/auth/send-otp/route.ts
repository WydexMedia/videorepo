import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { validatePhoneNumber } from '@/lib/phoneUtils';
import { smsService } from '@/lib/smsService';
import { sanitizeName, escapeString, escapeRegex } from '@/lib/sanitize';
import { logger } from '@/lib/logger';
import mongoose from 'mongoose';

const isDevelopment = process.env.NODE_ENV === 'development';

// Flowline database connection
let flowlineConnection: mongoose.Connection | null = null;

const connectFlowlineDB = async () => {
  if (flowlineConnection) return flowlineConnection;

  try {
    if (!process.env.FLOWLINE_MONGODB_URI) {
      console.warn('⚠️  FLOWLINE_MONGODB_URI is not set. Flowline database features will be disabled.');
      return null;
    }

    flowlineConnection = await mongoose.createConnection(process.env.FLOWLINE_MONGODB_URI);

    if (isDevelopment) {
      logger.info('✅ Flowline Database Connected');
    }

    return flowlineConnection;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Flowline Database Connection Error:', errorMessage);
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
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        return false;
      }
      return index === self.findIndex((q) => JSON.stringify(q) === JSON.stringify(query));
    });

    const student = await Student.findOne({
      $or: uniqueQueries,
    }).lean();

    return student;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error finding Flowline student:', errorMessage);
    return null;
  }
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phoneNumber, countryCode = '+91' } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Phone number is required',
          errors: ['PHONE_NUMBER_REQUIRED'],
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

    const { formattedNumber, countryCode: validatedCountryCode, phoneNumber: validatedPhoneNumber } = phoneValidation;
    
    if (!validatedPhoneNumber) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Invalid phone number format',
          errors: ['INVALID_PHONE_NUMBER'],
        },
        { status: 400 }
      );
    }

    await connectDB();

    let user = await User.findOne({ fullPhoneNumber: formattedNumber });

    if (user && !user.isActive) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Account is deactivated. Please contact support.',
          errors: ['ACCOUNT_DEACTIVATED'],
        },
        { status: 403 }
      );
    }

    if (!user) {
      user = new User({
        phoneNumber: validatedPhoneNumber,
        countryCode: validatedCountryCode,
        fullPhoneNumber: formattedNumber,
      });
    }

    const otp = user.generateOTP();
    await user.save();

    const smsResult = await smsService.sendOTP(formattedNumber, otp);

    if (!smsResult.success) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Failed to send OTP. Please try again.',
          errors: ['SMS_SEND_FAILED'],
        },
        { status: 500 }
      );
    }

    let studentName: string | null = null;
    try {
      const flowlineStudent = await findFlowlineStudent(
        validatedPhoneNumber,
        formattedNumber,
        validatedPhoneNumber.replace(/[^\d]/g, '')
      );

      if (flowlineStudent && flowlineStudent.fullName) {
        studentName = sanitizeName(flowlineStudent.fullName);
        logger.debug(`📚 Found Flowline student: ${studentName}`);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error fetching Flowline student:', errorMessage);
    }

    const responseData: {
      phoneNumber: string;
      countryCode: string;
      expiresIn: string;
      studentName?: string;
    } = {
      phoneNumber: validatedPhoneNumber,
      countryCode: validatedCountryCode,
      expiresIn: '10 minutes',
    };

    if (studentName) {
      (responseData as { phoneNumber: string; countryCode: string; expiresIn: string; studentName?: string; name?: string }).name = escapeString(studentName);
    }

    return NextResponse.json({
      status: 'success',
      message: 'OTP sent successfully',
      data: responseData,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Send OTP error:', errorMessage);
    return NextResponse.json(
      {
        status: 'error',
        message: 'An error occurred while sending OTP. Please try again.',
        errors: ['INTERNAL_SERVER_ERROR'],
      },
      { status: 500 }
    );
  }
}

