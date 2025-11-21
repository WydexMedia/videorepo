# Backend Migration to Next.js API Routes

This document describes the migration of the Node.js/Express backend (`video-BE`) into Next.js API routes for a unified codebase.

## What Was Migrated

### 1. Database & Models
- **Location**: `src/lib/db.ts` - MongoDB connection with Next.js caching
- **Location**: `src/models/User.ts` - User model with Mongoose schema
- All user-related functionality (OTP, authentication, profile management)

### 2. Utility Functions
- **Location**: `src/lib/`
  - `phoneUtils.ts` - Phone number validation and formatting
  - `sanitize.ts` - Input sanitization and XSS prevention
  - `smsService.ts` - Twilio SMS service integration
  - `logger.ts` - Environment-aware logging utility

### 3. Middleware
- **Location**: `src/lib/middleware/auth.ts` - Authentication middleware
- **Location**: `src/middleware.ts` - Global Next.js middleware (CORS, rate limiting)

### 4. API Routes

#### Auth Routes (`/api/auth/`)
- `POST /api/auth/send-otp` - Send OTP to phone number
- `POST /api/auth/verify-otp` - Verify OTP and login
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/resend-otp` - Resend OTP
- `POST /api/auth/register` - Register user with additional details

#### User Routes (`/api/user/`)
- `PUT /api/user/profile` - Update user profile
- `PUT /api/user/preferences` - Update user preferences
- `DELETE /api/user/account` - Deactivate user account
- `POST /api/user/force-logout` - Force logout (invalidate all tokens)
- `GET /api/user/stats` - Get user statistics

#### Video Routes (`/api/videos`)
- `GET /api/videos` - Get all videos from S3 (with pagination, sorting)

#### Health Routes (`/api/health`)
- `GET /api/health` - Comprehensive health check
- `GET /api/health/live` - Liveness probe
- `GET /api/health/ready` - Readiness probe

## Environment Variables Required

Create a `.env.local` file in the `videorepo` directory with the following variables:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/your-database
FLOWLINE_MONGODB_URI=mongodb://localhost:27017/flowline-database

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Twilio (SMS)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number

# AWS S3 (Videos)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET_NAME=your-bucket-name
CLOUDFRONT_DOMAIN=your-cloudfront-domain (optional)
USE_CLOUDFRONT=false (optional)
USE_PRESIGNED_URLS=false (optional)

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Node Environment
NODE_ENV=development
```

## Installation

1. Install dependencies:
```bash
cd videorepo
npm install
```

2. Set up environment variables (see above)

3. Run the development server:
```bash
npm run dev
```

## Key Differences from Express Backend

1. **Route Handlers**: Next.js API routes use `export async function GET/POST/etc()` instead of Express router
2. **Middleware**: Authentication is handled via helper functions rather than Express middleware
3. **CORS**: Handled in Next.js middleware.ts instead of Express CORS middleware
4. **Rate Limiting**: Implemented in Next.js middleware.ts (in-memory store, can be upgraded to Redis/MongoDB)
5. **Error Handling**: Uses NextResponse.json() instead of Express res.json()

## API Client Update

The frontend API client (`src/lib/api.ts`) has been updated to use local API routes (`/api`) instead of a separate backend server. The `API_BASE_URL` now defaults to `/api` instead of `http://localhost:5001/api`.

## Next Steps

1. **Rate Limiting**: Consider upgrading to MongoDB-based rate limiting for production (similar to the original backend)
2. **Structured Logging**: Add structured logging middleware if needed
3. **Testing**: Add tests for the API routes
4. **Deployment**: Update deployment configuration to use Next.js instead of separate backend server

## Notes

- The Flowline database integration is preserved
- All security features (input sanitization, XSS prevention, token versioning) are maintained
- OTP generation uses hardcoded "000000" in development mode (same as original backend)
- The original `video-BE` folder can be removed after verifying the migration works correctly

