'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib';
import IconButton from './IconButton';

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
      <IconButton icon={<ArrowLeft className="w-5 h-5" />} label="Go back" onClick={handleBack} />
      <h1 className="text-xl font-medium flex-1">{title}</h1>
      {rightContent && (
        <div className="flex items-center gap-2">
          {rightContent}
        </div>
      )}
    </header>
  );
}
