'use client';

import { cn } from '@/lib/utils';

interface SupplementaryContentProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Wrapper component for supplementary content (e.g., RANZ Guide).
 * Applies grey border-left and grey-tinted background for visual distinction.
 */
export function SupplementaryContent({
  children,
  className,
}: SupplementaryContentProps) {
  return (
    <div
      className={cn(
        'relative rounded-lg border-l-4 border-slate-300 bg-slate-50 p-4',
        className
      )}
    >
      {children}
    </div>
  );
}
