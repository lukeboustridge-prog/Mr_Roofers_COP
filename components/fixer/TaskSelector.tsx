'use client';

import React from 'react';
import {
  Layers,
  Triangle,
  Square,
  CircleDot,
  LayoutGrid,
  Wind,
  HelpCircle,
  AlertTriangle,
  Wrench,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FIXER_TASKS } from '@/lib/constants';

// Map task IDs to icons with semantic meaning
const taskIcons: Record<string, React.ReactNode> = {
  flashings: <Layers className="h-8 w-8" />,      // Sheet/layers icon for flashings
  ridges: <Triangle className="h-8 w-8" />,       // Triangle for ridge/peak
  valleys: <Square className="h-8 w-8" />,        // V-shape concept
  penetrations: <CircleDot className="h-8 w-8" />, // Pipe/circular penetration
  gutters: <LayoutGrid className="h-8 w-8" />,    // Channel concept
  ventilation: <Wind className="h-8 w-8" />,      // Wind/airflow
  junctions: <Wrench className="h-8 w-8" />,      // Junction/corner work
  problem: <AlertTriangle className="h-8 w-8" />, // Alert for problem solving
  other: <HelpCircle className="h-8 w-8" />,      // General help
};

// Map task IDs to descriptions
const taskDescriptions: Record<string, string> = {
  flashings: 'Wall flashings, apron flashings, step flashings',
  ridges: 'Ridge caps, hip flashings, ridge vents',
  valleys: 'Valley gutters, valley flashings',
  penetrations: 'Pipes, vents, skylights, chimneys',
  gutters: 'Internal gutters, eaves gutters, downpipes',
  ventilation: 'Roof ventilation, soffit vents, ridge vents',
  junctions: 'Wall junctions, roof-to-roof junctions',
  problem: 'Leaks, damage, repairs, troubleshooting',
  other: 'Other roofing details and queries',
};

interface TaskSelectorProps {
  onSelect: (taskId: string) => void;
  selectedId?: string | null;
  className?: string;
}

export function TaskSelector({
  onSelect,
  selectedId,
  className,
}: TaskSelectorProps) {
  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-3', className)}>
      {FIXER_TASKS.map((task) => {
        const isSelected = selectedId === task.id;
        const icon = taskIcons[task.id] || <HelpCircle className="h-8 w-8" />;
        const description = taskDescriptions[task.id] || '';

        return (
          <button
            key={task.id}
            onClick={() => onSelect(task.id)}
            className={cn(
              'flex flex-col items-start gap-3 rounded-xl border-2 bg-white p-5 text-left transition-all',
              'hover:border-secondary hover:shadow-lg active:scale-[0.98]',
              'min-h-[120px] touch-manipulation',
              isSelected
                ? 'border-secondary bg-secondary/5 shadow-md'
                : 'border-slate-200'
            )}
            aria-pressed={isSelected}
          >
            <div
              className={cn(
                'flex h-14 w-14 items-center justify-center rounded-xl flex-shrink-0',
                isSelected
                  ? 'bg-secondary text-white'
                  : 'bg-secondary/10 text-secondary'
              )}
            >
              {icon}
            </div>
            <div>
              <span className="font-semibold text-slate-900 text-lg block">
                {task.name}
              </span>
              {description && (
                <span className="text-sm text-slate-500 mt-1 block line-clamp-2">
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
export function TaskSelectorCompact({
  onSelect,
  selectedId,
  className,
}: TaskSelectorProps) {
  return (
    <div className={cn('grid gap-3 grid-cols-2 sm:grid-cols-3', className)}>
      {FIXER_TASKS.map((task) => {
        const isSelected = selectedId === task.id;
        const icon = taskIcons[task.id] || <HelpCircle className="h-5 w-5" />;

        return (
          <button
            key={task.id}
            onClick={() => onSelect(task.id)}
            className={cn(
              'flex items-center gap-3 rounded-lg border-2 bg-white p-3 text-left transition-all',
              'hover:border-secondary active:scale-[0.98]',
              'min-h-[56px] touch-manipulation',
              isSelected
                ? 'border-secondary bg-secondary/5'
                : 'border-slate-200'
            )}
            aria-pressed={isSelected}
          >
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0',
                isSelected
                  ? 'bg-secondary text-white'
                  : 'bg-secondary/10 text-secondary'
              )}
            >
              {React.cloneElement(icon as React.ReactElement, {
                className: 'h-5 w-5',
              })}
            </div>
            <span className="font-medium text-slate-900 text-sm truncate">
              {task.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
