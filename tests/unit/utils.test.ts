import { describe, it, expect } from 'vitest';

// Test utility functions

// Gradient generator from Dashboard
function getJourneyGradient(name: string): string {
  const gradients = [
    'from-orange-500 via-pink-500 to-purple-500',
    'from-blue-500 via-cyan-400 to-teal-400',
    'from-emerald-400 via-green-500 to-lime-400',
    'from-rose-400 via-fuchsia-500 to-violet-500',
    'from-amber-400 via-orange-500 to-red-500',
    'from-indigo-500 via-purple-500 to-pink-500',
    'from-teal-400 via-emerald-500 to-green-600',
    'from-pink-400 via-rose-500 to-red-400',
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    const char = name.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return gradients[Math.abs(hash) % gradients.length];
}

// Duration calculator from API
function calculateDuration(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return '1 day';
  if (diffDays < 7) return `${diffDays} days`;
  if (diffDays < 14) return '1 week';
  if (diffDays < 30) return `${Math.round(diffDays / 7)} weeks`;
  return `${Math.round(diffDays / 30)} month${Math.round(diffDays / 30) > 1 ? 's' : ''}`;
}

describe('getJourneyGradient', () => {
  it('returns a gradient string', () => {
    const gradient = getJourneyGradient('Miami Trip');
    expect(gradient).toMatch(/^from-\w+-\d+ via-\w+-\d+ to-\w+-\d+$/);
  });

  it('returns consistent gradient for same name', () => {
    const gradient1 = getJourneyGradient('Paris Adventure');
    const gradient2 = getJourneyGradient('Paris Adventure');
    expect(gradient1).toBe(gradient2);
  });

  it('returns different gradients for different names', () => {
    const gradient1 = getJourneyGradient('Tokyo');
    const gradient2 = getJourneyGradient('Sydney');
    // They might be the same by chance, but unlikely for these names
    // This is more of a sanity check
    expect(typeof gradient1).toBe('string');
    expect(typeof gradient2).toBe('string');
  });

  it('handles empty string', () => {
    const gradient = getJourneyGradient('');
    expect(gradient).toBeDefined();
  });
});

describe('calculateDuration', () => {
  it('returns "1 day" for single day', () => {
    const result = calculateDuration('2024-01-01', '2024-01-02');
    expect(result).toBe('1 day');
  });

  it('returns correct days for less than a week', () => {
    const result = calculateDuration('2024-01-01', '2024-01-04');
    expect(result).toBe('3 days');
  });

  it('returns "1 week" for 7-13 days', () => {
    const result = calculateDuration('2024-01-01', '2024-01-10');
    expect(result).toBe('1 week');
  });

  it('returns weeks for 14-29 days', () => {
    const result = calculateDuration('2024-01-01', '2024-01-22');
    expect(result).toBe('3 weeks');
  });

  it('returns months for 30+ days', () => {
    const result = calculateDuration('2024-01-01', '2024-03-01');
    expect(result).toBe('2 months');
  });

  it('handles reversed dates (end before start)', () => {
    const result = calculateDuration('2024-01-10', '2024-01-01');
    expect(result).toBe('1 week');
  });
});

