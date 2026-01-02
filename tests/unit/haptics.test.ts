import { describe, it, expect, vi, beforeEach } from 'vitest';
import { haptic, hapticClick, hapticSuccess, hapticError, hapticSelection } from '@/lib';

describe('Haptics Library', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('haptic', () => {
    it('calls navigator.vibrate with light pattern', () => {
      haptic('light');
      expect(navigator.vibrate).toHaveBeenCalledWith(10);
    });

    it('calls navigator.vibrate with medium pattern', () => {
      haptic('medium');
      expect(navigator.vibrate).toHaveBeenCalledWith(25);
    });

    it('calls navigator.vibrate with heavy pattern', () => {
      haptic('heavy');
      expect(navigator.vibrate).toHaveBeenCalledWith(50);
    });

    it('calls navigator.vibrate with success pattern', () => {
      haptic('success');
      expect(navigator.vibrate).toHaveBeenCalledWith([10, 50, 10]);
    });

    it('calls navigator.vibrate with warning pattern', () => {
      haptic('warning');
      expect(navigator.vibrate).toHaveBeenCalledWith([25, 25, 25]);
    });

    it('calls navigator.vibrate with error pattern', () => {
      haptic('error');
      expect(navigator.vibrate).toHaveBeenCalledWith([50, 50, 50]);
    });

    it('calls navigator.vibrate with selection pattern', () => {
      haptic('selection');
      expect(navigator.vibrate).toHaveBeenCalledWith(5);
    });

    it('defaults to light pattern', () => {
      haptic();
      expect(navigator.vibrate).toHaveBeenCalledWith(10);
    });
  });

  describe('hapticClick', () => {
    it('triggers light haptic', () => {
      hapticClick();
      expect(navigator.vibrate).toHaveBeenCalledWith(10);
    });
  });

  describe('hapticSuccess', () => {
    it('triggers success haptic', () => {
      hapticSuccess();
      expect(navigator.vibrate).toHaveBeenCalledWith([10, 50, 10]);
    });
  });

  describe('hapticError', () => {
    it('triggers error haptic', () => {
      hapticError();
      expect(navigator.vibrate).toHaveBeenCalledWith([50, 50, 50]);
    });
  });

  describe('hapticSelection', () => {
    it('triggers selection haptic', () => {
      hapticSelection();
      expect(navigator.vibrate).toHaveBeenCalledWith(5);
    });
  });

  describe('error handling', () => {
    it('handles vibrate not supported gracefully', () => {
      const originalVibrate = navigator.vibrate;
      Object.defineProperty(navigator, 'vibrate', {
        value: undefined,
        writable: true,
      });

      expect(() => haptic('light')).not.toThrow();

      Object.defineProperty(navigator, 'vibrate', {
        value: originalVibrate,
        writable: true,
      });
    });

    it('handles vibrate throwing error gracefully', () => {
      const originalVibrate = navigator.vibrate;
      Object.defineProperty(navigator, 'vibrate', {
        value: vi.fn().mockImplementation(() => {
          throw new Error('Vibration failed');
        }),
        writable: true,
      });

      expect(() => haptic('light')).not.toThrow();

      Object.defineProperty(navigator, 'vibrate', {
        value: originalVibrate,
        writable: true,
      });
    });
  });
});
