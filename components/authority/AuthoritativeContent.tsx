'use client';

import { cn } from '@/lib/utils';
import { VersionWatermark } from './VersionWatermark';

interface AuthoritativeContentProps {
  children: React.ReactNode;
  showWatermark?: boolean;
  className?: string;
}

/**
 * Wrapper component for MRM COP authoritative content.
 * Applies blue border-left and blue-tinted background for visual distinction.
 */
export function AuthoritativeContent({
  children,
  showWatermark = false,
  className,
}: AuthoritativeContentProps) {
  return (
    <div
      className={cn(
        'relative rounded-lg border-l-4 border-primary bg-primary/5 p-4',
        className
      )}
    >
      {showWatermark && (
        <VersionWatermark className="absolute top-2 right-2" />
      )}
      {children}
    </div>
  );
}
