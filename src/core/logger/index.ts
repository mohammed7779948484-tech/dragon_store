/**
 * Logger - Centralized logging with Sentry integration
 * 
 * Features:
 * - Structured JSON logging in production
 * - Console logging in development
 * - Automatic Sentry error reporting
 * - Log levels: debug, info, warn, error
 */

import * as Sentry from '@sentry/nextjs'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: unknown
}

class Logger {
  private level: LogLevel
  private isProduction: boolean

  constructor() {
    this.level = (process.env.LOG_LEVEL as LogLevel) || 'info'
    this.isProduction = process.env.NODE_ENV === 'production'
  }

  /**
   * Log a debug message
   */
  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context)
  }

  /**
   * Log an info message
   */
  info(message: string, context?: LogContext): void {
    this.log('info', message, context)
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context)
  }

  /**
   * Log an error message and report to Sentry in production
   */
  error(error: Error | string, context?: LogContext): void {
    const errorObj = error instanceof Error ? error : new Error(error)
    
    this.log('error', errorObj.message, {
      ...context,
      stack: errorObj.stack,
      name: errorObj.name,
    })

    // Report to Sentry in production
    if (this.isProduction) {
      if (error instanceof Error) {
        if (context) {
          Sentry.captureException(error, { extra: context })
        } else {
          Sentry.captureException(error)
        }
      } else {
        if (context) {
          Sentry.captureMessage(error, { extra: context })
        } else {
          Sentry.captureMessage(error)
        }
      }
    }
  }

  /**
   * Internal log method
   */
  private log(level: LogLevel, message: string, context?: LogContext): void {
    // Skip if level is below configured level
    if (!this.shouldLog(level)) {
      return
    }

    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...context,
    }

    if (this.isProduction) {
      // Structured JSON logging in production
      console.log(JSON.stringify(logEntry))
    } else {
      // Pretty console logging in development
      const color = this.getColor(level)
      console.log(
        `${color}[${timestamp}] ${level.toUpperCase()}: ${message}\x1b[0m`,
        context ? '\n' + JSON.stringify(context, null, 2) : ''
      )
    }
  }

  /**
   * Check if we should log at this level
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error']
    const configuredIndex = levels.indexOf(this.level)
    const currentIndex = levels.indexOf(level)
    
    return currentIndex >= configuredIndex
  }

  /**
   * Get ANSI color for log level
   */
  private getColor(level: LogLevel): string {
    switch (level) {
      case 'debug':
        return '\x1b[36m' // Cyan
      case 'info':
        return '\x1b[32m' // Green
      case 'warn':
        return '\x1b[33m' // Yellow
      case 'error':
        return '\x1b[31m' // Red
      default:
        return '\x1b[0m' // Reset
    }
  }
}

// Export singleton instance
export const logger = new Logger()
export { Logger }
