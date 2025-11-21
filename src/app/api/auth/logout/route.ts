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
    if (!user || typeof user !== 'object' || !('_id' in user)) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Invalid user data',
          errors: ['INVALID_USER'],
        },
        { status: 401 }
      );
    }
    const userId = typeof user._id === 'string' ? user._id : String(user._id);
    const userDoc = await User.findById(userId);
    
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

    userDoc.updateLastLogout();
    userDoc.incrementTokenVersion();
    await userDoc.save();

    return NextResponse.json({
      status: 'success',
      message: 'Logout successful',
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Logout error:', errorMessage);
    return NextResponse.json(
      {
        status: 'error',
        message: 'An error occurred during logout. Please try again.',
        errors: ['INTERNAL_SERVER_ERROR'],
      },
      { status: 500 }
    );
  }
}

