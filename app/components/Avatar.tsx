'use client';

import Image from 'next/image';
import { Camera, Loader2 } from 'lucide-react';

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  email?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showUploadButton?: boolean;
  uploading?: boolean;
  onUploadClick?: () => void;
  className?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-sm',
  lg: 'w-16 h-16 text-xl',
  xl: 'w-24 h-24 text-3xl',
};

const uploadButtonSizes = {
  xs: 'w-4 h-4',
  sm: 'w-5 h-5',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-8 h-8',
};

/**
 * Extracts initials from a name or email for avatar fallback.
 */
function getInitials(name?: string | null, email?: string | null): string {
  if (name && name.trim()) {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  }
  if (email) {
    return email[0].toUpperCase();
  }
  return '?';
}

/**
 * Reusable Avatar component with image support and initial fallback.
 * Features gradient background, optional upload button, and multiple sizes.
 */
export default function Avatar({
  src,
  name,
  email,
  size = 'md',
  showUploadButton = false,
  uploading = false,
  onUploadClick,
  className = '',
}: AvatarProps) {
  const initials = getInitials(name, email);
  const sizeClass = sizeClasses[size];
  const uploadSize = uploadButtonSizes[size];

  return (
    <div className={`relative ${sizeClass} ${className}`}>
      {/* Avatar Circle */}
      <div
        className={`
          w-full h-full
          relative rounded-full overflow-hidden
          bg-gradient-to-br from-orange-500 via-pink-500 to-purple-500
          flex items-center justify-center font-bold text-white
          shadow-lg shadow-orange-500/20
        `}
      >
        {src ? (
          <Image
            src={src}
            alt={name || 'Avatar'}
            fill
            className="object-cover"
            sizes={size === 'xl' ? '96px' : size === 'lg' ? '64px' : '40px'}
          />
        ) : (
          <span className="select-none">{initials}</span>
        )}
      </div>

      {/* Upload Button Overlay */}
      {showUploadButton && onUploadClick && (
        <button
          onClick={onUploadClick}
          disabled={uploading}
          className={`
            absolute bottom-0 right-0
            ${uploadSize}
            rounded-full bg-zinc-800 border-2 border-black
            flex items-center justify-center
            hover:bg-zinc-700 transition-colors
            disabled:opacity-50
          `}
          aria-label="Upload avatar"
        >
          {uploading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Camera className="w-3 h-3" />
          )}
        </button>
      )}
    </div>
  );
}

export { getInitials };

