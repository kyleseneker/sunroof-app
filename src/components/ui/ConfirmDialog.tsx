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
    iconBg: 'bg-red-500/20 border border-red-500/30',
    confirmVariant: 'danger' as const,
    confirmClass: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 border-0 text-white font-semibold',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/20 border border-amber-500/30',
    confirmVariant: 'primary' as const,
    confirmClass: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 border-0 text-white font-semibold',
  },
  info: {
    icon: Info,
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-500/20 border border-blue-500/30',
    confirmVariant: 'primary' as const,
    confirmClass: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 border-0 text-white font-semibold',
  },
  confirm: {
    icon: HelpCircle,
    iconColor: 'text-white/70',
    iconBg: 'bg-white/10 border border-white/20',
    confirmVariant: 'primary' as const,
    confirmClass: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 border-0 text-white font-semibold',
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
        <div className={`w-12 h-12 rounded-full backdrop-blur-md ${config.iconBg} flex items-center justify-center mx-auto mb-4`}>
          <Icon className={`w-6 h-6 ${config.iconColor}`} />
        </div>

        {/* Title */}
        <h3 className="text-lg font-medium text-white mb-2">{title}</h3>

        {/* Description */}
        {description && (
          <p className="text-sm text-white/60 mb-4">{description}</p>
        )}

        {/* Custom content */}
        {children && <div className="mb-4 text-white/70">{children}</div>}

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
            fullWidth
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            {cancelLabel}
          </Button>
          <Button
            variant={config.confirmVariant}
            onClick={onConfirm}
            loading={loading}
            fullWidth
            className={config.confirmClass}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

