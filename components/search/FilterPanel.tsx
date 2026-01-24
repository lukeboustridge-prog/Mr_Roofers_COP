'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  X,
  Filter,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  FileWarning,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { SUBSTRATES, FIXER_TASKS, FAILURE_OUTCOMES } from '@/lib/constants';

interface FilterPanelProps {
  className?: string;
  onFilterChange?: (filters: FilterState) => void;
}

export interface FilterState {
  substrate: string | null;
  category: string | null;
  hasWarnings: boolean;
  hasFailures: boolean;
  outcome: string | null;
}

const defaultFilters: FilterState = {
  substrate: null,
  category: null,
  hasWarnings: false,
  hasFailures: false,
  outcome: null,
};

/**
 * Search filter panel with substrate, category, and warning/failure filters.
 * Can be displayed inline or in a sheet for mobile.
 */
export function FilterPanel({ className, onFilterChange }: FilterPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<FilterState>(() => ({
    substrate: searchParams.get('substrate'),
    category: searchParams.get('category'),
    hasWarnings: searchParams.get('hasWarnings') === 'true',
    hasFailures: searchParams.get('hasFailures') === 'true',
    outcome: searchParams.get('outcome'),
  }));

  const [expandedSections, setExpandedSections] = useState({
    substrate: true,
    category: false,
    flags: true,
    outcome: false,
  });

  const activeFilterCount = Object.values(filters).filter(
    (v) => v !== null && v !== false
  ).length;

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const updateFilters = useCallback(
    (newFilters: Partial<FilterState>) => {
      const updated = { ...filters, ...newFilters };
      setFilters(updated);
      onFilterChange?.(updated);

      // Update URL params
      const params = new URLSearchParams(searchParams.toString());
      const query = params.get('q') || '';

      Object.entries(updated).forEach(([key, value]) => {
        if (value === null || value === false) {
          params.delete(key);
        } else if (typeof value === 'boolean') {
          params.set(key, 'true');
        } else {
          params.set(key, value);
        }
      });

      if (query) {
        params.set('q', query);
      }

      router.push(`/search?${params.toString()}`, { scroll: false });
    },
    [filters, onFilterChange, router, searchParams]
  );

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
    onFilterChange?.(defaultFilters);

    const params = new URLSearchParams();
    const query = searchParams.get('q');
    if (query) {
      params.set('q', query);
    }
    router.push(`/search?${params.toString()}`, { scroll: false });
  }, [onFilterChange, router, searchParams]);

  const FilterContent = () => (
    <div className="space-y-4">
      {/* Substrate Filter */}
      <FilterSection
        title="Substrate"
        expanded={expandedSections.substrate}
        onToggle={() => toggleSection('substrate')}
        badge={filters.substrate ? 1 : undefined}
      >
        <div className="grid grid-cols-2 gap-2">
          {SUBSTRATES.map((substrate) => (
            <button
              key={substrate.id}
              onClick={() =>
                updateFilters({
                  substrate: filters.substrate === substrate.id ? null : substrate.id,
                })
              }
              className={cn(
                'min-h-[48px] px-3 py-3 text-xs rounded-md border transition-colors text-left',
                filters.substrate === substrate.id
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background hover:bg-muted border-input'
              )}
            >
              {substrate.name}
            </button>
          ))}
        </div>
      </FilterSection>

      <Separator />

      {/* Category Filter */}
      <FilterSection
        title="Task Type"
        expanded={expandedSections.category}
        onToggle={() => toggleSection('category')}
        badge={filters.category ? 1 : undefined}
      >
        <div className="grid grid-cols-2 gap-2">
          {FIXER_TASKS.map((task) => (
            <button
              key={task.id}
              onClick={() =>
                updateFilters({
                  category: filters.category === task.id ? null : task.id,
                })
              }
              className={cn(
                'min-h-[48px] px-3 py-3 text-xs rounded-md border transition-colors text-left',
                filters.category === task.id
                  ? 'bg-secondary text-secondary-foreground border-secondary'
                  : 'bg-background hover:bg-muted border-input'
              )}
            >
              {task.name}
            </button>
          ))}
        </div>
      </FilterSection>

      <Separator />

      {/* Warning/Failure Flags */}
      <FilterSection
        title="Flags"
        expanded={expandedSections.flags}
        onToggle={() => toggleSection('flags')}
        badge={
          (filters.hasWarnings ? 1 : 0) + (filters.hasFailures ? 1 : 0) || undefined
        }
      >
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <Checkbox
              checked={filters.hasWarnings}
              onCheckedChange={(checked) =>
                updateFilters({ hasWarnings: checked === true })
              }
            />
            <span className="flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Has warnings
            </span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <Checkbox
              checked={filters.hasFailures}
              onCheckedChange={(checked) =>
                updateFilters({ hasFailures: checked === true })
              }
            />
            <span className="flex items-center gap-2 text-sm">
              <FileWarning className="h-4 w-4 text-red-500" />
              Has failure cases
            </span>
          </label>
        </div>
      </FilterSection>

      <Separator />

      {/* Outcome Filter (for failure searches) */}
      <FilterSection
        title="Failure Outcome"
        expanded={expandedSections.outcome}
        onToggle={() => toggleSection('outcome')}
        badge={filters.outcome ? 1 : undefined}
      >
        <div className="space-y-2">
          {FAILURE_OUTCOMES.map((outcome) => (
            <button
              key={outcome.id}
              onClick={() =>
                updateFilters({
                  outcome: filters.outcome === outcome.id ? null : outcome.id,
                })
              }
              className={cn(
                'w-full min-h-[48px] px-3 py-3 text-xs rounded-md border transition-colors text-left flex items-center gap-2',
                filters.outcome === outcome.id
                  ? outcome.color === 'red'
                    ? 'bg-red-100 text-red-800 border-red-300'
                    : outcome.color === 'orange'
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-green-100 text-green-800 border-green-300'
                  : 'bg-background hover:bg-muted border-input'
              )}
            >
              <span
                className={cn(
                  'w-2 h-2 rounded-full',
                  outcome.color === 'red'
                    ? 'bg-red-500'
                    : outcome.color === 'orange'
                    ? 'bg-amber-500'
                    : 'bg-green-500'
                )}
              />
              {outcome.name}
            </button>
          ))}
        </div>
      </FilterSection>
    </div>
  );

  return (
    <>
      {/* Desktop: Inline panel */}
      <div className={cn('hidden lg:block', className)}>
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </h3>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="text-xs min-h-[48px] min-w-[48px]"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset
              </Button>
            )}
          </div>
          <FilterContent />
        </div>
      </div>

      {/* Mobile: Sheet */}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="text-xs ml-1">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[400px]">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Search Filters
              </SheetTitle>
            </SheetHeader>
            <div className="mt-6 overflow-y-auto max-h-[calc(100vh-200px)]">
              <FilterContent />
            </div>
            <SheetFooter className="mt-6">
              <Button
                variant="outline"
                onClick={resetFilters}
                className="w-full"
                disabled={activeFilterCount === 0}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset All Filters
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

