'use client';

import { cn } from '@/lib/utils';

interface VersionWatermarkProps {
  version?: string;
  className?: string;
}

/**
 * Displays a subtle COP version watermark for authoritative content.
 * Decorative element - hidden from screen readers.
 */
export function VersionWatermark({
  version = 'v25.12',
  className,
}: VersionWatermarkProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'text-[10px] text-primary/40 font-mono tracking-tight select-none',
        className
      )}
    >
      MRM COP {version}
    </span>
  );
}
