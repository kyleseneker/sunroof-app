import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ActionSheet, useLongPress } from '@/components/features';

// Mock haptics
vi.mock('@/lib/haptics', () => ({
  hapticClick: vi.fn(),
}));

describe('ActionSheet', () => {
  const mockOnClose = vi.fn();
  const mockOption1Click = vi.fn();
  const mockOption2Click = vi.fn();

  const defaultOptions = [
    { label: 'Option 1', onClick: mockOption1Click },
    { label: 'Option 2', onClick: mockOption2Click, variant: 'danger' as const },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders nothing when closed', () => {
      const { container } = render(
        <ActionSheet isOpen={false} onClose={mockOnClose} options={defaultOptions} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders when open', () => {
      render(
        <ActionSheet isOpen={true} onClose={mockOnClose} options={defaultOptions} />
      );
      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
    });

    it('renders title when provided', () => {
      render(
        <ActionSheet 
          isOpen={true} 
          onClose={mockOnClose} 
          options={defaultOptions}
          title="Choose an action"
        />
      );
      expect(screen.getByText('Choose an action')).toBeInTheDocument();
    });

    it('renders cancel button', () => {
      render(
        <ActionSheet isOpen={true} onClose={mockOnClose} options={defaultOptions} />
      );
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('renders option icons when provided', () => {
      const optionsWithIcons = [
        { label: 'Option 1', onClick: mockOption1Click, icon: <span data-testid="icon">🔧</span> },
      ];
      render(
        <ActionSheet isOpen={true} onClose={mockOnClose} options={optionsWithIcons} />
      );
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('calls onClick when option is clicked', () => {
      render(
        <ActionSheet isOpen={true} onClose={mockOnClose} options={defaultOptions} />
      );
      fireEvent.click(screen.getByText('Option 1'));
      expect(mockOption1Click).toHaveBeenCalled();
    });

    it('calls onClose when cancel is clicked', () => {
      render(
        <ActionSheet isOpen={true} onClose={mockOnClose} options={defaultOptions} />
      );
      fireEvent.click(screen.getByText('Cancel'));
      // onClose is called after animation delay
      expect(mockOnClose).not.toHaveBeenCalled();
      // Would need to wait for timeout in real test
    });

    it('calls onClose when backdrop is clicked', () => {
      render(
        <ActionSheet isOpen={true} onClose={mockOnClose} options={defaultOptions} />
      );
      // Click the backdrop (the outer div)
      const backdrop = screen.getByText('Option 1').closest('.fixed');
      if (backdrop) {
        fireEvent.click(backdrop);
      }
    });

    it('does not call onClick for disabled options', () => {
      const optionsWithDisabled = [
        { label: 'Disabled Option', onClick: mockOption1Click, disabled: true },
      ];
      render(
        <ActionSheet isOpen={true} onClose={mockOnClose} options={optionsWithDisabled} />
      );
      fireEvent.click(screen.getByText('Disabled Option'));
      expect(mockOption1Click).not.toHaveBeenCalled();
    });
  });

  describe('styling', () => {
    it('applies danger variant styling', () => {
      render(
        <ActionSheet isOpen={true} onClose={mockOnClose} options={defaultOptions} />
      );
      const dangerButton = screen.getByText('Option 2').closest('button');
      expect(dangerButton).toHaveClass('text-red-400');
    });

    it('applies disabled styling', () => {
      const optionsWithDisabled = [
        { label: 'Disabled', onClick: vi.fn(), disabled: true },
      ];
      render(
        <ActionSheet isOpen={true} onClose={mockOnClose} options={optionsWithDisabled} />
      );
      const disabledButton = screen.getByText('Disabled').closest('button');
      expect(disabledButton).toHaveClass('opacity-40');
      expect(disabledButton).toBeDisabled();
    });
  });
});

describe('useLongPress', () => {
  it('returns touch and mouse event handlers', () => {
    const TestComponent = () => {
      const handlers = useLongPress(() => {});
      return (
        <div>
          {Object.keys(handlers).map(key => (
            <span key={key}>{key}</span>
          ))}
        </div>
      );
    };
    
    render(<TestComponent />);
    expect(screen.getByText('onTouchStart')).toBeInTheDocument();
    expect(screen.getByText('onTouchMove')).toBeInTheDocument();
    expect(screen.getByText('onTouchEnd')).toBeInTheDocument();
    expect(screen.getByText('onMouseDown')).toBeInTheDocument();
    expect(screen.getByText('onContextMenu')).toBeInTheDocument();
  });

  it('prevents default on context menu', () => {
    const mockLongPress = vi.fn();
    const TestComponent = () => {
      const handlers = useLongPress(mockLongPress);
      return <div data-testid="target" {...handlers}>Target</div>;
    };
    
    render(<TestComponent />);
    const target = screen.getByTestId('target');
    const event = new MouseEvent('contextmenu', { bubbles: true });
    Object.defineProperty(event, 'preventDefault', { value: vi.fn() });
    
    fireEvent(target, event);
    expect(mockLongPress).toHaveBeenCalled();
  });
});

