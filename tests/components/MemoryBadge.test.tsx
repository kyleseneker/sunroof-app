import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import MemoryBadge from '@/app/components/MemoryBadge';

describe('MemoryBadge', () => {
  describe('rendering', () => {
    it('returns null when count is 0', () => {
      const { container } = render(<MemoryBadge count={0} />);
      expect(container.firstChild).toBeNull();
    });

    it('renders with count of 1 using singular form', () => {
      render(<MemoryBadge count={1} />);
      expect(screen.getByText('1 memory')).toBeInTheDocument();
    });

    it('renders with count > 1 using plural form', () => {
      render(<MemoryBadge count={5} />);
      expect(screen.getByText('5 memories')).toBeInTheDocument();
    });

    it('shows lock icon when isLocked is true', () => {
      const { container } = render(<MemoryBadge count={3} isLocked={true} />);
      // Lock icon should be present
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('shows sparkles icon when isLocked is false', () => {
      const { container } = render(<MemoryBadge count={3} isLocked={false} />);
      // Sparkles icon should be present
      expect(container.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('variants', () => {
    it('renders compact variant with just number', () => {
      render(<MemoryBadge count={5} variant="compact" />);
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.queryByText('memories')).not.toBeInTheDocument();
    });

    it('renders detailed variant with photo/note breakdown', () => {
      render(
        <MemoryBadge 
          count={5} 
          variant="detailed" 
          photoCount={3} 
          noteCount={2} 
        />
      );
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('hides zero counts in detailed variant', () => {
      render(
        <MemoryBadge 
          count={3} 
          variant="detailed" 
          photoCount={3} 
          noteCount={0} 
        />
      );
      expect(screen.getByText('3')).toBeInTheDocument();
      // There should only be one "3" for photos
      expect(screen.queryAllByText('3')).toHaveLength(1);
    });
  });

  describe('styling', () => {
    it('applies custom className', () => {
      const { container } = render(
        <MemoryBadge count={3} className="custom-class" />
      );
      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });

    it('applies locked styling when isLocked is true', () => {
      const { container } = render(
        <MemoryBadge count={3} isLocked={true} />
      );
      expect(container.querySelector('.bg-zinc-800\\/80')).toBeInTheDocument();
    });

    it('applies unlocked styling when isLocked is false', () => {
      const { container } = render(
        <MemoryBadge count={3} isLocked={false} />
      );
      expect(container.querySelector('.bg-emerald-500\\/10')).toBeInTheDocument();
    });

    it('applies compact locked styling', () => {
      const { container } = render(
        <MemoryBadge count={3} variant="compact" isLocked={true} />
      );
      expect(container.querySelector('.bg-amber-500\\/20')).toBeInTheDocument();
    });

    it('applies compact unlocked styling', () => {
      const { container } = render(
        <MemoryBadge count={3} variant="compact" isLocked={false} />
      );
      expect(container.querySelector('.bg-emerald-500\\/20')).toBeInTheDocument();
    });
  });

  describe('animation', () => {
    it('does not animate on initial render', () => {
      const { container } = render(<MemoryBadge count={5} />);
      expect(container.querySelector('.scale-110')).not.toBeInTheDocument();
    });

    it('animates when count increases', async () => {
      const { rerender, container } = render(<MemoryBadge count={3} />);
      
      // Increase the count
      rerender(<MemoryBadge count={4} />);
      
      // Animation class should be applied
      await waitFor(() => {
        expect(container.querySelector('.scale-110')).toBeInTheDocument();
      });
    });

    it('does not animate when animate prop is false', async () => {
      const { rerender, container } = render(
        <MemoryBadge count={3} animate={false} />
      );
      
      rerender(<MemoryBadge count={4} animate={false} />);
      
      // Animation class should not be applied
      await waitFor(() => {
        expect(container.querySelector('.scale-110')).not.toBeInTheDocument();
      });
    });
  });
});

