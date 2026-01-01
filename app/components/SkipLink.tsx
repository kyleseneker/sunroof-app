'use client';

/**
 * Skip Link - Accessibility component for keyboard users
 * Allows users to skip repetitive navigation and jump to main content
 */
export default function SkipLink() {
  return (
    <a
      href="#main-content"
      className="
        sr-only focus:not-sr-only
        fixed top-4 left-4 z-[100]
        px-4 py-2 rounded-lg
        bg-white text-black font-medium
        focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-black
        transition-all
      "
    >
      Skip to main content
    </a>
  );
}

