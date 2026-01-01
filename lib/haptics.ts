/**
 * Haptic feedback utilities using the Vibration API
 */

export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

const patterns: Record<HapticType, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [10, 50, 10],
  warning: [25, 25, 25],
  error: [50, 50, 50],
  selection: 5,
};

export function haptic(type: HapticType = 'light'): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(patterns[type]);
    } catch {
      // Vibration not supported
    }
  }
}

export function hapticClick(): void {
  haptic('light');
}

export function hapticSuccess(): void {
  haptic('success');
}

export function hapticError(): void {
  haptic('error');
}

export function hapticSelection(): void {
  haptic('selection');
}
