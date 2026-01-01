import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Modal from '@/app/components/Modal';

describe('Modal Component', () => {
  beforeEach(() => {
    // Reset body overflow
    document.body.style.overflow = '';
  });

  afterEach(() => {
    document.body.style.overflow = '';
  });

  it('does not render when closed', () => {
    render(
      <Modal isOpen={false} onClose={() => {}}>
        Modal Content
      </Modal>
    );
    expect(screen.queryByText('Modal Content')).not.toBeInTheDocument();
  });

  it('renders when open', () => {
    render(
      <Modal isOpen={true} onClose={() => {}}>
        Modal Content
      </Modal>
    );
    expect(screen.getByText('Modal Content')).toBeInTheDocument();
  });

  it('renders title and description', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Modal Title" description="Modal Description">
        Content
      </Modal>
    );
    expect(screen.getByText('Modal Title')).toBeInTheDocument();
    expect(screen.getByText('Modal Description')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Title">
        Content
      </Modal>
    );
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when Escape key is pressed', async () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose}>
        Content
      </Modal>
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('does not close on Escape when closeOnEscape is false', async () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} closeOnEscape={false}>
        Content
      </Modal>
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => {
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  it('calls onClose when overlay is clicked', () => {
    const onClose = vi.fn();
    const { container } = render(
      <Modal isOpen={true} onClose={onClose}>
        Content
      </Modal>
    );
    // Click the overlay (the fixed backdrop)
    const overlay = container.querySelector('.fixed');
    fireEvent.click(overlay!);
    expect(onClose).toHaveBeenCalled();
  });

  it('does not close on overlay click when closeOnOverlayClick is false', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} closeOnOverlayClick={false}>
        Content
      </Modal>
    );
    const overlay = screen.getByRole('dialog').parentElement;
    fireEvent.click(overlay!);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('hides close button when showCloseButton is false', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Title" showCloseButton={false}>
        Content
      </Modal>
    );
    expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument();
  });

  it('renders with different sizes', () => {
    const { rerender, container } = render(
      <Modal isOpen={true} onClose={() => {}} size="sm">
        Content
      </Modal>
    );
    // Size class is on the inner modal content div, not the dialog wrapper
    expect(container.querySelector('.rounded-2xl')).toHaveClass('max-w-sm');

    rerender(
      <Modal isOpen={true} onClose={() => {}} size="md">
        Content
      </Modal>
    );
    expect(container.querySelector('.rounded-2xl')).toHaveClass('max-w-md');

    rerender(
      <Modal isOpen={true} onClose={() => {}} size="lg">
        Content
      </Modal>
    );
    expect(container.querySelector('.rounded-2xl')).toHaveClass('max-w-lg');
  });

  it('has correct aria attributes', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Title" description="Description">
        Content
      </Modal>
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby');
    expect(dialog).toHaveAttribute('aria-describedby');
  });

  it('prevents body scroll when open', () => {
    render(
      <Modal isOpen={true} onClose={() => {}}>
        Content
      </Modal>
    );
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restores body scroll when closed', () => {
    const { rerender } = render(
      <Modal isOpen={true} onClose={() => {}}>
        Content
      </Modal>
    );
    expect(document.body.style.overflow).toBe('hidden');

    rerender(
      <Modal isOpen={false} onClose={() => {}}>
        Content
      </Modal>
    );
    expect(document.body.style.overflow).toBe('');
  });
});

