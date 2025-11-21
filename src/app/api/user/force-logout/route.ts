import { NextRequest, NextResponse } from 'next/server';
import { protect } from '@/lib/middleware/auth';
import User from '@/models/User';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const authResult = await protect(req);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;
    const userDoc = await User.findById(user._id);

    if (!userDoc) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'User not found',
          errors: ['USER_NOT_FOUND'],
        },
        { status: 404 }
      );
    }

    const newTokenVersion = userDoc.incrementTokenVersion();
    await userDoc.save();

    return NextResponse.json({
      status: 'success',
      message: 'All sessions have been invalidated. Please login again.',
      data: {
        tokenVersion: newTokenVersion,
      },
    });
  } catch (error: any) {
    logger.error('Force logout error:', error.message || 'Unknown error');
    return NextResponse.json(
      {
        status: 'error',
        message: 'An error occurred during force logout. Please try again.',
        errors: ['INTERNAL_SERVER_ERROR'],
      },
      { status: 500 }
    );
  }
}