interface FilterSectionProps {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  badge?: number;
  children: React.ReactNode;
}

function FilterSection({
  title,
  expanded,
  onToggle,
  badge,
  children,
}: FilterSectionProps) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full py-2 text-sm font-medium hover:text-primary transition-colors"
      >
        <span className="flex items-center gap-2">
          {title}
          {badge !== undefined && (
            <Badge variant="secondary" className="text-xs h-5 px-1.5">
              {badge}
            </Badge>
          )}
        </span>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {expanded && <div className="pt-2 pb-1">{children}</div>}
    </div>
  );
}

/**
 * Active filter tags display - shows current filters as removable badges.
 */
export function ActiveFilters({
  filters,
  onRemove,
  onClear,
  className,
}: {
  filters: FilterState;
  onRemove: (key: keyof FilterState) => void;
  onClear: () => void;
  className?: string;
}) {
  const activeFilters = Object.entries(filters).filter(
    ([, value]) => value !== null && value !== false
  );

  if (activeFilters.length === 0) return null;

  const getFilterLabel = (key: string, value: string | boolean): string => {
    switch (key) {
      case 'substrate':
        return SUBSTRATES.find((s) => s.id === value)?.name || String(value);
      case 'category':
        return FIXER_TASKS.find((t) => t.id === value)?.name || String(value);
      case 'hasWarnings':
        return 'Has warnings';
      case 'hasFailures':
        return 'Has failures';
      case 'outcome':
        return FAILURE_OUTCOMES.find((o) => o.id === value)?.name || String(value);
      default:
        return String(value);
    }
  };

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <span className="text-xs text-muted-foreground">Active filters:</span>
      {activeFilters.map(([key, value]) => (
        <Badge
          key={key}
          variant="secondary"
          className="text-xs gap-1 pr-1 cursor-pointer hover:bg-secondary/80"
          onClick={() => onRemove(key as keyof FilterState)}
        >
          {getFilterLabel(key, value as string | boolean)}
          <X className="h-3 w-3" />
        </Badge>
      ))}
      <Button
        variant="ghost"
        size="sm"
        onClick={onClear}
        className="text-xs min-h-[48px] px-3"
      >
        Clear all
      </Button>
    </div>
  );
}

/**
 * Compact filter button for embedding in search bar.
 */
export function FilterButton({
  activeCount,
  onClick,
  className,
}: {
  activeCount: number;
  onClick: () => void;
  className?: string;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={cn('gap-1.5 h-8', className)}
    >
      <Filter className="h-4 w-4" />
      {activeCount > 0 && (
        <Badge variant="secondary" className="text-xs h-5 px-1.5">
          {activeCount}
        </Badge>
      )}
    </Button>
  );
}
