export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG'
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: any;
}

export class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private log(level: LogLevel, message: string, context?: any) {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context
    };

    this.logs.push(logEntry);

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      const logMessage = `[${logEntry.timestamp}] ${level}: ${message}`;
      switch (level) {
        case LogLevel.ERROR:
          console.error(logMessage, context);
          break;
        case LogLevel.WARN:
          console.warn(logMessage, context);
          break;
        case LogLevel.INFO:
          console.info(logMessage, context);
          break;
        case LogLevel.DEBUG:
          console.debug(logMessage, context);
          break;
      }
    }
  }

  error(message: string, context?: any) {
    this.log(LogLevel.ERROR, message, context);
  }

  warn(message: string, context?: any) {
    this.log(LogLevel.WARN, message, context);
  }

  info(message: string, context?: any) {
    this.log(LogLevel.INFO, message, context);
  }

  debug(message: string, context?: any) {
    this.log(LogLevel.DEBUG, message, context);
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }
}

export const logger = Logger.getInstance();