import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import Skeleton, {
  SkeletonCard,
  SkeletonJourneyCard,
  SkeletonMemoryGrid,
  SkeletonListItem,
  SkeletonProfile,
} from '@/app/components/Skeleton';

describe('Skeleton', () => {
  describe('base component', () => {
    it('renders with default props', () => {
      const { container } = render(<Skeleton />);
      expect(container.querySelector('.skeleton')).toBeInTheDocument();
      expect(container.querySelector('.rounded')).toBeInTheDocument();
    });

    it('renders circular variant', () => {
      const { container } = render(<Skeleton variant="circular" />);
      expect(container.querySelector('.rounded-full')).toBeInTheDocument();
    });

    it('renders text variant', () => {
      const { container } = render(<Skeleton variant="text" />);
      expect(container.querySelector('.h-4')).toBeInTheDocument();
    });

    it('renders rectangular variant', () => {
      const { container } = render(<Skeleton variant="rectangular" />);
      expect(container.querySelector('.rounded-lg')).toBeInTheDocument();
    });

    it('applies custom dimensions', () => {
      const { container } = render(<Skeleton width={100} height={50} />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton.style.width).toBe('100px');
      expect(skeleton.style.height).toBe('50px');
    });

    it('applies string dimensions', () => {
      const { container } = render(<Skeleton width="50%" height="auto" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton.style.width).toBe('50%');
      expect(skeleton.style.height).toBe('auto');
    });

    it('renders multiple lines for text variant', () => {
      const { container } = render(<Skeleton variant="text" lines={3} />);
      const lines = container.querySelectorAll('.h-4');
      expect(lines).toHaveLength(3);
    });

    it('makes last line shorter for text with multiple lines', () => {
      const { container } = render(<Skeleton variant="text" lines={2} width="100%" />);
      const lines = container.querySelectorAll('.h-4');
      const lastLine = lines[lines.length - 1] as HTMLElement;
      expect(lastLine.style.width).toBe('75%');
    });

    it('applies custom className', () => {
      const { container } = render(<Skeleton className="my-custom-class" />);
      expect(container.querySelector('.my-custom-class')).toBeInTheDocument();
    });

    it('uses wave animation when specified', () => {
      const { container } = render(<Skeleton animation="wave" />);
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('has no animation when none specified', () => {
      const { container } = render(<Skeleton animation="none" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton.classList.contains('skeleton')).toBe(false);
      expect(skeleton.classList.contains('animate-pulse')).toBe(false);
    });
  });

  describe('preset patterns', () => {
    it('renders SkeletonCard', () => {
      const { container } = render(<SkeletonCard />);
      expect(container.querySelector('.rounded-xl')).toBeInTheDocument();
    });

    it('renders SkeletonJourneyCard', () => {
      const { container } = render(<SkeletonJourneyCard />);
      expect(container.querySelector('.rounded-2xl')).toBeInTheDocument();
    });

    it('renders SkeletonMemoryGrid with default count', () => {
      const { container } = render(<SkeletonMemoryGrid />);
      const items = container.querySelectorAll('.aspect-square');
      expect(items).toHaveLength(6);
    });

    it('renders SkeletonMemoryGrid with custom count', () => {
      const { container } = render(<SkeletonMemoryGrid count={4} />);
      const items = container.querySelectorAll('.aspect-square');
      expect(items).toHaveLength(4);
    });

    it('renders SkeletonListItem', () => {
      const { container } = render(<SkeletonListItem />);
      expect(container.querySelector('.rounded-full')).toBeInTheDocument();
    });

    it('renders SkeletonProfile', () => {
      const { container } = render(<SkeletonProfile />);
      const circle = container.querySelector('.rounded-full');
      expect(circle).toBeInTheDocument();
    });

    it('applies custom className to presets', () => {
      const { container } = render(<SkeletonCard className="custom-class" />);
      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });
  });
});

