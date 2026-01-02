import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatRelativeDate,
  formatDate,
  formatDateTime,
  formatCountdown,
  isPast,
  isToday,
  getTimeOfDay,
  getGreeting,
  getTimeUntilUnlock,
  isJourneyUnlocked,
} from '@/lib';

describe('Date Utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T14:30:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('formatRelativeDate', () => {
    it('returns "just now" for recent times', () => {
      const now = new Date();
      expect(formatRelativeDate(now)).toBe('just now');
      
      const fiveSecondsAgo = new Date(Date.now() - 5000);
      expect(formatRelativeDate(fiveSecondsAgo)).toBe('just now');
    });

    it('formats minutes ago', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      expect(formatRelativeDate(fiveMinutesAgo)).toBe('5 minutes ago');
      
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
      expect(formatRelativeDate(oneMinuteAgo)).toBe('1 minute ago');
    });

    it('formats hours ago', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      expect(formatRelativeDate(twoHoursAgo)).toBe('2 hours ago');
      
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      expect(formatRelativeDate(oneHourAgo)).toBe('1 hour ago');
    });

    it('formats days ago', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      expect(formatRelativeDate(threeDaysAgo)).toBe('3 days ago');
      
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      expect(formatRelativeDate(oneDayAgo)).toBe('1 day ago');
    });

    it('formats weeks ago', () => {
      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      expect(formatRelativeDate(twoWeeksAgo)).toBe('2 weeks ago');
      
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      expect(formatRelativeDate(oneWeekAgo)).toBe('1 week ago');
    });

    it('formats months ago', () => {
      const twoMonthsAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
      expect(formatRelativeDate(twoMonthsAgo)).toBe('2 months ago');
      
      const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      expect(formatRelativeDate(oneMonthAgo)).toBe('1 month ago');
    });

    it('formats years ago', () => {
      const twoYearsAgo = new Date(Date.now() - 730 * 24 * 60 * 60 * 1000);
      expect(formatRelativeDate(twoYearsAgo)).toBe('2 years ago');
      
      const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      expect(formatRelativeDate(oneYearAgo)).toBe('1 year ago');
    });

    it('formats future times', () => {
      const inFiveMinutes = new Date(Date.now() + 5 * 60 * 1000);
      expect(formatRelativeDate(inFiveMinutes)).toBe('in 5 minutes');
      
      const inTwoHours = new Date(Date.now() + 2 * 60 * 60 * 1000);
      expect(formatRelativeDate(inTwoHours)).toBe('in 2 hours');
      
      const inThreeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      expect(formatRelativeDate(inThreeDays)).toBe('in 3 days');
      
      const inTwoWeeks = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      expect(formatRelativeDate(inTwoWeeks)).toBe('in 2 weeks');
      
      const inTwoMonths = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
      expect(formatRelativeDate(inTwoMonths)).toBe('in 2 months');
      
      const inTwoYears = new Date(Date.now() + 730 * 24 * 60 * 60 * 1000);
      expect(formatRelativeDate(inTwoYears)).toBe('in 2 years');
    });

    it('accepts string dates', () => {
      const dateString = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      expect(formatRelativeDate(dateString)).toBe('5 minutes ago');
    });
  });

  describe('formatDate', () => {
    it('formats date with default options', () => {
      const date = new Date('2024-03-15T12:00:00Z');
      const result = formatDate(date);
      expect(result).toContain('Mar');
      expect(result).toContain('2024');
    });

    it('formats date with custom options', () => {
      const date = new Date('2024-03-15T12:00:00Z');
      expect(formatDate(date, { weekday: 'long', month: 'long' })).toContain('March');
    });

    it('accepts string dates', () => {
      const result = formatDate('2024-03-15T12:00:00Z');
      expect(result).toContain('Mar');
      expect(result).toContain('2024');
    });
  });

  describe('formatDateTime', () => {
    it('formats date with time', () => {
      const date = new Date('2024-03-15T14:30:00');
      const formatted = formatDateTime(date);
      expect(formatted).toContain('Mar 15, 2024');
      expect(formatted).toContain(':30');
    });

    it('accepts string dates', () => {
      const formatted = formatDateTime('2024-03-15T14:30:00');
      expect(formatted).toContain('Mar 15, 2024');
    });
  });

  describe('formatCountdown', () => {
    it('returns "Unlocked" for past dates', () => {
      const pastDate = new Date(Date.now() - 1000);
      expect(formatCountdown(pastDate)).toBe('Unlocked');
    });

    it('formats days and hours', () => {
      const inThreeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000);
      expect(formatCountdown(inThreeDays)).toBe('3d 5h');
    });

    it('formats hours and minutes when less than a day', () => {
      const inFiveHours = new Date(Date.now() + 5 * 60 * 60 * 1000 + 30 * 60 * 1000);
      expect(formatCountdown(inFiveHours)).toBe('5h 30m');
    });

    it('formats minutes only when less than an hour', () => {
      const inThirtyMinutes = new Date(Date.now() + 30 * 60 * 1000);
      expect(formatCountdown(inThirtyMinutes)).toBe('30m');
    });

    it('accepts string dates', () => {
      const futureDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
      expect(formatCountdown(futureDate)).toContain('d');
    });
  });

  describe('isPast', () => {
    it('returns true for past dates', () => {
      const pastDate = new Date(Date.now() - 1000);
      expect(isPast(pastDate)).toBe(true);
    });

    it('returns false for future dates', () => {
      const futureDate = new Date(Date.now() + 1000);
      expect(isPast(futureDate)).toBe(false);
    });

    it('accepts string dates', () => {
      const pastString = new Date(Date.now() - 1000).toISOString();
      expect(isPast(pastString)).toBe(true);
    });
  });

  describe('isToday', () => {
    it('returns true for today', () => {
      expect(isToday(new Date())).toBe(true);
    });

    it('returns false for yesterday', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      expect(isToday(yesterday)).toBe(false);
    });

    it('returns false for tomorrow', () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      expect(isToday(tomorrow)).toBe(false);
    });

    it('accepts string dates', () => {
      expect(isToday(new Date().toISOString())).toBe(true);
    });
  });

  describe('getTimeOfDay', () => {
    it('returns "morning" for 5-11', () => {
      vi.setSystemTime(new Date('2024-06-15T08:00:00'));
      expect(getTimeOfDay()).toBe('morning');
    });

    it('returns "afternoon" for 12-16', () => {
      vi.setSystemTime(new Date('2024-06-15T14:00:00'));
      expect(getTimeOfDay()).toBe('afternoon');
    });

    it('returns "evening" for 17-20', () => {
      vi.setSystemTime(new Date('2024-06-15T19:00:00'));
      expect(getTimeOfDay()).toBe('evening');
    });

    it('returns "night" for 21-4', () => {
      vi.setSystemTime(new Date('2024-06-15T23:00:00'));
      expect(getTimeOfDay()).toBe('night');
      
      vi.setSystemTime(new Date('2024-06-15T03:00:00'));
      expect(getTimeOfDay()).toBe('night');
    });
  });

  describe('getGreeting', () => {
    it('returns appropriate greeting for time of day', () => {
      vi.setSystemTime(new Date('2024-06-15T08:00:00'));
      expect(getGreeting()).toBe('Good morning');

      vi.setSystemTime(new Date('2024-06-15T14:00:00'));
      expect(getGreeting()).toBe('Good afternoon');

      vi.setSystemTime(new Date('2024-06-15T19:00:00'));
      expect(getGreeting()).toBe('Good evening');

      vi.setSystemTime(new Date('2024-06-15T23:00:00'));
      expect(getGreeting()).toBe('Good night');
    });
  });

  describe('getTimeUntilUnlock', () => {
    it('returns "now" for past dates', () => {
      const pastDate = new Date(Date.now() - 1000);
      expect(getTimeUntilUnlock(pastDate)).toBe('now');
    });

    it('formats days and hours', () => {
      const inThreeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000);
      expect(getTimeUntilUnlock(inThreeDays)).toBe('3d 5h');
    });

    it('formats hours and minutes when less than a day', () => {
      const inFiveHours = new Date(Date.now() + 5 * 60 * 60 * 1000 + 30 * 60 * 1000);
      expect(getTimeUntilUnlock(inFiveHours)).toBe('5h 30m');
    });

    it('formats minutes only when less than an hour', () => {
      const inThirtyMinutes = new Date(Date.now() + 30 * 60 * 1000);
      expect(getTimeUntilUnlock(inThirtyMinutes)).toBe('30m');
    });

    it('accepts string dates', () => {
      const futureDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
      expect(getTimeUntilUnlock(futureDate)).toContain('d');
    });
  });

  describe('isJourneyUnlocked', () => {
    it('returns true for past unlock dates', () => {
      const journey = { unlock_date: new Date(Date.now() - 1000).toISOString() };
      expect(isJourneyUnlocked(journey)).toBe(true);
    });

    it('returns false for future unlock dates', () => {
      const journey = { unlock_date: new Date(Date.now() + 1000 * 60 * 60).toISOString() };
      expect(isJourneyUnlocked(journey)).toBe(false);
    });

    it('returns true if status is completed regardless of date', () => {
      const journey = {
        unlock_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
        status: 'completed',
      };
      expect(isJourneyUnlocked(journey)).toBe(true);
    });

    it('returns false if status is active and date is future', () => {
      const journey = {
        unlock_date: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
        status: 'active',
      };
      expect(isJourneyUnlocked(journey)).toBe(false);
    });
  });
});

