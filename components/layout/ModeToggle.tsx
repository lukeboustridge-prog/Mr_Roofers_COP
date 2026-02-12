'use client';

import { useAppStore } from '@/stores/app-store';
import { cn } from '@/lib/utils';
import { Clipboard, Wrench } from 'lucide-react';

export function ModeToggle() {
  const { mode, setMode } = useAppStore();

  return (
    <div className="flex items-center rounded-lg bg-slate-100 p-1">
      <button
        onClick={() => setMode('planner')}
        className={cn(
          'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
          mode === 'planner'
            ? 'bg-white text-primary shadow-sm'
            : 'text-slate-600 hover:text-slate-900'
        )}
      >
        <Clipboard className="h-4 w-4" />
        <span className="hidden sm:inline">Planner</span>
      </button>
      <button
        onClick={() => setMode('fixer')}
        className={cn(
          'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
          mode === 'fixer'
            ? 'bg-white text-secondary shadow-sm'
            : 'text-slate-600 hover:text-slate-900'
        )}
      >
        <Wrench className="h-4 w-4" />
        <span className="hidden sm:inline">Guide</span>
      </button>
    </div>
  );
}
