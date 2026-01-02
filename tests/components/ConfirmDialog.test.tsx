import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmDialog } from '@/components/ui';

describe('ConfirmDialog Component', () => {
  it('does not render when closed', () => {
    render(
      <ConfirmDialog
        isOpen={false}
        onClose={() => {}}
        onConfirm={() => {}}
        title="Confirm?"
      />
    );
    expect(screen.queryByText('Confirm?')).not.toBeInTheDocument();
  });

  it('renders when open', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        onClose={() => {}}
        onConfirm={() => {}}
        title="Confirm?"
      />
    );
    expect(screen.getByText('Confirm?')).toBeInTheDocument();
  });

  it('renders title and description', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        onClose={() => {}}
        onConfirm={() => {}}
        title="Delete Item"
        description="This action cannot be undone."
      />
    );
    expect(screen.getByText('Delete Item')).toBeInTheDocument();
    expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();
  });

  it('calls onClose when cancel button is clicked', () => {
    const onClose = vi.fn();
    render(
      <ConfirmDialog
        isOpen={true}
        onClose={onClose}
        onConfirm={() => {}}
        title="Confirm?"
      />
    );
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onConfirm when confirm button is clicked', () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        isOpen={true}
        onClose={() => {}}
        onConfirm={onConfirm}
        title="Confirm?"
      />
    );
    fireEvent.click(screen.getByText('Confirm'));
    expect(onConfirm).toHaveBeenCalled();
  });

  it('uses custom button labels', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        onClose={() => {}}
        onConfirm={() => {}}
        title="Delete?"
        confirmLabel="Delete"
        cancelLabel="Keep"
      />
    );
    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.getByText('Keep')).toBeInTheDocument();
  });

  it('shows loading state on confirm button', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        onClose={() => {}}
        onConfirm={() => {}}
        title="Processing"
        loading={true}
      />
    );
    expect(screen.getByText('Confirm').closest('button')).toBeDisabled();
  });

  it('disables cancel button when loading', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        onClose={() => {}}
        onConfirm={() => {}}
        title="Processing"
        loading={true}
      />
    );
    expect(screen.getByText('Cancel').closest('button')).toBeDisabled();
  });

  it('renders with danger variant', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        onClose={() => {}}
        onConfirm={() => {}}
        title="Delete?"
        variant="danger"
      />
    );
    // The confirm button should have danger styling
    expect(screen.getByText('Confirm').closest('button')).toHaveClass('text-red-400');
  });

  it('renders with warning variant', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        onClose={() => {}}
        onConfirm={() => {}}
        title="Warning"
        variant="warning"
      />
    );
    // Icon should be amber colored
    const iconContainer = document.querySelector('.bg-amber-500\\/10');
    expect(iconContainer).toBeInTheDocument();
  });

  it('renders with info variant', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        onClose={() => {}}
        onConfirm={() => {}}
        title="Info"
        variant="info"
      />
    );
    const iconContainer = document.querySelector('.bg-blue-500\\/10');
    expect(iconContainer).toBeInTheDocument();
  });

  it('renders custom children', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        onClose={() => {}}
        onConfirm={() => {}}
        title="Custom Content"
      >
        <p>Additional information here</p>
      </ConfirmDialog>
    );
    expect(screen.getByText('Additional information here')).toBeInTheDocument();
  });
});

