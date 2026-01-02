'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib';

interface PageHeaderProps {
  title: string;
  onBack?: () => void;
  rightContent?: ReactNode;
  className?: string;
  sticky?: boolean;
}

export default function PageHeader({ 
  title, 
  onBack, 
  rightContent, 
  className,
  sticky = false,
}: PageHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <header 
      className={cn(
        'relative z-10 flex items-center gap-4 p-6',
        'bg-gradient-to-b from-[var(--bg-base)]/80 to-transparent backdrop-blur-md',
        sticky && 'sticky top-0',
        className
      )}
    >
      <button 
        onClick={handleBack}
        className="w-10 h-10 rounded-full bg-[var(--bg-hover)] flex items-center justify-center hover:bg-[var(--bg-active)] transition-colors"
        aria-label="Go back"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
      <h1 className="text-xl font-medium flex-1">{title}</h1>
      {rightContent && (
        <div className="flex items-center gap-2">
          {rightContent}
        </div>
      )}
    </header>
  );
}

