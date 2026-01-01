import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Intro from '@/app/components/Intro';

describe('Intro Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the brand name', async () => {
    render(<Intro onComplete={() => {}} />);
    
    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    
    expect(screen.getByText('Sunroof')).toBeInTheDocument();
  });

  it('renders the main headline', async () => {
    render(<Intro onComplete={() => {}} />);
    
    await act(async () => {
      vi.advanceTimersByTime(700);
    });
    
    expect(screen.getByText('Capture now.')).toBeInTheDocument();
    expect(screen.getByText('Relive later.')).toBeInTheDocument();
  });

  it('renders the value proposition text', async () => {
    render(<Intro onComplete={() => {}} />);
    
    await act(async () => {
      vi.advanceTimersByTime(700);
    });
    
    expect(screen.getByText(/Your memories stay locked/)).toBeInTheDocument();
  });

  it('renders the Get Started button', async () => {
    render(<Intro onComplete={() => {}} />);
    
    await act(async () => {
      vi.advanceTimersByTime(1100);
    });
    
    expect(screen.getByText('Get Started')).toBeInTheDocument();
  });

  it('calls onComplete when Get Started is clicked', async () => {
    const onComplete = vi.fn();
    render(<Intro onComplete={onComplete} />);
    
    await act(async () => {
      vi.advanceTimersByTime(1100);
    });
    
    const button = screen.getByText('Get Started');
    fireEvent.click(button);
    
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('shows sign in message', async () => {
    render(<Intro onComplete={() => {}} />);
    
    await act(async () => {
      vi.advanceTimersByTime(1100);
    });
    
    expect(screen.getByText('Sign in with just your email')).toBeInTheDocument();
  });

  it('animates in stages', async () => {
    render(<Intro onComplete={() => {}} />);
    
    // Initial state - nothing visible
    const brandElement = screen.getByText('Sunroof').closest('div')?.parentElement;
    expect(brandElement).toHaveStyle({ opacity: '0' });
    
    // After first animation
    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    
    // Brand should be visible now
    expect(brandElement).toHaveStyle({ opacity: '1' });
  });
});

