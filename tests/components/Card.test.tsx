import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui';

describe('Card Component', () => {
  it('renders children correctly', () => {
    render(<Card>Card Content</Card>);
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  it('renders with default variant', () => {
    const { container } = render(<Card>Default</Card>);
    expect(container.firstChild).toHaveClass('rounded-2xl');
  });

  it('renders with interactive variant', () => {
    const { container } = render(<Card variant="interactive">Interactive</Card>);
    expect(container.firstChild).toHaveClass('cursor-pointer');
  });

  it('renders with elevated variant', () => {
    const { container } = render(<Card variant="elevated">Elevated</Card>);
    expect(container.firstChild).toHaveClass('shadow-[var(--shadow-xl)]');
  });

  it('handles click events on interactive cards', () => {
    const handleClick = vi.fn();
    render(<Card variant="interactive" onClick={handleClick}>Clickable</Card>);
    fireEvent.click(screen.getByText('Clickable'));
    expect(handleClick).toHaveBeenCalled();
  });

  it('renders with no padding', () => {
    const { container } = render(<Card padding="none">No Padding</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).not.toContain('p-3');
    expect(card.className).not.toContain('p-4');
    expect(card.className).not.toContain('p-6');
  });

  it('renders with small padding', () => {
    const { container } = render(<Card padding="sm">Small</Card>);
    expect(container.firstChild).toHaveClass('p-3');
  });

  it('renders with medium padding', () => {
    const { container } = render(<Card padding="md">Medium</Card>);
    expect(container.firstChild).toHaveClass('p-4');
  });

  it('renders with large padding', () => {
    const { container } = render(<Card padding="lg">Large</Card>);
    expect(container.firstChild).toHaveClass('p-6');
  });

  it('renders with gradient overlay', () => {
    render(<Card gradient>Gradient</Card>);
    const card = screen.getByText('Gradient').closest('.rounded-2xl');
    const gradientOverlay = card?.querySelector('[aria-hidden="true"]');
    expect(gradientOverlay).toBeInTheDocument();
  });

  it('forwards ref correctly', () => {
    const ref = vi.fn();
    render(<Card ref={ref}>Ref Card</Card>);
    expect(ref).toHaveBeenCalled();
  });
});

describe('CardHeader Component', () => {
  it('renders children correctly', () => {
    render(<CardHeader>Header Content</CardHeader>);
    expect(screen.getByText('Header Content')).toBeInTheDocument();
  });

  it('has border-bottom styling', () => {
    render(<CardHeader>Header</CardHeader>);
    expect(screen.getByText('Header')).toHaveClass('border-b');
  });
});

describe('CardContent Component', () => {
  it('renders children correctly', () => {
    render(<CardContent>Content</CardContent>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('has padding', () => {
    render(<CardContent>Content</CardContent>);
    expect(screen.getByText('Content')).toHaveClass('p-4');
  });
});

describe('CardFooter Component', () => {
  it('renders children correctly', () => {
    render(<CardFooter>Footer Content</CardFooter>);
    expect(screen.getByText('Footer Content')).toBeInTheDocument();
  });

  it('has border-top styling', () => {
    render(<CardFooter>Footer</CardFooter>);
    expect(screen.getByText('Footer')).toHaveClass('border-t');
  });
});

