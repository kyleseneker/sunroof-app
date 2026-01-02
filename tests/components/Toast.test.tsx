import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { ToastProvider, useToast } from '@/components/ui';

// Test component that uses the toast
function TestComponent() {
  const { showToast } = useToast();
  
  return (
    <div>
      <button onClick={() => showToast('Success message', 'success')}>
        Show Success
      </button>
      <button onClick={() => showToast('Error message', 'error')}>
        Show Error
      </button>
      <button onClick={() => showToast('Info message', 'info')}>
        Show Info
      </button>
      <button onClick={() => showToast('Custom duration', 'success', 5000)}>
        Custom Duration
      </button>
    </div>
  );
}

describe('Toast Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders children correctly', () => {
    render(
      <ToastProvider>
        <div data-testid="child">Child content</div>
      </ToastProvider>
    );
    
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('shows success toast when triggered', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    
    const button = screen.getByText('Show Success');
    
    await act(async () => {
      button.click();
    });
    
    expect(screen.getByText('Success message')).toBeInTheDocument();
  });

  it('shows error toast when triggered', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    
    const button = screen.getByText('Show Error');
    
    await act(async () => {
      button.click();
    });
    
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('shows info toast when triggered', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    
    const button = screen.getByText('Show Info');
    
    await act(async () => {
      button.click();
    });
    
    expect(screen.getByText('Info message')).toBeInTheDocument();
  });

  it('auto-dismisses toast after timeout', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    
    const button = screen.getByText('Show Success');
    
    await act(async () => {
      button.click();
    });
    
    expect(screen.getByText('Success message')).toBeInTheDocument();
    
    // Fast-forward past the toast duration (3 seconds + 200ms animation)
    await act(async () => {
      vi.advanceTimersByTime(3500);
    });
    
    expect(screen.queryByText('Success message')).not.toBeInTheDocument();
  });

  it('dismisses toast when clicked', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    
    await act(async () => {
      screen.getByText('Show Success').click();
    });
    
    const toast = screen.getByText('Success message').closest('div');
    
    await act(async () => {
      fireEvent.click(toast!);
    });
    
    // Wait for animation
    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    
    expect(screen.queryByText('Success message')).not.toBeInTheDocument();
  });

  it('can show multiple toasts', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    
    await act(async () => {
      screen.getByText('Show Success').click();
      screen.getByText('Show Error').click();
    });
    
    expect(screen.getByText('Success message')).toBeInTheDocument();
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('throws error when useToast used outside provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    function BadComponent() {
      useToast();
      return null;
    }
    
    expect(() => {
      render(<BadComponent />);
    }).toThrow('useToast must be used within a ToastProvider');
    
    consoleError.mockRestore();
  });

  it('applies correct styling for success toast', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    
    await act(async () => {
      screen.getByText('Show Success').click();
    });
    
    const toast = screen.getByText('Success message').closest('div');
    expect(toast?.className).toContain('bg-green-500/10');
  });

  it('applies correct styling for error toast', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    
    await act(async () => {
      screen.getByText('Show Error').click();
    });
    
    const toast = screen.getByText('Error message').closest('div');
    expect(toast?.className).toContain('bg-red-500/10');
  });

  it('applies correct styling for info toast', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    
    await act(async () => {
      screen.getByText('Show Info').click();
    });
    
    const toast = screen.getByText('Info message').closest('div');
    expect(toast?.className).toContain('bg-blue-500/10');
  });
});

