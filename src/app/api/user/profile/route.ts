import { NextRequest, NextResponse } from 'next/server';
import { protect } from '@/lib/middleware/auth';
import User from '@/models/User';
import { sanitizeName, sanitizeEmail, sanitizePlace, safeProfileForOutput, safePreferences } from '@/lib/sanitize';
import { logger } from '@/lib/logger';
import { IUser } from '@/models/User';

export async function PUT(req: NextRequest) {
  try {
    const authResult = await protect(req);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;
    const body = await req.json();
    const { firstName, lastName, email, place } = body;

    const updateData: Record<string, string> = {};

    if (firstName) {
      const sanitized = sanitizeName(firstName);
      if (sanitized.length < 2) {
        return NextResponse.json(
          {
            status: 'error',
            message: 'First name is too short after sanitization.',
            errors: ['First name must contain at least 2 valid characters'],
          },
          { status: 400 }
        );
      }
      updateData['profile.firstName'] = sanitized;
    }

    if (lastName) {
      const sanitized = sanitizeName(lastName);
      if (sanitized.length < 2) {
        return NextResponse.json(
          {
            status: 'error',
            message: 'Last name is too short after sanitization.',
            errors: ['Last name must contain at least 2 valid characters'],
          },
          { status: 400 }
        );
      }
      updateData['profile.lastName'] = sanitized;
    }

    if (email) {
      const sanitized = sanitizeEmail(email);
      if (!sanitized || sanitized.length === 0) {
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
      if (!emailRegex.test(sanitized)) {
        return NextResponse.json(
          {
            status: 'error',
            message: 'Email format is invalid.',
            errors: ['Please provide a valid email address'],
          },
          { status: 400 }
        );
      }

      updateData['profile.email'] = sanitized;
    }

    if (place) {
      const sanitized = sanitizePlace(place);
      if (sanitized.length < 2) {
        return NextResponse.json(
          {
            status: 'error',
            message: 'Place is too short after sanitization.',
            errors: ['Place must contain at least 2 valid characters'],
          },
          { status: 400 }
        );
      }
      updateData['profile.place'] = sanitized;
    }

    const updatedUser = await User.findByIdAndUpdate((user as IUser)._id, { $set: updateData }, { new: true, runValidators: true })
      .select('-otp -otpExpires')
      .lean();

    return NextResponse.json({
      status: 'success',
      message: 'Profile updated successfully',
      data: {
        user: {
          id: updatedUser!._id,
          phoneNumber: updatedUser!.phoneNumber,
          countryCode: updatedUser!.countryCode,
          fullPhoneNumber: updatedUser!.fullPhoneNumber,
          isVerified: updatedUser!.isVerified,
          profile: safeProfileForOutput(updatedUser!.profile),
          preferences: safePreferences(updatedUser!.preferences),
          lastLogin: updatedUser!.lastLogin,
          updatedAt: updatedUser!.updatedAt,
        },
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Update profile error:', errorMessage);
    return NextResponse.json(
      {
        status: 'error',
        message: 'An error occurred while updating profile. Please try again.',
        errors: ['INTERNAL_SERVER_ERROR'],
      },
      { status: 500 }
    );
  }
}

