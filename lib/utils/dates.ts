/**
 * Date formatting and utility functions
 */

export function formatRelativeDate(date: Date | string): string {
  const now = new Date();
  const target = typeof date === 'string' ? new Date(date) : date;
  const diffMs = target.getTime() - now.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  const isFuture = diffMs > 0;
  const abs = (n: number) => Math.abs(n);

  if (abs(diffSeconds) < 60) {
    return 'just now';
  }

  if (abs(diffMinutes) < 60) {
    const mins = abs(diffMinutes);
    return isFuture 
      ? `in ${mins} minute${mins === 1 ? '' : 's'}`
      : `${mins} minute${mins === 1 ? '' : 's'} ago`;
  }

  if (abs(diffHours) < 24) {
    const hrs = abs(diffHours);
    return isFuture 
      ? `in ${hrs} hour${hrs === 1 ? '' : 's'}`
      : `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  }

  if (abs(diffDays) < 7) {
    const days = abs(diffDays);
    return isFuture 
      ? `in ${days} day${days === 1 ? '' : 's'}`
      : `${days} day${days === 1 ? '' : 's'} ago`;
  }

  if (abs(diffWeeks) < 4) {
    const weeks = abs(diffWeeks);
    return isFuture 
      ? `in ${weeks} week${weeks === 1 ? '' : 's'}`
      : `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  }

  if (abs(diffMonths) < 12) {
    const months = abs(diffMonths);
    return isFuture 
      ? `in ${months} month${months === 1 ? '' : 's'}`
      : `${months} month${months === 1 ? '' : 's'} ago`;
  }

  const years = abs(diffYears);
  return isFuture 
    ? `in ${years} year${years === 1 ? '' : 's'}`
    : `${years} year${years === 1 ? '' : 's'} ago`;
}

export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const target = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options,
  };

  return target.toLocaleDateString('en-US', defaultOptions);
}

export function formatDateTime(date: Date | string): string {
  const target = typeof date === 'string' ? new Date(date) : date;
  
  return target.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatCountdown(targetDate: Date | string): string {
  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();

  if (diffMs <= 0) {
    return 'Unlocked';
  }

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function isPast(date: Date | string): boolean {
  const target = typeof date === 'string' ? new Date(date) : date;
  return target.getTime() < Date.now();
}

export function isToday(date: Date | string): boolean {
  const target = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return (
    target.getDate() === today.getDate() &&
    target.getMonth() === today.getMonth() &&
    target.getFullYear() === today.getFullYear()
  );
}

export function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

export function getGreeting(): string {
  const timeOfDay = getTimeOfDay();
  switch (timeOfDay) {
    case 'morning':
      return 'Good morning';
    case 'afternoon':
      return 'Good afternoon';
    case 'evening':
      return 'Good evening';
    case 'night':
      return 'Good night';
  }
}

/**
 * Get human-readable time until a date (for journey unlock countdowns)
 */
export function getTimeUntilUnlock(unlockDate: Date | string): string {
  const now = new Date();
  const unlock = typeof unlockDate === 'string' ? new Date(unlockDate) : unlockDate;
  const diff = unlock.getTime() - now.getTime();
  
  if (diff <= 0) return 'now';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/**
 * Check if a journey is unlocked (past unlock date or completed status)
 */
export function isJourneyUnlocked(journey: { unlock_date: string; status?: string }): boolean {
  return new Date(journey.unlock_date) <= new Date() || journey.status === 'completed';
}
