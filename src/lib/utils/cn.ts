/**
 * Utility for composing Tailwind CSS classes
 */

// Accepts common falsy values that conditional expressions might produce
type ClassValue = string | undefined | null | boolean | number | bigint;

export function cn(...inputs: ClassValue[]): string {
  return inputs
    .filter((x): x is string => typeof x === 'string' && x.length > 0)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}
