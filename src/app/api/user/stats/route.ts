import { NextRequest, NextResponse } from 'next/server';
import { protect } from '@/lib/middleware/auth';
import { logger } from '@/lib/logger';
import { IUser } from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    const authResult = await protect(req);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;
    const userDoc = user as IUser;

    const stats = {
      accountCreated: userDoc.createdAt,
      lastLogin: userDoc.lastLogin,
      isVerified: userDoc.isVerified,
      profileCompleted: !!(userDoc.profile.firstName && userDoc.profile.lastName),
      hasEmail: !!userDoc.profile.email,
    };

    return NextResponse.json({
      status: 'success',
      data: {
        stats,
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Get user stats error:', errorMessage);
    return NextResponse.json(
      {
        status: 'error',
        message: 'An error occurred while fetching user stats. Please try again.',
        errors: ['INTERNAL_SERVER_ERROR'],
      },
      { status: 500 }
    );
  }
}

