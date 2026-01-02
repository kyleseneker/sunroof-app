import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  AppError,
  AuthError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  ExternalServiceError,
  isAppError,
  getErrorMessage,
  getErrorStatusCode,
  logError,
  safeJSONParse,
  createErrorResponse,
  ok,
  err,
  tryCatch,
} from '@/lib';

describe('Error Classes', () => {
  describe('AppError', () => {
    it('creates error with default values', () => {
      const error = new AppError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('INTERNAL_ERROR');
      expect(error.isOperational).toBe(true);
      expect(error.name).toBe('AppError');
    });

    it('creates error with custom values', () => {
      const error = new AppError('Custom error', 400, 'CUSTOM_CODE', false);
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('CUSTOM_CODE');
      expect(error.isOperational).toBe(false);
    });

    it('extends Error', () => {
      const error = new AppError('Test');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
    });
  });

  describe('AuthError', () => {
    it('creates 401 error with default message', () => {
      const error = new AuthError();
      expect(error.message).toBe('Authentication required');
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('AUTH_ERROR');
      expect(error.name).toBe('AuthError');
    });

    it('accepts custom message', () => {
      const error = new AuthError('Session expired');
      expect(error.message).toBe('Session expired');
    });
  });

  describe('ForbiddenError', () => {
    it('creates 403 error', () => {
      const error = new ForbiddenError();
      expect(error.message).toBe('Access denied');
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('FORBIDDEN');
    });
  });

  describe('NotFoundError', () => {
    it('creates 404 error with resource name', () => {
      const error = new NotFoundError('Journey');
      expect(error.message).toBe('Journey not found');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
    });

    it('uses default resource name', () => {
      const error = new NotFoundError();
      expect(error.message).toBe('Resource not found');
    });
  });

  describe('ValidationError', () => {
    it('creates 400 error with field', () => {
      const error = new ValidationError('Email is invalid', 'email');
      expect(error.message).toBe('Email is invalid');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.field).toBe('email');
    });

    it('works without field', () => {
      const error = new ValidationError('Invalid input');
      expect(error.field).toBeUndefined();
    });
  });

  describe('RateLimitError', () => {
    it('creates 429 error with retry after', () => {
      const error = new RateLimitError(120);
      expect(error.statusCode).toBe(429);
      expect(error.code).toBe('RATE_LIMIT');
      expect(error.retryAfter).toBe(120);
    });

    it('uses default retry after', () => {
      const error = new RateLimitError();
      expect(error.retryAfter).toBe(60);
    });
  });

  describe('ExternalServiceError', () => {
    it('creates 502 error with service name', () => {
      const error = new ExternalServiceError('OpenAI');
      expect(error.message).toBe('OpenAI service unavailable');
      expect(error.statusCode).toBe(502);
      expect(error.code).toBe('EXTERNAL_SERVICE_ERROR');
      expect(error.service).toBe('OpenAI');
    });

    it('accepts custom message', () => {
      const error = new ExternalServiceError('Stripe', 'Payment failed');
      expect(error.message).toBe('Payment failed');
    });
  });
});

describe('Error Utilities', () => {
  describe('isAppError', () => {
    it('returns true for AppError instances', () => {
      expect(isAppError(new AppError('test'))).toBe(true);
      expect(isAppError(new AuthError())).toBe(true);
      expect(isAppError(new ValidationError('test'))).toBe(true);
    });

    it('returns false for other errors', () => {
      expect(isAppError(new Error('test'))).toBe(false);
      expect(isAppError('error string')).toBe(false);
      expect(isAppError(null)).toBe(false);
      expect(isAppError(undefined)).toBe(false);
    });
  });

  describe('getErrorMessage', () => {
    it('returns message from AppError', () => {
      const error = new AuthError('Please log in');
      expect(getErrorMessage(error)).toBe('Please log in');
    });

    it('returns friendly message for network errors', () => {
      const error = new Error('Failed to fetch');
      expect(getErrorMessage(error)).toBe('Network error. Please check your connection.');
    });

    it('returns friendly message for timeout errors', () => {
      const error = new Error('Request timeout');
      expect(getErrorMessage(error)).toBe('Request timed out. Please try again.');
    });

    it('returns generic message for unknown errors', () => {
      const error = new Error('Some internal error');
      expect(getErrorMessage(error)).toBe('Something went wrong. Please try again.');
    });

    it('handles string errors', () => {
      expect(getErrorMessage('Error string')).toBe('Error string');
    });

    it('handles non-error values', () => {
      expect(getErrorMessage(null)).toBe('An unexpected error occurred.');
      expect(getErrorMessage(123)).toBe('An unexpected error occurred.');
    });
  });

  describe('getErrorStatusCode', () => {
    it('returns status code from AppError', () => {
      expect(getErrorStatusCode(new AuthError())).toBe(401);
      expect(getErrorStatusCode(new NotFoundError())).toBe(404);
      expect(getErrorStatusCode(new RateLimitError())).toBe(429);
    });

    it('returns 500 for non-AppError', () => {
      expect(getErrorStatusCode(new Error())).toBe(500);
      expect(getErrorStatusCode('error')).toBe(500);
    });
  });

  describe('logError', () => {
    let consoleSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('logs error with context', () => {
      const error = new AppError('Test error', 400, 'TEST');
      logError(error, { userId: '123' });
      
      expect(consoleSpy).toHaveBeenCalledOnce();
      const loggedData = JSON.parse(consoleSpy.mock.calls[0][1]);
      expect(loggedData.message).toBe('Test error');
      expect(loggedData.code).toBe('TEST');
      expect(loggedData.userId).toBe('123');
    });

    it('handles non-Error values', () => {
      logError('string error');
      expect(consoleSpy).toHaveBeenCalledOnce();
    });
  });

  describe('safeJSONParse', () => {
    it('parses valid JSON', () => {
      const result = safeJSONParse('{"key": "value"}', {});
      expect(result).toEqual({ key: 'value' });
    });

    it('returns fallback for invalid JSON', () => {
      const fallback = { default: true };
      const result = safeJSONParse('not json', fallback);
      expect(result).toBe(fallback);
    });

    it('returns fallback for empty string', () => {
      const result = safeJSONParse('', []);
      expect(result).toEqual([]);
    });
  });

  describe('createErrorResponse', () => {
    it('creates response from AppError', () => {
      const error = new ValidationError('Invalid email', 'email');
      const response = createErrorResponse(error);
      
      expect(response).toEqual({
        error: 'Invalid email',
        code: 'VALIDATION_ERROR',
        status: 400,
      });
    });

    it('creates generic response for unknown errors', () => {
      const response = createErrorResponse(new Error('Internal'));
      
      expect(response).toEqual({
        error: 'Something went wrong. Please try again.',
        code: 'INTERNAL_ERROR',
        status: 500,
      });
    });
  });
});

describe('Result Type', () => {
  describe('ok', () => {
    it('creates success result', () => {
      const result = ok(42);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(42);
      }
    });
  });

  describe('err', () => {
    it('creates error result', () => {
      const error = new Error('Failed');
      const result = err(error);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe(error);
      }
    });
  });

  describe('tryCatch', () => {
    it('returns ok for successful promise', async () => {
      const result = await tryCatch(Promise.resolve('success'));
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('success');
      }
    });

    it('returns err for rejected promise', async () => {
      const result = await tryCatch(Promise.reject(new Error('Failed')));
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('Failed');
      }
    });

    it('wraps non-Error rejections', async () => {
      const result = await tryCatch(Promise.reject('string error'));
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(Error);
        expect(result.error.message).toBe('string error');
      }
    });
  });
});

