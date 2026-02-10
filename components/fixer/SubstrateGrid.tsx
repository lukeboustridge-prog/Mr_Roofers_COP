'use client';

import React from 'react';
import {
  LayoutGrid,
  Layers,
  Square,
  CircleDot,
  Hexagon,
  Triangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SUBSTRATES } from '@/lib/constants';

// Map substrate IDs to icons
const substrateIcons: Record<string, React.ReactNode> = {
  'long-run-metal': <LayoutGrid className="h-8 w-8" />,
  'profiled-metal': <LayoutGrid className="h-8 w-8" />,
  'membrane': <Layers className="h-8 w-8" />,
  'asphalt-shingle': <Square className="h-8 w-8" />,
  'shingle': <Square className="h-8 w-8" />,
  'concrete-tile': <Hexagon className="h-8 w-8" />,
  'clay-tile': <CircleDot className="h-8 w-8" />,
  'pressed-metal-tile': <Triangle className="h-8 w-8" />,
  'pressed-metal': <Triangle className="h-8 w-8" />,
};

// Map substrate IDs to descriptions
const substrateDescriptions: Record<string, string> = {
  'long-run-metal': 'Long-run, corrugated, standing seam',
  'profiled-metal': 'Long-run, corrugated, standing seam',
  'membrane': 'Single-ply, torch-on, liquid applied',
  'asphalt-shingle': 'Composition shingles',
  'shingle': 'Composition shingles',
  'concrete-tile': 'Standard concrete roof tiles',
  'clay-tile': 'Traditional clay roof tiles',
  'pressed-metal-tile': 'Metal tiles mimicking clay/concrete',
  'pressed-metal': 'Metal tiles mimicking clay/concrete',
};

interface SubstrateGridProps {
  onSelect: (substrateId: string) => void;
  selectedId?: string | null;
  className?: string;
  comingSoonIds?: string[];
}

export function SubstrateGrid({
  onSelect,
  selectedId,
  className,
  comingSoonIds = [],
}: SubstrateGridProps) {
  const comingSoonSet = new Set(comingSoonIds);

  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-3', className)}>
      {SUBSTRATES.map((substrate) => {
        const isSelected = selectedId === substrate.id;
        const isComingSoon = comingSoonSet.has(substrate.id);
        const icon = substrateIcons[substrate.id] || <Square className="h-8 w-8" />;
        const description = substrateDescriptions[substrate.id] || '';

        return (
          <button
            key={substrate.id}
            onClick={() => !isComingSoon && onSelect(substrate.id)}
            disabled={isComingSoon}
            className={cn(
              'flex flex-col items-start gap-3 rounded-xl border-2 bg-white p-5 text-left transition-all',
              'min-h-[120px] touch-manipulation',
              isComingSoon
                ? 'border-slate-200 opacity-60 cursor-not-allowed'
                : 'hover:border-primary hover:shadow-lg active:scale-[0.98]',
              isSelected
                ? 'border-primary bg-primary/5 shadow-md'
                : !isComingSoon && 'border-slate-200'
            )}
            aria-pressed={isSelected}
            aria-disabled={isComingSoon}
          >
            <div className="flex items-start justify-between w-full">
              <div
                className={cn(
                  'flex h-14 w-14 items-center justify-center rounded-xl flex-shrink-0',
                  isComingSoon
                    ? 'bg-slate-100 text-slate-400'
                    : isSelected
                    ? 'bg-primary text-white'
                    : 'bg-primary/10 text-primary'
                )}
              >
                {icon}
              </div>
              {isComingSoon && (
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                  Coming Soon
                </span>
              )}
            </div>
            <div>
              <span className={cn(
                'font-semibold text-lg block',
                isComingSoon ? 'text-slate-400' : 'text-slate-900'
              )}>
                {substrate.name}
              </span>
              {description && (
                <span className={cn(
                  'text-sm mt-1 block',
                  isComingSoon ? 'text-slate-300' : 'text-slate-500'
                )}>
                  {description}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// Compact version for smaller spaces
export function SubstrateGridCompact({
  onSelect,
  selectedId,
  className,
  comingSoonIds = [],
}: SubstrateGridProps) {
  const comingSoonSet = new Set(comingSoonIds);

  return (
    <div className={cn('grid gap-3 grid-cols-2 sm:grid-cols-3', className)}>
      {SUBSTRATES.map((substrate) => {
        const isSelected = selectedId === substrate.id;
        const isComingSoon = comingSoonSet.has(substrate.id);
        const icon = substrateIcons[substrate.id] || <Square className="h-6 w-6" />;

        return (
          <button
            key={substrate.id}
            onClick={() => !isComingSoon && onSelect(substrate.id)}
            disabled={isComingSoon}
            className={cn(
              'flex items-center gap-3 rounded-lg border-2 bg-white p-3 text-left transition-all',
              'min-h-[56px] touch-manipulation',
              isComingSoon
                ? 'border-slate-200 opacity-60 cursor-not-allowed'
                : 'hover:border-primary active:scale-[0.98]',
              isSelected
                ? 'border-primary bg-primary/5'
                : !isComingSoon && 'border-slate-200'
            )}
            aria-pressed={isSelected}
            aria-disabled={isComingSoon}
          >
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0',
                isComingSoon
                  ? 'bg-slate-100 text-slate-400'
                  : isSelected
                  ? 'bg-primary text-white'
                  : 'bg-primary/10 text-primary'
              )}
            >
              {React.cloneElement(icon as React.ReactElement, {
                className: 'h-5 w-5',
              })}
            </div>
            <div className="flex flex-col min-w-0">
              <span className={cn(
                'font-medium text-sm truncate',
                isComingSoon ? 'text-slate-400' : 'text-slate-900'
              )}>
                {substrate.name}
              </span>
              {isComingSoon && (
                <span className="text-[10px] text-slate-400">Coming Soon</span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
