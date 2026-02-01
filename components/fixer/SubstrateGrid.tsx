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
}

export function SubstrateGrid({
  onSelect,
  selectedId,
  className,
}: SubstrateGridProps) {
  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-3', className)}>
      {SUBSTRATES.map((substrate) => {
        const isSelected = selectedId === substrate.id;
        const icon = substrateIcons[substrate.id] || <Square className="h-8 w-8" />;
        const description = substrateDescriptions[substrate.id] || '';

        return (
          <button
            key={substrate.id}
            onClick={() => onSelect(substrate.id)}
            className={cn(
              'flex flex-col items-start gap-3 rounded-xl border-2 bg-white p-5 text-left transition-all',
              'hover:border-primary hover:shadow-lg active:scale-[0.98]',
              'min-h-[120px] touch-manipulation',
              isSelected
                ? 'border-primary bg-primary/5 shadow-md'
                : 'border-slate-200'
            )}
            aria-pressed={isSelected}
          >
            <div
              className={cn(
                'flex h-14 w-14 items-center justify-center rounded-xl flex-shrink-0',
                isSelected
                  ? 'bg-primary text-white'
                  : 'bg-primary/10 text-primary'
              )}
            >
              {icon}
            </div>
            <div>
              <span className="font-semibold text-slate-900 text-lg block">
                {substrate.name}
              </span>
              {description && (
                <span className="text-sm text-slate-500 mt-1 block">
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
}: SubstrateGridProps) {
  return (
    <div className={cn('grid gap-3 grid-cols-2 sm:grid-cols-3', className)}>
      {SUBSTRATES.map((substrate) => {
        const isSelected = selectedId === substrate.id;
        const icon = substrateIcons[substrate.id] || <Square className="h-6 w-6" />;

        return (
          <button
            key={substrate.id}
            onClick={() => onSelect(substrate.id)}
            className={cn(
              'flex items-center gap-3 rounded-lg border-2 bg-white p-3 text-left transition-all',
              'hover:border-primary active:scale-[0.98]',
              'min-h-[56px] touch-manipulation',
              isSelected
                ? 'border-primary bg-primary/5'
                : 'border-slate-200'
            )}
            aria-pressed={isSelected}
          >
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0',
                isSelected
                  ? 'bg-primary text-white'
                  : 'bg-primary/10 text-primary'
              )}
            >
              {React.cloneElement(icon as React.ReactElement, {
                className: 'h-5 w-5',
              })}
            </div>
            <span className="font-medium text-slate-900 text-sm truncate">
              {substrate.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
