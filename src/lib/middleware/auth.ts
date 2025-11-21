import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import User from '@/models/User';
import connectDB from '@/lib/db';
import { logger } from '@/lib/logger';

const isDevelopment = process.env.NODE_ENV === 'development';

export interface AuthRequest extends NextRequest {
  user?: any;
}

/**
 * Protect routes - require authentication
 */
export async function protect(req: NextRequest): Promise<{ user: any } | NextResponse> {
  try {
    let token: string | null = null;

    const authHeader = req.headers.get('authorization');

    if (authHeader) {
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7).trim();
      } else {
        return NextResponse.json(
          {
            status: 'error',
            message: 'Invalid authorization header format. Expected "Bearer <token>".',
            errors: ['INVALID_AUTH_HEADER'],
          },
          { status: 401 }
        );
      }
    }

    if (!token || token.length === 0) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Access denied. No token provided.',
          errors: ['NO_TOKEN'],
        },
        { status: 401 }
      );
    }

    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Invalid token format.',
          errors: ['INVALID_TOKEN_FORMAT'],
        },
        { status: 401 }
      );
    }

    if (!process.env.JWT_SECRET) {
      logger.error('JWT_SECRET is not configured');
      return NextResponse.json(
        {
          status: 'error',
          message: 'Server configuration error. Please contact support.',
          errors: ['SERVER_CONFIG_ERROR'],
        },
        { status: 500 }
      );
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError: any) {
      if (jwtError.name === 'TokenExpiredError') {
        return NextResponse.json(
          {
            status: 'error',
            message: 'Token has expired. Please login again.',
            errors: ['TOKEN_EXPIRED'],
          },
          { status: 401 }
        );
      }

      if (jwtError.name === 'JsonWebTokenError') {
        return NextResponse.json(
          {
            status: 'error',
            message: 'Invalid token. Please login again.',
            errors: ['INVALID_TOKEN'],
          },
          { status: 401 }
        );
      }

      if (jwtError.name === 'NotBeforeError') {
        return NextResponse.json(
          {
            status: 'error',
            message: 'Token not yet valid.',
            errors: ['TOKEN_NOT_ACTIVE'],
          },
          { status: 401 }
        );
      }

      throw jwtError;
    }

    if (!decoded || !decoded.id) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Token is missing required information.',
          errors: ['INVALID_TOKEN_PAYLOAD'],
        },
        { status: 401 }
      );
    }

    if (typeof decoded.id !== 'string' || decoded.id.length !== 24) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Token contains invalid user identifier.',
          errors: ['INVALID_USER_ID'],
        },
        { status: 401 }
      );
    }

    await connectDB();
    const user = await User.findById(decoded.id).select('-otp -otpExpires');

    if (!user) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Token is not valid. User not found.',
          errors: ['USER_NOT_FOUND'],
        },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'User account is deactivated.',
          errors: ['ACCOUNT_DEACTIVATED'],
        },
        { status: 401 }
      );
    }

    const tokenVersion = decoded.tokenVersion !== undefined ? decoded.tokenVersion : 0;
    const userTokenVersion = user.tokenVersion || 0;

    if (tokenVersion !== userTokenVersion) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Token has been invalidated. Please login again.',
          errors: ['TOKEN_INVALIDATED'],
        },
        { status: 401 }
      );
    }

    return { user };
  } catch (error: any) {
    logger.error('Auth middleware error:', error?.message || 'Unknown authentication error');
    return NextResponse.json(
      {
        status: 'error',
        message: 'Server error in authentication.',
        errors: ['AUTH_MIDDLEWARE_ERROR'],
      },
      { status: 500 }
    );
  }
}

/**
 * Optional auth - doesn't require authentication but adds user if token is valid
 */
export async function optionalAuth(req: NextRequest): Promise<any | null> {
  try {
    let token: string | null = null;

    try {
      const authHeader = req.headers.get('authorization');
      if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7).trim();
      }
    } catch (headerError) {
      return null;
    }

    if (!token || typeof token !== 'string' || token.length === 0) {
      return null;
    }

    if (!process.env.JWT_SECRET) {
      return null;
    }

    const tokenParts = token.split('.');
    if (tokenParts && tokenParts.length === 3) {
      try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET);

        if (
          decoded &&
          decoded.id &&
          typeof decoded.id === 'string' &&
          decoded.id.length === 24
        ) {
          try {
            await connectDB();
            const user = await User.findById(decoded.id).select('-otp -otpExpires').lean();

            if (user && user.isActive) {
              const tokenVersion = decoded.tokenVersion !== undefined ? decoded.tokenVersion : 0;
              const userTokenVersion = user.tokenVersion || 0;

              if (tokenVersion === userTokenVersion) {
                return user;
              }
            }
          } catch (dbError: any) {
            logger.debug('Optional auth - database error:', dbError.message);
          }
        }
      } catch (jwtError: any) {
        if (isDevelopment && jwtError && jwtError.name) {
          logger.debug('Optional auth - token verification error:', jwtError.message);
        }
      }
    }

    return null;
  } catch (error: any) {
    logger.error('Optional auth - unexpected error:', error?.message || 'Unknown error');
    return null;
  }
}

