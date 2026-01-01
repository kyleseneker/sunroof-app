import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Avatar, { getInitials } from '@/app/components/Avatar';

describe('Avatar', () => {
  describe('getInitials', () => {
    it('returns first letter of single name', () => {
      expect(getInitials('John', null)).toBe('J');
    });

    it('returns initials from full name', () => {
      expect(getInitials('John Doe', null)).toBe('JD');
    });

    it('returns initials from name with multiple words', () => {
      expect(getInitials('John Michael Doe', null)).toBe('JD');
    });

    it('falls back to email initial when no name', () => {
      expect(getInitials(null, 'john@example.com')).toBe('J');
    });

    it('returns ? when no name or email', () => {
      expect(getInitials(null, null)).toBe('?');
    });

    it('handles empty string name', () => {
      expect(getInitials('', 'john@example.com')).toBe('J');
    });

    it('handles whitespace-only name', () => {
      expect(getInitials('   ', 'john@example.com')).toBe('J');
    });
  });

  describe('rendering', () => {
    it('renders initials when no image provided', () => {
      render(<Avatar name="John Doe" email="john@example.com" />);
      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('renders single initial for single name', () => {
      render(<Avatar name="John" />);
      expect(screen.getByText('J')).toBeInTheDocument();
    });

    it('renders email initial as fallback', () => {
      render(<Avatar email="test@example.com" />);
      expect(screen.getByText('T')).toBeInTheDocument();
    });

    it('renders ? when no name or email', () => {
      render(<Avatar />);
      expect(screen.getByText('?')).toBeInTheDocument();
    });

    it('renders image when src provided', () => {
      render(<Avatar src="https://example.com/avatar.jpg" name="John" />);
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('alt', 'John');
    });

    it('applies size classes correctly', () => {
      const { container, rerender } = render(<Avatar name="J" size="xs" />);
      expect(container.querySelector('.w-6')).toBeInTheDocument();

      rerender(<Avatar name="J" size="xl" />);
      expect(container.querySelector('.w-24')).toBeInTheDocument();
    });

    it('shows upload button when showUploadButton is true', () => {
      render(
        <Avatar 
          name="John" 
          showUploadButton 
          onUploadClick={() => {}} 
        />
      );
      expect(screen.getByRole('button', { name: /upload avatar/i })).toBeInTheDocument();
    });

    it('does not show upload button by default', () => {
      render(<Avatar name="John" />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('shows loading spinner when uploading', () => {
      render(
        <Avatar 
          name="John" 
          showUploadButton 
          uploading 
          onUploadClick={() => {}} 
        />
      );
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });
});

