import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import mongoose from 'mongoose';
import os from 'os';

const serverStartTime = Date.now();

const checkDatabase = async () => {
  try {
    const state = mongoose.connection.readyState;
    const states: Record<number, string> = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    if (state === 1) {
      await mongoose.connection.db.admin().ping();
      return {
        status: 'healthy',
        state: states[state] || 'unknown',
        host: mongoose.connection.host,
        database: mongoose.connection.name,
      };
    } else {
      return {
        status: 'unhealthy',
        state: states[state] || 'unknown',
        error: 'Database not connected',
      };
    }
  } catch (error: any) {
    return {
      status: 'unhealthy',
      error: error.message || 'Database check failed',
    };
  }
};

const getMemoryInfo = () => {
  const usage = process.memoryUsage();
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;

  return {
    process: {
      rss: Math.round(usage.rss / 1024 / 1024),
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
      external: Math.round(usage.external / 1024 / 1024),
      arrayBuffers: Math.round(usage.arrayBuffers / 1024 / 1024),
    },
    system: {
      total: Math.round(totalMemory / 1024 / 1024),
      free: Math.round(freeMemory / 1024 / 1024),
      used: Math.round(usedMemory / 1024 / 1024),
      usagePercent: Math.round((usedMemory / totalMemory) * 100),
    },
  };
};

const getProcessInfo = () => {
  const uptime = Date.now() - serverStartTime;

  const formatUptime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  return {
    pid: process.pid,
    uptime: {
      seconds: Math.floor(uptime / 1000),
      formatted: formatUptime(uptime),
    },
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    cpuUsage: process.cpuUsage(),
    env: process.env.NODE_ENV || 'development',
  };
};

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const checks = {
      timestamp: new Date().toISOString(),
      status: 'checking',
      uptime: Date.now() - serverStartTime,
      checks: {} as any,
    };

    checks.checks.database = await checkDatabase();
    checks.checks.memory = getMemoryInfo();
    checks.checks.process = getProcessInfo();

    const dbHealthy = checks.checks.database.status === 'healthy';
    const memoryUsage = checks.checks.memory.system.usagePercent;
    const memoryHealthy = memoryUsage < 90;

    if (dbHealthy && memoryHealthy) {
      checks.status = 'healthy';
      return NextResponse.json({
        status: 'success',
        message: 'All systems operational',
        data: checks,
      });
    } else {
      checks.status = 'degraded';
      const statusCode = !dbHealthy ? 503 : 200;
      return NextResponse.json(
        {
          status: 'warning',
          message: 'System health check shows issues',
          data: checks,
        },
        { status: statusCode }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Health check failed',
        error: error.message || 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}

