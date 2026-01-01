import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SkipLink from '@/app/components/SkipLink';

describe('SkipLink Component', () => {
  it('renders with correct href', () => {
    render(<SkipLink />);
    const link = screen.getByRole('link', { name: /skip to main content/i });
    expect(link).toHaveAttribute('href', '#main-content');
  });

  it('is visually hidden by default', () => {
    render(<SkipLink />);
    const link = screen.getByRole('link', { name: /skip to main content/i });
    expect(link).toHaveClass('sr-only');
  });

  it('becomes visible on focus', () => {
    render(<SkipLink />);
    const link = screen.getByRole('link', { name: /skip to main content/i });
    expect(link).toHaveClass('focus:not-sr-only');
  });

  it('has correct focus ring styling', () => {
    render(<SkipLink />);
    const link = screen.getByRole('link', { name: /skip to main content/i });
    expect(link).toHaveClass('focus:ring-2', 'focus:ring-orange-500');
  });
});

