/**
 * Input validation and sanitization utilities
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateEmail(email: string): ValidationResult {
  if (!email) {
    return { valid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Please enter a valid email address' };
  }

  return { valid: true };
}

export function validateJourneyName(name: string): ValidationResult {
  if (!name) {
    return { valid: false, error: 'Journey name is required' };
  }

  if (name.length < 2) {
    return { valid: false, error: 'Journey name must be at least 2 characters' };
  }

  if (name.length > 100) {
    return { valid: false, error: 'Journey name must be less than 100 characters' };
  }

  return { valid: true };
}

export function validateFutureDate(date: Date | string): ValidationResult {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();

  if (isNaN(targetDate.getTime())) {
    return { valid: false, error: 'Please enter a valid date' };
  }

  if (targetDate <= now) {
    return { valid: false, error: 'Date must be in the future' };
  }

  return { valid: true };
}

export function validateNote(note: string, maxLength: number = 5000): ValidationResult {
  if (!note || !note.trim()) {
    return { valid: false, error: 'Note cannot be empty' };
  }

  if (note.length > maxLength) {
    return { valid: false, error: `Note must be less than ${maxLength} characters` };
  }

  return { valid: true };
}

export function validateFile(
  file: File,
  options: {
    maxSizeMB?: number;
    allowedTypes?: string[];
  } = {}
): ValidationResult {
  const { maxSizeMB = 10, allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] } = options;

  if (!file) {
    return { valid: false, error: 'No file selected' };
  }

  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return { valid: false, error: `File is too large (max ${maxSizeMB}MB)` };
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'File type not supported' };
  }

  return { valid: true };
}

export function sanitizeForHTML(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

export function sanitizeForStorage(str: string): string {
  if (!str) return '';
  return str
    .replace(/\0/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[^\S\n]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function sanitizeFilename(filename: string): string {
  if (!filename) return 'untitled';
  return filename
    .replace(/\.\./g, '')
    .replace(/[/\\]/g, '')
    .replace(/[<>:"|?*\x00-\x1F]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 255);
}

export function sanitizeURL(url: string): string | null {
  if (!url) return null;
  
  try {
    const parsed = new URL(url);
    
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    
    const lowercaseHref = parsed.href.toLowerCase();
    if (lowercaseHref.startsWith('javascript:') || lowercaseHref.startsWith('data:')) {
      return null;
    }
    
    return parsed.href;
  } catch {
    return null;
  }
}

export function isSafeString(str: string): boolean {
  const safeRegex = /^[\w\s.,!?'"()\-–—@#$%&*+=[\]{}:;]+$/u;
  return safeRegex.test(str);
}

export function truncate(str: string, maxLength: number): string {
  if (!str || str.length <= maxLength) return str;
  return str.slice(0, maxLength - 1) + '…';
}

export const sanitizeString = sanitizeForHTML;
