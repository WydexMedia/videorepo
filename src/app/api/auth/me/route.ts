import { NextRequest, NextResponse } from 'next/server';
import { protect } from '@/lib/middleware/auth';
import { safeProfile, safePreferences } from '@/lib/sanitize';
import { logger } from '@/lib/logger';
import { IUser } from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    const authResult = await protect(req);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;
    
    // Type assertion: protect() ensures user is a valid User document if it returns { user }
    const userDoc = user as IUser;

    return NextResponse.json({
      status: 'success',
      data: {
        user: {
          id: userDoc._id,
          phoneNumber: userDoc.phoneNumber,
          countryCode: userDoc.countryCode,
          fullPhoneNumber: userDoc.fullPhoneNumber,
          isVerified: userDoc.isVerified,
          profile: safeProfile(userDoc.profile),
          preferences: safePreferences(userDoc.preferences),
          lastLogin: userDoc.lastLogin,
          createdAt: userDoc.createdAt,
        },
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Get user error:', errorMessage);
    return NextResponse.json(
      {
        status: 'error',
        message: 'An error occurred while fetching user data. Please try again.',
        errors: ['INTERNAL_SERVER_ERROR'],
      },
      { status: 500 }
    );
  }
}

