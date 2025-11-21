/**
 * Logger utility that respects NODE_ENV
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

const getLogLevel = () => {
  if (isProduction) {
    return LOG_LEVELS.INFO;
  }
  return LOG_LEVELS.DEBUG;
};

const currentLogLevel = getLogLevel();

export const logger = {
  error: (...args: any[]) => {
    if (currentLogLevel >= LOG_LEVELS.ERROR) {
      console.error(...args);
    }
  },
  warn: (...args: any[]) => {
    if (currentLogLevel >= LOG_LEVELS.WARN) {
      console.warn(...args);
    }
  },
  info: (...args: any[]) => {
    if (currentLogLevel >= LOG_LEVELS.INFO) {
      console.log(...args);
    }
  },
  debug: (...args: any[]) => {
    if (currentLogLevel >= LOG_LEVELS.DEBUG) {
      console.log(...args);
    }
  },
  log: (...args: any[]) => {
    if (currentLogLevel >= LOG_LEVELS.INFO) {
      console.log(...args);
    }
  },
};

