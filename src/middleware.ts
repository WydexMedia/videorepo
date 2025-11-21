import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rate limiting store (in-memory for basic implementation)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 100; // 100 requests per window

function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0]?.trim() || realIP || 'unknown';
  return ip;
}

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }

  record.count++;
  return true;
}

export function middleware(request: NextRequest) {
  // Skip rate limiting for OPTIONS requests (CORS preflight)
  if (request.method === 'OPTIONS') {
    return NextResponse.next();
  }

  // Only apply rate limiting to API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const ip = getClientIP(request);
    const identifier = `api:${ip}`;

    if (!checkRateLimit(identifier)) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Too many requests from this IP, please try again later.',
          errors: ['RATE_LIMIT_EXCEEDED'],
        },
        {
          status: 429,
          headers: {
            'Retry-After': '900', // 15 minutes in seconds
          },
        }
      );
    }
  }

  // CORS headers for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin');
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isProduction = process.env.NODE_ENV === 'production';

    const allowedOrigins: string[] = [];

    if (isDevelopment) {
      allowedOrigins.push('http://localhost:3000', 'http://localhost:3001');
    }

    if (isProduction && process.env.FRONTEND_URL) {
      allowedOrigins.push(process.env.FRONTEND_URL);
    } else if (!isProduction && process.env.FRONTEND_URL) {
      allowedOrigins.push(process.env.FRONTEND_URL);
    }

    const validOrigins = allowedOrigins.filter(Boolean);

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      const response = new NextResponse(null, { status: 200 });
      if (origin && validOrigins.includes(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin);
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        response.headers.set('Access-Control-Allow-Credentials', 'true');
        response.headers.set('Access-Control-Max-Age', '86400');
      }
      return response;
    }

    // For actual requests, add CORS headers
    const response = NextResponse.next();
    if (origin && validOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
  ],
};

