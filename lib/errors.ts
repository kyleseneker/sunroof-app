/**
 * Error handling utilities and custom error classes
 */

// Error classes

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code: string;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class AuthError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTH_ERROR');
    this.name = 'AuthError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends AppError {
  public readonly field?: string;
  
  constructor(message: string, field?: string) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
    this.field = field;
  }
}

export class RateLimitError extends AppError {
  public readonly retryAfter: number;
  
  constructor(retryAfter: number = 60) {
    super('Too many requests. Please try again later.', 429, 'RATE_LIMIT');
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class ExternalServiceError extends AppError {
  public readonly service: string;
  
  constructor(service: string, message?: string) {
    super(message || `${service} service unavailable`, 502, 'EXTERNAL_SERVICE_ERROR');
    this.name = 'ExternalServiceError';
    this.service = service;
  }
}

// Utilities

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error instanceof AppError && error.isOperational) {
      return error.message;
    }
    
    const message = error.message.toLowerCase();
    if (message.includes('network') || message.includes('fetch')) {
      return 'Network error. Please check your connection.';
    }
    if (message.includes('timeout')) {
      return 'Request timed out. Please try again.';
    }
    return 'Something went wrong. Please try again.';
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unexpected error occurred.';
}

export function getErrorStatusCode(error: unknown): number {
  if (error instanceof AppError) {
    return error.statusCode;
  }
  return 500;
}

export function logError(error: unknown, context?: Record<string, unknown>): void {
  const errorInfo = {
    message: error instanceof Error ? error.message : String(error),
    name: error instanceof Error ? error.name : 'Unknown',
    code: error instanceof AppError ? error.code : undefined,
    stack: error instanceof Error ? error.stack : undefined,
    ...context,
    timestamp: new Date().toISOString(),
  };
  console.error('[Error]', JSON.stringify(errorInfo, null, 2));
}

export function safeJSONParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

export function withErrorHandling<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      logError(error, { function: fn.name, args: args.map(String) });
      throw error;
    }
  }) as T;
}

export function createErrorResponse(error: unknown): {
  error: string;
  code: string;
  status: number;
} {
  if (error instanceof AppError) {
    return {
      error: error.message,
      code: error.code,
      status: error.statusCode,
    };
  }

  return {
    error: getErrorMessage(error),
    code: 'INTERNAL_ERROR',
    status: 500,
  };
}

// Result type for explicit error handling

export type Result<T, E = Error> = 
  | { ok: true; value: T }
  | { ok: false; error: E };

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

export async function tryCatch<T>(
  promise: Promise<T>
): Promise<Result<T, Error>> {
  try {
    const value = await promise;
    return ok(value);
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
