'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { Library, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AuthorityLevel } from '@/lib/constants';

const sourceBadgeVariants = cva(
  'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold',
  {
    variants: {
      authority: {
        authoritative: 'bg-primary/10 border-primary/30 text-primary',
        supplementary: 'bg-slate-100 border-slate-200 text-slate-600',
      },
      size: {
        sm: 'text-xs px-1.5 py-0',
        md: 'text-sm px-2 py-0.5',
      },
    },
    defaultVariants: {
      authority: 'supplementary',
      size: 'sm',
    },
  }
);

interface SourceBadgeProps extends VariantProps<typeof sourceBadgeVariants> {
  shortName: string;
  name?: string;
  showIcon?: boolean;
  className?: string;
}

/**
 * Displays a source badge with authority-aware styling.
 * Authoritative (MRM COP) shows blue styling with BookOpen icon.
 * Supplementary sources show grey styling with Library icon.
 */
export function SourceBadge({
  shortName,
  name,
  authority,
  size,
  showIcon = true,
  className,
}: SourceBadgeProps) {
  const Icon = authority === 'authoritative' ? BookOpen : Library;

  return (
    <span
      className={cn(sourceBadgeVariants({ authority, size }), className)}
      title={name || shortName}
    >
      {showIcon && <Icon className="h-3 w-3 mr-1" />}
      {shortName}
    </span>
  );
}

interface SourceAttributionProps {
  shortName: string;
  name: string;
  authority?: AuthorityLevel;
  updatedAt?: Date | null;
  className?: string;
}

/**
 * Displays source attribution with icon and optional timestamp.
 * Uses authority-aware styling for icon and text colors.
 */
export function SourceAttribution({
  shortName,
  name,
  authority = 'supplementary',
  updatedAt,
  className,
}: SourceAttributionProps) {
  const Icon = authority === 'authoritative' ? BookOpen : Library;
  const iconColorClass = authority === 'authoritative' ? 'text-primary' : 'text-slate-500';
  const textColorClass = authority === 'authoritative' ? 'text-primary' : 'text-slate-700';

  return (
    <div className={cn('flex items-center gap-2 text-sm text-slate-500', className)}>
      <Icon className={cn('h-4 w-4', iconColorClass)} />
      <span>
        Source: <strong className={textColorClass}>{name}</strong>
        {' '}({shortName})
      </span>
      {updatedAt && (
        <>
          <span className="text-slate-300">|</span>
          <span>
            Updated: {new Date(updatedAt).toLocaleDateString('en-NZ', {
              month: 'long',
              year: 'numeric',
            })}
          </span>
        </>
      )}
    </div>
  );
}
