import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { OfflineIndicator } from '@/components/features';

describe('OfflineIndicator Component', () => {
  let originalOnLine: boolean;

  beforeEach(() => {
    originalOnLine = navigator.onLine;
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'onLine', {
      value: originalOnLine,
      writable: true,
    });
  });

  it('renders nothing when online', () => {
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
    });

    const { container } = render(<OfflineIndicator />);
    expect(container.firstChild).toBeNull();
  });

  it('shows offline message when offline', () => {
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      writable: true,
    });

    render(<OfflineIndicator />);
    expect(screen.getByText("You're offline")).toBeInTheDocument();
  });

  it('shows when going offline', async () => {
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
    });

    render(<OfflineIndicator />);
    expect(screen.queryByText("You're offline")).not.toBeInTheDocument();

    // Simulate going offline
    await act(async () => {
      window.dispatchEvent(new Event('offline'));
    });

    expect(screen.getByText("You're offline")).toBeInTheDocument();
  });

  it('hides when coming back online', async () => {
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      writable: true,
    });

    render(<OfflineIndicator />);
    expect(screen.getByText("You're offline")).toBeInTheDocument();

    // Simulate coming online
    await act(async () => {
      window.dispatchEvent(new Event('online'));
    });

    expect(screen.queryByText("You're offline")).not.toBeInTheDocument();
  });

  it('has wifi-off icon', () => {
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      writable: true,
    });

    render(<OfflineIndicator />);
    // Check for the SVG (WifiOff icon)
    const banner = screen.getByText("You're offline").parentElement;
    expect(banner?.querySelector('svg')).toBeInTheDocument();
  });
});

