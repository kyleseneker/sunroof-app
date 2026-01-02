import { describe, it, expect } from 'vitest';
import {
  validateEmail,
  validateJourneyName,
  validateFutureDate,
  validateNote,
  validateFile,
  sanitizeString,
  isSafeString,
} from '@/lib';

describe('Validation Utilities', () => {
  describe('validateEmail', () => {
    it('returns error for empty email', () => {
      expect(validateEmail('')).toEqual({ valid: false, error: 'Email is required' });
    });

    it('returns error for invalid email', () => {
      expect(validateEmail('notanemail')).toEqual({ valid: false, error: 'Please enter a valid email address' });
      expect(validateEmail('missing@domain')).toEqual({ valid: false, error: 'Please enter a valid email address' });
      expect(validateEmail('@nodomain.com')).toEqual({ valid: false, error: 'Please enter a valid email address' });
    });

    it('returns valid for correct email', () => {
      expect(validateEmail('test@example.com')).toEqual({ valid: true });
      expect(validateEmail('user.name+tag@domain.co.uk')).toEqual({ valid: true });
    });
  });

  describe('validateJourneyName', () => {
    it('returns error for empty name', () => {
      expect(validateJourneyName('')).toEqual({ valid: false, error: 'Journey name is required' });
    });

    it('returns error for name too short', () => {
      expect(validateJourneyName('A')).toEqual({ valid: false, error: 'Journey name must be at least 2 characters' });
    });

    it('returns error for name too long', () => {
      const longName = 'A'.repeat(101);
      expect(validateJourneyName(longName)).toEqual({ valid: false, error: 'Journey name must be less than 100 characters' });
    });

    it('returns valid for correct name', () => {
      expect(validateJourneyName('Miami Trip')).toEqual({ valid: true });
      expect(validateJourneyName('AB')).toEqual({ valid: true });
    });
  });

  describe('validateFutureDate', () => {
    it('returns error for invalid date', () => {
      expect(validateFutureDate('not-a-date')).toEqual({ valid: false, error: 'Please enter a valid date' });
    });

    it('returns error for past date', () => {
      const pastDate = new Date(Date.now() - 1000);
      expect(validateFutureDate(pastDate)).toEqual({ valid: false, error: 'Date must be in the future' });
    });

    it('returns valid for future date', () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      expect(validateFutureDate(futureDate)).toEqual({ valid: true });
    });

    it('accepts string dates', () => {
      const futureString = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      expect(validateFutureDate(futureString)).toEqual({ valid: true });
    });
  });

  describe('validateNote', () => {
    it('returns error for empty note', () => {
      expect(validateNote('')).toEqual({ valid: false, error: 'Note cannot be empty' });
      expect(validateNote('   ')).toEqual({ valid: false, error: 'Note cannot be empty' });
    });

    it('returns error for note too long', () => {
      const longNote = 'A'.repeat(5001);
      expect(validateNote(longNote)).toEqual({ valid: false, error: 'Note must be less than 5000 characters' });
    });

    it('returns error for custom max length exceeded', () => {
      const note = 'A'.repeat(101);
      expect(validateNote(note, 100)).toEqual({ valid: false, error: 'Note must be less than 100 characters' });
    });

    it('returns valid for correct note', () => {
      expect(validateNote('This is a valid note')).toEqual({ valid: true });
    });
  });

  describe('validateFile', () => {
    const createMockFile = (size: number, type: string): File => {
      const blob = new Blob([new ArrayBuffer(size)], { type });
      return new File([blob], 'test.jpg', { type });
    };

    it('returns error for no file', () => {
      expect(validateFile(null as unknown as File)).toEqual({ valid: false, error: 'No file selected' });
    });

    it('returns error for file too large', () => {
      const largeFile = createMockFile(11 * 1024 * 1024, 'image/jpeg'); // 11MB
      expect(validateFile(largeFile)).toEqual({ valid: false, error: 'File is too large (max 10MB)' });
    });

    it('returns error for invalid file type', () => {
      const invalidFile = createMockFile(1024, 'application/pdf');
      expect(validateFile(invalidFile)).toEqual({ valid: false, error: 'File type not supported' });
    });

    it('returns valid for correct file', () => {
      const validFile = createMockFile(1024, 'image/jpeg');
      expect(validateFile(validFile)).toEqual({ valid: true });
    });

    it('respects custom max size', () => {
      const file = createMockFile(6 * 1024 * 1024, 'image/jpeg'); // 6MB
      expect(validateFile(file, { maxSizeMB: 5 })).toEqual({ valid: false, error: 'File is too large (max 5MB)' });
    });

    it('respects custom allowed types', () => {
      const file = createMockFile(1024, 'image/svg+xml');
      expect(validateFile(file, { allowedTypes: ['image/svg+xml'] })).toEqual({ valid: true });
    });
  });

  describe('sanitizeString', () => {
    it('escapes HTML entities', () => {
      // Note: sanitizeForHTML now also escapes forward slashes for extra safety
      expect(sanitizeString('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
      expect(sanitizeString('Tom & Jerry')).toBe('Tom &amp; Jerry');
      expect(sanitizeString("It's a test")).toBe('It&#x27;s a test');
    });

    it('handles normal strings', () => {
      expect(sanitizeString('Hello World')).toBe('Hello World');
    });
  });

  describe('isSafeString', () => {
    it('returns true for safe strings', () => {
      expect(isSafeString('Hello World!')).toBe(true);
      expect(isSafeString('Test 123')).toBe(true);
      expect(isSafeString("It's fine.")).toBe(true);
      // Now allows @ and ; characters for common use cases
      expect(isSafeString('test@email.com')).toBe(true);
      expect(isSafeString('var x = 1;')).toBe(true);
    });

    it('returns false for strings with HTML/script', () => {
      expect(isSafeString('<script>')).toBe(false);
      // Backticks and other dangerous characters are not allowed
      expect(isSafeString('`dangerous`')).toBe(false);
    });
  });
});

