import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Badge from '@/app/components/Badge';
import { Star } from 'lucide-react';

describe('Badge Component', () => {
  it('renders children correctly', () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders with default variant', () => {
    render(<Badge>Default</Badge>);
    expect(screen.getByText('Default')).toHaveClass('bg-zinc-800');
  });

  it('renders with success variant', () => {
    render(<Badge variant="success">Success</Badge>);
    expect(screen.getByText('Success')).toHaveClass('text-green-400');
  });

  it('renders with warning variant', () => {
    render(<Badge variant="warning">Warning</Badge>);
    expect(screen.getByText('Warning')).toHaveClass('text-amber-400');
  });

  it('renders with error variant', () => {
    render(<Badge variant="error">Error</Badge>);
    expect(screen.getByText('Error')).toHaveClass('text-red-400');
  });

  it('renders with info variant', () => {
    render(<Badge variant="info">Info</Badge>);
    expect(screen.getByText('Info')).toHaveClass('text-blue-400');
  });

  it('renders with premium variant', () => {
    render(<Badge variant="premium">Premium</Badge>);
    expect(screen.getByText('Premium')).toHaveClass('text-orange-400');
  });

  it('renders with small size', () => {
    render(<Badge size="sm">Small</Badge>);
    expect(screen.getByText('Small')).toHaveClass('px-2', 'py-0.5', 'text-xs');
  });

  it('renders with medium size', () => {
    render(<Badge size="md">Medium</Badge>);
    expect(screen.getByText('Medium')).toHaveClass('px-2.5', 'py-1', 'text-sm');
  });

  it('renders with dot indicator', () => {
    const { container } = render(<Badge dot>With Dot</Badge>);
    const dot = container.querySelector('.rounded-full.w-1\\.5');
    expect(dot).toBeInTheDocument();
  });

  it('renders with icon', () => {
    render(<Badge icon={<Star data-testid="icon" />}>With Icon</Badge>);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });
});

