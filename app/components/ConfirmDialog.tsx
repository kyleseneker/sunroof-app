'use client';

import { ReactNode } from 'react';
import { AlertTriangle, Info, HelpCircle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

type DialogVariant = 'danger' | 'warning' | 'info' | 'confirm';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: DialogVariant;
  loading?: boolean;
  children?: ReactNode;
}

const variantConfig = {
  danger: {
    icon: AlertTriangle,
    iconColor: 'text-red-400',
    iconBg: 'bg-red-500/10',
    confirmVariant: 'danger' as const,
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/10',
    confirmVariant: 'primary' as const,
  },
  info: {
    icon: Info,
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-500/10',
    confirmVariant: 'primary' as const,
  },
  confirm: {
    icon: HelpCircle,
    iconColor: 'text-zinc-400',
    iconBg: 'bg-zinc-500/10',
    confirmVariant: 'primary' as const,
  },
};

/**
 * Confirmation Dialog for destructive or important actions
 */
export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'confirm',
  loading = false,
  children,
}: ConfirmDialogProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      showCloseButton={false}
      closeOnOverlayClick={!loading}
      closeOnEscape={!loading}
    >
      <div className="text-center">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-full ${config.iconBg} flex items-center justify-center mx-auto mb-4`}>
          <Icon className={`w-6 h-6 ${config.iconColor}`} />
        </div>

        {/* Title */}
        <h3 className="text-lg font-medium text-white mb-2">{title}</h3>

        {/* Description */}
        {description && (
          <p className="text-sm text-zinc-500 mb-4">{description}</p>
        )}

        {/* Custom content */}
        {children && <div className="mb-4">{children}</div>}

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
            fullWidth
          >
            {cancelLabel}
          </Button>
          <Button
            variant={config.confirmVariant}
            onClick={onConfirm}
            loading={loading}
            fullWidth
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

