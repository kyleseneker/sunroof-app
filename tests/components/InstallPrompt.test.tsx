import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import InstallPrompt from '@/app/components/InstallPrompt';

describe('InstallPrompt Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    
    // Default: not standalone, not iOS
    Object.defineProperty(window, 'matchMedia', {
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(display-mode: standalone)' ? false : false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
      writable: true,
    });
    
    // Mock navigator.userAgent for non-iOS
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/100.0.0.0',
      writable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('renders nothing initially (before delay)', () => {
    const { container } = render(<InstallPrompt />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when in standalone mode', async () => {
    Object.defineProperty(window, 'matchMedia', {
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(display-mode: standalone)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
      writable: true,
    });

    const { container } = render(<InstallPrompt />);
    
    await act(async () => {
      vi.advanceTimersByTime(10000);
    });
    
    expect(container.firstChild).toBeNull();
  });

  it('shows iOS-specific message on iOS devices', async () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
      writable: true,
    });

    render(<InstallPrompt />);
    
    await act(async () => {
      vi.advanceTimersByTime(6000);
    });
    
    expect(screen.getByText(/Add to Home Screen/)).toBeInTheDocument();
  });

  it('shows Android/Chrome message on non-iOS', async () => {
    // Trigger beforeinstallprompt
    render(<InstallPrompt />);
    
    await act(async () => {
      const event = new Event('beforeinstallprompt') as any;
      event.preventDefault = vi.fn();
      event.prompt = vi.fn().mockResolvedValue(undefined);
      event.userChoice = Promise.resolve({ outcome: 'accepted' });
      window.dispatchEvent(event);
    });
    
    await act(async () => {
      vi.advanceTimersByTime(4000);
    });
    
    expect(screen.getByText(/Add to your home screen/)).toBeInTheDocument();
  });

  it('dismisses and stores in localStorage', async () => {
    // Setup iOS to trigger the prompt
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
      writable: true,
    });

    render(<InstallPrompt />);
    
    await act(async () => {
      vi.advanceTimersByTime(6000);
    });
    
    expect(screen.getByText('Install Sunroof')).toBeInTheDocument();
    
    // Find and click dismiss button (X)
    const dismissButtons = screen.getAllByRole('button');
    const dismissButton = dismissButtons.find(btn => btn.querySelector('svg'));
    
    if (dismissButton) {
      fireEvent.click(dismissButton);
    }
    
    expect(localStorage.getItem('sunroof_install_dismissed')).toBeTruthy();
  });

  it('does not show if recently dismissed', async () => {
    // Set dismissed time to now
    localStorage.setItem('sunroof_install_dismissed', Date.now().toString());
    
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
      writable: true,
    });

    const { container } = render(<InstallPrompt />);
    
    await act(async () => {
      vi.advanceTimersByTime(10000);
    });
    
    expect(container.firstChild).toBeNull();
  });

  it('shows again after 7 days', async () => {
    // Set dismissed time to 8 days ago
    const eightDaysAgo = Date.now() - (8 * 24 * 60 * 60 * 1000);
    localStorage.setItem('sunroof_install_dismissed', eightDaysAgo.toString());
    
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
      writable: true,
    });

    render(<InstallPrompt />);
    
    await act(async () => {
      vi.advanceTimersByTime(6000);
    });
    
    expect(screen.getByText('Install Sunroof')).toBeInTheDocument();
  });
});

