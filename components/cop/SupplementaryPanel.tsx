'use client';

import { useState } from 'react';
import { ChevronDown, Info } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { SupplementaryContent } from '@/components/authority';
import { cn } from '@/lib/utils';

interface SupplementaryPanelProps {
  title: string;
  children: React.ReactNode;
}

/**
 * Collapsible panel for supplementary COP content (installation details, HTG guides).
 * Displays in grey bordered container with "Supplementary" label.
 * Collapsed by default (SUPP-01).
 */
export function SupplementaryPanel({ title, children }: SupplementaryPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <SupplementaryContent className="p-0 mt-6">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger
          className={cn(
            'flex w-full items-center justify-between gap-2 py-3 px-4',
            'hover:bg-slate-100/50 transition-colors rounded-t-lg cursor-pointer'
          )}
        >
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-slate-500" />
            <div className="flex flex-col items-start gap-0.5">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Supplementary
              </span>
              <span className="text-sm font-medium text-slate-900">{title}</span>
            </div>
          </div>
          <ChevronDown
            className={cn(
              'h-5 w-5 text-slate-500 transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="px-4 pb-4">
          {children}
        </CollapsibleContent>
      </Collapsible>
    </SupplementaryContent>
  );
}
