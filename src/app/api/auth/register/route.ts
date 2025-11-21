import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { validatePhoneNumber } from '@/lib/phoneUtils';
import { sanitizeName, sanitizeEmail, sanitizePlace, safeProfileForOutput, safePreferences } from '@/lib/sanitize';
import { logger } from '@/lib/logger';
import jwt from 'jsonwebtoken';

const generateToken = (id: string, tokenVersion: number = 0) => {
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  return jwt.sign({ id, tokenVersion }, process.env.JWT_SECRET, {
    expiresIn,
  } as jwt.SignOptions);
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phoneNumber, countryCode = '+91', name, email, place } = body;

    if (!phoneNumber || !name || !email) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Phone number, name, and email are required',
          errors: ['MISSING_FIELDS'],
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
    });

    if (!user) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'User not found. Please login with OTP first.',
          errors: ['USER_NOT_FOUND'],
        },
        { status: 404 }
      );
    }

    const sanitizedName = sanitizeName(name);
    const sanitizedEmail = sanitizeEmail(email);
    const sanitizedPlace = place ? sanitizePlace(place) : null;

    if (sanitizedName.length < 2) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Name is too short after sanitization. Please provide a valid name.',
          errors: ['Name must contain at least 2 valid characters'],
        },
        { status: 400 }
      );
    }

    if (!sanitizedEmail || sanitizedEmail.length === 0) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Email is invalid after sanitization.',
          errors: ['Please provide a valid email address'],
        },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedEmail)) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Email format is invalid.',
          errors: ['Please provide a valid email address'],
        },
        { status: 400 }
      );
    }

    const nameParts = sanitizedName.split(/\s+/);
    const firstName = sanitizeName(nameParts[0] || sanitizedName);
    const lastName = nameParts.length > 1 ? sanitizeName(nameParts.slice(1).join(' ')) : '';

    if (firstName.length < 2) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'First name is too short.',
          errors: ['First name must contain at least 2 characters'],
        },
        { status: 400 }
      );
    }

    if (lastName && lastName.length > 0 && lastName.length < 2) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Last name is too short.',
          errors: ['Last name must contain at least 2 characters if provided'],
        },
        { status: 400 }
      );
    }

    user.profile.firstName = firstName;
    if (lastName && lastName.length >= 2) {
      user.profile.lastName = lastName;
    }
    user.profile.email = sanitizedEmail;
    if (sanitizedPlace && sanitizedPlace.length >= 2) {
      user.profile.place = sanitizedPlace;
    }

    user.isVerified = true;
    if (!user.registeredAt) {
      user.registeredAt = new Date();
    }
    user.updateLastLogin();

    await user.save();

    const token = generateToken(user._id.toString(), user.tokenVersion || 0);

    logger.info(`✅ User registered: ${formattedNumber}`);

    return NextResponse.json({
      status: 'success',
      message: 'Registration successful',
      data: {
        token,
        isFirstTimeLogin: false,
        isFlowlineStudent: false,
        requiresRegistration: false,
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
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Register error:', errorMessage);

    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Email already registered',
          errors: ['This email is already associated with another account'],
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        status: 'error',
        message: 'An error occurred during registration. Please try again.',
        errors: ['INTERNAL_SERVER_ERROR'],
      },
      { status: 500 }
    );
  }
}

