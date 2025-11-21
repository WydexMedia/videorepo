import { NextRequest, NextResponse } from 'next/server';
import { protect } from '@/lib/middleware/auth';
import User from '@/models/User';
import { safePreferences } from '@/lib/sanitize';
import { logger } from '@/lib/logger';

export async function PUT(req: NextRequest) {
  try {
    const authResult = await protect(req);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;
    const body = await req.json();
    const { language, notifications } = body;

    const updateData: any = {};

    if (language) {
      const validLanguages = ['en', 'hi', 'es', 'fr', 'de'];
      if (!validLanguages.includes(language)) {
        return NextResponse.json(
          {
            status: 'error',
            message: 'Invalid language selection',
            errors: ['LANGUAGE_INVALID'],
          },
          { status: 400 }
        );
      }
      updateData['preferences.language'] = language;
    }

    if (typeof notifications === 'boolean') {
      updateData['preferences.notifications'] = notifications;
    }

    const updatedUser = await User.findByIdAndUpdate(user._id, { $set: updateData }, { new: true, runValidators: true })
      .select('-otp -otpExpires')
      .lean();

    return NextResponse.json({
      status: 'success',
      message: 'Preferences updated successfully',
      data: {
        preferences: safePreferences(updatedUser!.preferences),
      },
    });
  } catch (error: any) {
    logger.error('Update preferences error:', error.message || 'Unknown error');
    return NextResponse.json(
      {
        status: 'error',
        message: 'An error occurred while updating preferences. Please try again.',
        errors: ['INTERNAL_SERVER_ERROR'],
      },
      { status: 500 }
    );
  }
}

