import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  checkNotificationPermission, 
  requestNotificationPermission,
  registerServiceWorker,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications
} from '@/lib/notifications';

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user' } } }),
    },
    from: vi.fn(() => ({
      upsert: vi.fn().mockResolvedValue({ error: null }),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ error: null }),
        })),
      })),
    })),
  },
}));

describe('Notifications Library', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkNotificationPermission', () => {
    it('returns current permission level - default', async () => {
      const permission = await checkNotificationPermission();
      expect(['default', 'granted', 'denied']).toContain(permission);
    });

    it('returns granted when permission is granted', async () => {
      Object.defineProperty(window.Notification, 'permission', {
        value: 'granted',
        writable: true,
        configurable: true,
      });
      
      const permission = await checkNotificationPermission();
      expect(permission).toBe('granted');
    });

    it('returns denied when permission is denied', async () => {
      Object.defineProperty(window.Notification, 'permission', {
        value: 'denied',
        writable: true,
        configurable: true,
      });
      
      const permission = await checkNotificationPermission();
      expect(permission).toBe('denied');
    });
  });

  describe('requestNotificationPermission', () => {
    it('calls Notification.requestPermission', async () => {
      const mockRequestPermission = vi.fn().mockResolvedValue('granted');
      Object.defineProperty(window.Notification, 'requestPermission', {
        value: mockRequestPermission,
        writable: true,
        configurable: true,
      });
      
      const permission = await requestNotificationPermission();
      expect(mockRequestPermission).toHaveBeenCalled();
      expect(permission).toBe('granted');
    });
  });

  describe('registerServiceWorker', () => {
    it('returns null if service workers not supported', async () => {
      const originalSW = navigator.serviceWorker;
      Object.defineProperty(navigator, 'serviceWorker', {
        value: undefined,
        writable: true,
        configurable: true,
      });
      
      const result = await registerServiceWorker();
      expect(result).toBeNull();
      
      Object.defineProperty(navigator, 'serviceWorker', {
        value: originalSW,
        writable: true,
        configurable: true,
      });
    });

    it('registers service worker successfully', async () => {
      const mockRegistration = { scope: '/test/' };
      Object.defineProperty(navigator, 'serviceWorker', {
        value: {
          register: vi.fn().mockResolvedValue(mockRegistration),
          ready: Promise.resolve({ pushManager: {} }),
        },
        writable: true,
        configurable: true,
      });
      
      const result = await registerServiceWorker();
      expect(result).toEqual(mockRegistration);
    });

    it('returns null on registration failure', async () => {
      Object.defineProperty(navigator, 'serviceWorker', {
        value: {
          register: vi.fn().mockRejectedValue(new Error('Failed')),
        },
        writable: true,
        configurable: true,
      });
      
      const result = await registerServiceWorker();
      expect(result).toBeNull();
    });
  });

  describe('subscribeToPushNotifications', () => {
    it('returns null if PushManager not supported', async () => {
      const originalPM = window.PushManager;
      Object.defineProperty(window, 'PushManager', {
        value: undefined,
        writable: true,
        configurable: true,
      });
      
      const result = await subscribeToPushNotifications();
      expect(result).toBeNull();
      
      Object.defineProperty(window, 'PushManager', {
        value: originalPM,
        writable: true,
        configurable: true,
      });
    });

    it('returns null if no VAPID key', async () => {
      const result = await subscribeToPushNotifications();
      expect(result).toBeNull();
    });
  });

  describe('unsubscribeFromPushNotifications', () => {
    it('returns true when unsubscribe succeeds', async () => {
      const mockUnsubscribe = vi.fn().mockResolvedValue(true);
      Object.defineProperty(navigator, 'serviceWorker', {
        value: {
          ready: Promise.resolve({
            pushManager: {
              getSubscription: vi.fn().mockResolvedValue({
                unsubscribe: mockUnsubscribe,
                endpoint: 'https://example.com',
              }),
            },
          }),
        },
        writable: true,
        configurable: true,
      });
      
      const result = await unsubscribeFromPushNotifications();
      expect(result).toBe(true);
    });

    it('returns true when no subscription exists', async () => {
      Object.defineProperty(navigator, 'serviceWorker', {
        value: {
          ready: Promise.resolve({
            pushManager: {
              getSubscription: vi.fn().mockResolvedValue(null),
            },
          }),
        },
        writable: true,
        configurable: true,
      });
      
      const result = await unsubscribeFromPushNotifications();
      expect(result).toBe(true);
    });

    it('returns false on error', async () => {
      Object.defineProperty(navigator, 'serviceWorker', {
        value: {
          ready: Promise.reject(new Error('Failed')),
        },
        writable: true,
        configurable: true,
      });
      
      const result = await unsubscribeFromPushNotifications();
      expect(result).toBe(false);
    });
  });
});
