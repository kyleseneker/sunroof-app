import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { NotificationSettings } from '@/components/features';

// Mock the notifications library
vi.mock('@/lib/notifications', () => ({
  registerServiceWorker: vi.fn().mockResolvedValue(null),
  checkNotificationPermission: vi.fn().mockResolvedValue('default'),
  requestNotificationPermission: vi.fn().mockResolvedValue('granted'),
}));

import { checkNotificationPermission } from '@/lib';

describe('NotificationSettings Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkNotificationPermission).mockResolvedValue('default');
    
    Object.defineProperty(window, 'Notification', {
      value: { permission: 'default' },
      writable: true,
    });
  });

  it('renders toggle for notifications', async () => {
    await act(async () => {
      render(<NotificationSettings />);
    });
    
    expect(screen.getByText('Push Notifications')).toBeInTheDocument();
  });

  it('shows correct message when permission is default', async () => {
    vi.mocked(checkNotificationPermission).mockResolvedValue('default');
    
    await act(async () => {
      render(<NotificationSettings />);
    });
    
    await act(async () => {});
    
    expect(screen.getByText('Get notified when memories are ready')).toBeInTheDocument();
  });

  it('shows correct message when permission is granted', async () => {
    vi.mocked(checkNotificationPermission).mockResolvedValue('granted');
    
    await act(async () => {
      render(<NotificationSettings />);
    });
    
    await act(async () => {});
    
    expect(screen.getByText("You'll be notified when journeys unlock")).toBeInTheDocument();
  });

  it('shows correct message when permission is denied', async () => {
    vi.mocked(checkNotificationPermission).mockResolvedValue('denied');
    
    await act(async () => {
      render(<NotificationSettings />);
    });
    
    await act(async () => {});
    
    expect(screen.getByText('Blocked in browser settings')).toBeInTheDocument();
  });
});
