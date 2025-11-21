import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import mongoose from 'mongoose';

const checkDatabase = async () => {
  try {
    const state = mongoose.connection.readyState;
    if (state === 1 && mongoose.connection.db) {
      await mongoose.connection.db.admin().ping();
      return { status: 'healthy' };
    } else {
      return { status: 'unhealthy', error: 'Database not connected' };
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Database check failed';
    return { status: 'unhealthy', error: errorMessage };
  }
};

export async function GET() {
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
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        status: 'error',
        message: 'Server is not ready',
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}

