import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { validatePhoneNumber } from '@/lib/phoneUtils';
import { smsService } from '@/lib/smsService';
import { logger } from '@/lib/logger';

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

    const { formattedNumber } = phoneValidation;
    
    if (!formattedNumber) {
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

    const user = await User.findOne({
      fullPhoneNumber: formattedNumber,
      isActive: true,
    });

    if (!user) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'User not found. Please register first.',
          errors: ['USER_NOT_FOUND'],
        },
        { status: 404 }
      );
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

    return NextResponse.json({
      status: 'success',
      message: 'OTP resent successfully',
      data: {
        phoneNumber: phoneValidation.phoneNumber,
        countryCode: phoneValidation.countryCode,
        expiresIn: '10 minutes',
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Resend OTP error:', errorMessage);
    return NextResponse.json(
      {
        status: 'error',
        message: 'An error occurred while resending OTP. Please try again.',
        errors: ['INTERNAL_SERVER_ERROR'],
      },
      { status: 500 }
    );
  }
}

