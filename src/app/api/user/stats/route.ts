import { NextRequest, NextResponse } from 'next/server';
import { protect } from '@/lib/middleware/auth';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const authResult = await protect(req);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;

    const stats = {
      accountCreated: user.createdAt,
      lastLogin: user.lastLogin,
      isVerified: user.isVerified,
      profileCompleted: !!(user.profile.firstName && user.profile.lastName),
      hasEmail: !!user.profile.email,
    };

    return NextResponse.json({
      status: 'success',
      data: {
        stats,
      },
    });
  } catch (error: any) {
    logger.error('Get user stats error:', error.message || 'Unknown error');
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

