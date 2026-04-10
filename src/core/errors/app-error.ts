/**
 * AppError - Hierarchical error handling class
 * Extends Error with HTTP status codes and error codes for consistent error handling
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly status: number = 500,
    public readonly code: string = 'INTERNAL_ERROR',
    public readonly cause?: Error
  ) {
    super(message)
    this.name = 'AppError'
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError)
    }
  }

  /**
   * Check if this error is a specific type
   */
  isCode(errorCode: string): boolean {
    return this.code === errorCode
  }

  /**
   * Get the full error chain
   */
  getErrorChain(): string[] {
    const chain: string[] = [this.message]
    let current: Error | undefined = this.cause
    
    while (current) {
      chain.push(current.message)
      current = (current as AppError).cause
    }
    
    return chain
  }
}

/**
 * Common HTTP status codes as error classes
 */
export class BadRequestError extends AppError {
  constructor(message: string, code?: string, cause?: Error) {
    super(message, 400, code || 'BAD_REQUEST', cause)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', code?: string, cause?: Error) {
    super(message, 401, code || 'UNAUTHORIZED', cause)
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden', code?: string, cause?: Error) {
    super(message, 403, code || 'FORBIDDEN', cause)
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, code?: string, cause?: Error) {
    super(message, 404, code || 'NOT_FOUND', cause)
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded', code?: string, cause?: Error) {
    super(message, 429, code || 'RATE_LIMITED', cause)
  }
}

export class ValidationError extends AppError {
  constructor(message: string, code?: string, cause?: Error) {
    super(message, 422, code || 'VALIDATION_ERROR', cause)
  }
}
