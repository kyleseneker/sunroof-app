import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { NotificationPrompt, NotificationSettings } from '@/components/features';

// Mock the notifications library
vi.mock('@/lib/notifications', () => ({
  registerServiceWorker: vi.fn().mockResolvedValue(null),
  checkNotificationPermission: vi.fn().mockResolvedValue('default'),
  requestNotificationPermission: vi.fn().mockResolvedValue('granted'),
}));

import { checkNotificationPermission, requestNotificationPermission } from '@/lib';

describe('NotificationPrompt Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    
    // Reset mocks to default
    vi.mocked(checkNotificationPermission).mockResolvedValue('default');
    vi.mocked(requestNotificationPermission).mockResolvedValue('granted');
    
    // Ensure Notification is defined
    Object.defineProperty(window, 'Notification', {
      value: { permission: 'default' },
      writable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the prompt with title and description', async () => {
    await act(async () => {
      render(<NotificationPrompt />);
    });
    
    expect(screen.getByText('Get notified when memories unlock')).toBeInTheDocument();
    expect(screen.getByText(/send you a notification/)).toBeInTheDocument();
  });

  it('shows Enable button', async () => {
    await act(async () => {
      render(<NotificationPrompt />);
    });
    
    expect(screen.getByText('Enable')).toBeInTheDocument();
  });

  it('shows Not now button', async () => {
    await act(async () => {
      render(<NotificationPrompt />);
    });
    
    expect(screen.getByText('Not now')).toBeInTheDocument();
  });

  it('calls requestNotificationPermission on Enable click', async () => {
    await act(async () => {
      render(<NotificationPrompt />);
    });
    
    const enableButton = screen.getByText('Enable');
    
    await act(async () => {
      fireEvent.click(enableButton);
    });
    
    expect(requestNotificationPermission).toHaveBeenCalled();
  });

  it('dismisses and saves to localStorage on Not now click', async () => {
    await act(async () => {
      render(<NotificationPrompt />);
    });
    
    const dismissButton = screen.getByText('Not now');
    fireEvent.click(dismissButton);
    
    expect(localStorage.getItem('notification-prompt-dismissed')).toBe('true');
  });

  it('calls onDismiss callback when dismissed', async () => {
    const onDismiss = vi.fn();
    
    await act(async () => {
      render(<NotificationPrompt onDismiss={onDismiss} />);
    });
    
    const dismissButton = screen.getByText('Not now');
    fireEvent.click(dismissButton);
    
    expect(onDismiss).toHaveBeenCalled();
  });

  it('renders nothing when permission is granted', async () => {
    vi.mocked(checkNotificationPermission).mockResolvedValue('granted');
    
    let container: any;
    await act(async () => {
      const result = render(<NotificationPrompt />);
      container = result.container;
    });
    
    // Wait for effect
    await act(async () => {});
    
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when permission is denied', async () => {
    vi.mocked(checkNotificationPermission).mockResolvedValue('denied');
    
    let container: any;
    await act(async () => {
      const result = render(<NotificationPrompt />);
      container = result.container;
    });
    
    await act(async () => {});
    
    expect(container.firstChild).toBeNull();
  });

  it('renders compact version when compact=true', async () => {
    await act(async () => {
      render(<NotificationPrompt compact={true} />);
    });
    
    expect(screen.getByText('Enable notifications')).toBeInTheDocument();
    expect(screen.queryByText('Not now')).not.toBeInTheDocument();
  });

  it('renders nothing when already dismissed', async () => {
    localStorage.setItem('notification-prompt-dismissed', 'true');
    
    let container: any;
    await act(async () => {
      const result = render(<NotificationPrompt />);
      container = result.container;
    });
    
    expect(container.firstChild).toBeNull();
  });
});

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

