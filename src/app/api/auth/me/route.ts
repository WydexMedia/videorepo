import { NextRequest, NextResponse } from 'next/server';
import { protect } from '@/lib/middleware/auth';
import { safeProfile, safePreferences } from '@/lib/sanitize';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const authResult = await protect(req);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;

    return NextResponse.json({
      status: 'success',
      data: {
        user: {
          id: user._id,
          phoneNumber: user.phoneNumber,
          countryCode: user.countryCode,
          fullPhoneNumber: user.fullPhoneNumber,
          isVerified: user.isVerified,
          profile: safeProfile(user.profile),
          preferences: safePreferences(user.preferences),
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error: any) {
    logger.error('Get user error:', error.message || 'Unknown error');
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

