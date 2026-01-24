'use client';

import Link from 'next/link';
import { AlertTriangle, ShieldAlert, FileWarning } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface FailureBadgeProps {
  count: number;
  detailId?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

/**
 * Red badge showing failure case count for a detail.
 * Links to the failures page filtered by the detail if detailId is provided.
 */
export function FailureBadge({
  count,
  detailId,
  size = 'md',
  showLabel = true,
  className,
}: FailureBadgeProps) {
  if (count === 0) return null;

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-2.5 py-1',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4',
  };

  const badge = (
    <Badge
      variant="destructive"
      className={cn(
        'bg-red-100 text-red-700 border border-red-200 hover:bg-red-200 transition-colors',
        sizeClasses[size],
        detailId && 'cursor-pointer',
        className
      )}
    >
      <AlertTriangle className={cn('mr-1', iconSizes[size])} />
      {count}
      {showLabel && (
        <span className="ml-1">
          {count === 1 ? 'failure' : 'failures'}
        </span>
      )}
    </Badge>
  );

  if (!detailId) {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href={`/failures?detail=${detailId}`}>
            {badge}
          </Link>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-xs">View related failure cases</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface FailureIndicatorProps {
  hasFailures: boolean;
  count?: number;
  className?: string;
}

/**
 * Simple indicator showing if a detail has associated failures.
 * Shows a red dot/icon without the count.
 */
export function FailureIndicator({
  hasFailures,
  count,
  className,
}: FailureIndicatorProps) {
  if (!hasFailures) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-100',
              className
            )}
          >
            <ShieldAlert className="h-3 w-3 text-red-600" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-xs">
            {count ? `${count} related failure case${count > 1 ? 's' : ''}` : 'Has related failure cases'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface FailureSummaryBadgeProps {
  caseId: string;
  outcome: 'upheld' | 'partially-upheld' | 'dismissed' | null;
  failureType?: string | null;
  className?: string;
}

/**
 * Badge showing a specific failure case with outcome coloring.
 */
export function FailureSummaryBadge({
  caseId,
  outcome,
  failureType,
  className,
}: FailureSummaryBadgeProps) {
  const outcomeStyles = {
    'upheld': 'bg-red-100 text-red-800 border-red-300',
    'partially-upheld': 'bg-amber-100 text-amber-800 border-amber-300',
    'dismissed': 'bg-green-100 text-green-800 border-green-300',
  };

  const style = outcome ? outcomeStyles[outcome] : outcomeStyles['upheld'];

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-mono text-xs',
        style,
        className
      )}
    >
      <FileWarning className="mr-1 h-3 w-3" />
      {caseId}
      {failureType && (
        <span className="ml-1.5 opacity-75">({failureType})</span>
      )}
    </Badge>
  );
}

interface FailureStatProps {
  total: number;
  upheld?: number;
  partiallyUpheld?: number;
  dismissed?: number;
  className?: string;
}

/**
 * Summary stats of failure cases with breakdown by outcome.
 */
export function FailureStat({
  total,
  upheld = 0,
  partiallyUpheld = 0,
  dismissed = 0,
  className,
}: FailureStatProps) {
  if (total === 0) {
    return (
      <div className={cn('text-sm text-slate-500', className)}>
        No related failure cases
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-3 text-xs', className)}>
      <span className="font-medium text-slate-700">
        {total} case{total > 1 ? 's' : ''}
      </span>
      {upheld > 0 && (
        <span className="text-red-600">{upheld} upheld</span>
      )}
      {partiallyUpheld > 0 && (
        <span className="text-amber-600">{partiallyUpheld} partial</span>
      )}
      {dismissed > 0 && (
        <span className="text-green-600">{dismissed} dismissed</span>
      )}
    </div>
  );
}
