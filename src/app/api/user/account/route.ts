import { NextRequest, NextResponse } from 'next/server';
import { protect } from '@/lib/middleware/auth';
import User from '@/models/User';
import { logger } from '@/lib/logger';
import { IUser } from '@/models/User';

export async function DELETE(req: NextRequest) {
  try {
    const authResult = await protect(req);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;
    
    // Type assertion: protect() ensures user is a valid User document if it returns { user }
    const userDoc = await User.findById((user as IUser)._id);

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

    userDoc.isActive = false;
    userDoc.lastLogout = new Date();
    userDoc.lastLogin = undefined;
    userDoc.incrementTokenVersion();
    await userDoc.save();

    return NextResponse.json({
      status: 'success',
      message: 'Account deactivated successfully',
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Deactivate account error:', errorMessage);
    return NextResponse.json(
      {
        status: 'error',
        message: 'An error occurred while deactivating account. Please try again.',
        errors: ['INTERNAL_SERVER_ERROR'],
      },
      { status: 500 }
    );
  }
}

