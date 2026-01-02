import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Progress, CircularProgress } from '@/components/ui';

describe('Progress Component', () => {
  it('renders with correct percentage', () => {
    render(<Progress value={50} showLabel />);
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('renders with label', () => {
    render(<Progress value={50} label="Upload Progress" />);
    expect(screen.getByText('Upload Progress')).toBeInTheDocument();
  });

  it('clamps value between 0 and 100', () => {
    const { rerender } = render(<Progress value={-10} showLabel />);
    expect(screen.getByText('0%')).toBeInTheDocument();

    rerender(<Progress value={150} showLabel />);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('calculates percentage with custom max', () => {
    render(<Progress value={25} max={50} showLabel />);
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('renders with small size', () => {
    render(<Progress value={50} size="sm" />);
    expect(screen.getByRole('progressbar')).toHaveClass('h-1');
  });

  it('renders with medium size', () => {
    render(<Progress value={50} size="md" />);
    expect(screen.getByRole('progressbar')).toHaveClass('h-2');
  });

  it('renders with large size', () => {
    render(<Progress value={50} size="lg" />);
    expect(screen.getByRole('progressbar')).toHaveClass('h-3');
  });

  it('renders with default variant', () => {
    render(<Progress value={50} />);
    const progressBar = screen.getByRole('progressbar').firstChild;
    expect(progressBar).toHaveClass('bg-gradient-to-r');
  });

  it('renders with success variant', () => {
    render(<Progress value={50} variant="success" />);
    const progressBar = screen.getByRole('progressbar').firstChild;
    expect(progressBar).toHaveClass('bg-green-500');
  });

  it('renders with warning variant', () => {
    render(<Progress value={50} variant="warning" />);
    const progressBar = screen.getByRole('progressbar').firstChild;
    expect(progressBar).toHaveClass('bg-amber-500');
  });

  it('renders with error variant', () => {
    render(<Progress value={50} variant="error" />);
    const progressBar = screen.getByRole('progressbar').firstChild;
    expect(progressBar).toHaveClass('bg-red-500');
  });

  it('has correct aria attributes', () => {
    render(<Progress value={50} max={100} label="Progress" />);
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '50');
    expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');
  });

  it('shows animation when not complete', () => {
    render(<Progress value={50} animated />);
    const progressBar = screen.getByRole('progressbar').firstChild;
    expect(progressBar).toHaveClass('animate-pulse');
  });

  it('hides animation when complete', () => {
    render(<Progress value={100} animated />);
    const progressBar = screen.getByRole('progressbar').firstChild;
    expect(progressBar).not.toHaveClass('animate-pulse');
  });
});

describe('CircularProgress Component', () => {
  it('renders with correct percentage', () => {
    render(<CircularProgress value={75} showLabel />);
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('clamps value between 0 and 100', () => {
    const { rerender } = render(<CircularProgress value={-10} showLabel />);
    expect(screen.getByText('0%')).toBeInTheDocument();

    rerender(<CircularProgress value={150} showLabel />);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('calculates percentage with custom max', () => {
    render(<CircularProgress value={25} max={50} showLabel />);
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('renders SVG with correct size', () => {
    render(<CircularProgress value={50} size={60} />);
    const svg = screen.getByRole('progressbar');
    expect(svg).toHaveAttribute('width', '60');
    expect(svg).toHaveAttribute('height', '60');
  });

  it('has correct aria attributes', () => {
    render(<CircularProgress value={50} max={100} />);
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '50');
    expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');
  });

  it('hides label when showLabel is false', () => {
    render(<CircularProgress value={50} showLabel={false} />);
    expect(screen.queryByText('50%')).not.toBeInTheDocument();
  });
});

