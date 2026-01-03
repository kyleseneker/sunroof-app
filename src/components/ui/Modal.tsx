'use client';

/**
 * Modal component with focus trap and keyboard handling
 */

import { ReactNode, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useFocusTrap } from '@/hooks';
import { cn } from '@/lib';
import IconButton from './IconButton';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  /** Position modal near top on mobile (useful when modal has inputs to avoid keyboard overlap) */
  mobileTopAlign?: boolean;
}

const sizeStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  full: 'max-w-full mx-4',
};

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  mobileTopAlign = false,
}: ModalProps) {
  const modalRef = useFocusTrap<HTMLDivElement>(isOpen);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEscape, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOverlayClick = (event: React.MouseEvent) => {
    if (closeOnOverlayClick && event.target === overlayRef.current) {
      onClose();
    }
  };

  const titleId = title ? 'modal-title' : undefined;
  const descriptionId = description ? 'modal-description' : undefined;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className={cn(
        "fixed inset-0 z-[70] flex justify-center p-4 bg-[var(--bg-base)]/80 backdrop-blur-sm animate-fade-in",
        mobileTopAlign ? "items-start pt-20 sm:items-center sm:pt-4" : "items-center"
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <div
        ref={modalRef}
        className={cn(
          sizeStyles[size],
          'w-full',
          'bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-2xl',
          'shadow-[var(--shadow-xl)]',
          'animate-scale-in'
        )}
      >
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b border-[var(--border-base)]">
            {title && (
              <div>
                <h2 id={titleId} className="text-lg font-medium text-[var(--fg-base)]">
                  {title}
                </h2>
                {description && (
                  <p id={descriptionId} className="text-sm text-[var(--fg-subtle)] mt-1">
                    {description}
                  </p>
                )}
              </div>
            )}
            {showCloseButton && (
              <IconButton 
                icon={<X className="w-4 h-4" />}
                label="Close modal"
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="ml-auto"
              />
            )}
          </div>
        )}

        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
