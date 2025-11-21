import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import mongoose from 'mongoose';

const checkDatabase = async () => {
  try {
    const state = mongoose.connection.readyState;
    if (state === 1) {
      await mongoose.connection.db.admin().ping();
      return { status: 'healthy' };
    } else {
      return { status: 'unhealthy', error: 'Database not connected' };
    }
  } catch (error: any) {
    return { status: 'unhealthy', error: error.message || 'Database check failed' };
  }
};

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const dbCheck = await checkDatabase();

    if (dbCheck.status === 'healthy') {
      return NextResponse.json({
        status: 'success',
        message: 'Server is ready',
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Server is not ready',
          error: 'Database connection failed',
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Server is not ready',
        error: error.message || 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}

