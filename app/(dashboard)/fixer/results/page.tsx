'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAppStore } from '@/stores/app-store';
import { SUBSTRATES, FIXER_TASKS } from '@/lib/constants';
import {
  ArrowLeft,
  AlertTriangle,
  FileText,
  ChevronRight,
  RefreshCw,
  Heart,
  ArrowUpDown,
  Filter,
  Search,
  Wrench,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';

interface DetailResult {
  id: string;
  code: string;
  name: string;
  description: string | null;
  substrateId: string | null;
  categoryId: string | null;
  thumbnailUrl: string | null;
  warningCount: number;
  failureCount: number;
}

type SortOption = 'code' | 'name' | 'warnings' | 'failures';
type FilterOption = 'all' | 'warnings' | 'failures' | 'clean';

export default function FixerResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { fixerContext, setFixerContext, clearFixerContext } = useAppStore();

  // Get params from URL first, fall back to store
  const urlSubstrate = searchParams.get('substrate');
  const urlTask = searchParams.get('task');
  const substrateId = urlSubstrate || fixerContext.substrate;
  const taskId = urlTask || fixerContext.task;

  const [results, setResults] = useState<DetailResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favourites, setFavourites] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<SortOption>('code');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');

  const substrate = SUBSTRATES.find((s) => s.id === substrateId);
  const task = FIXER_TASKS.find((t) => t.id === taskId);

  // Sync URL params with store
  useEffect(() => {
    if (urlSubstrate && urlTask) {
      if (urlSubstrate !== fixerContext.substrate || urlTask !== fixerContext.task) {
        setFixerContext({ substrate: urlSubstrate, task: urlTask });
      }
    }
  }, [urlSubstrate, urlTask, fixerContext, setFixerContext]);

  // Fetch results from API
  useEffect(() => {
    async function fetchResults() {
      if (!substrateId) {
        router.push('/fixer');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({ substrate: substrateId });
        if (taskId && taskId !== 'other') {
          params.append('task', taskId);
        }

        const response = await fetch(`/api/fixer?${params}`);
        if (!response.ok) {
          throw new Error('Failed to fetch results');
        }

        const data = await response.json();
        setResults(data.details || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchResults();
  }, [substrateId, taskId, router]);

  // Fetch user's favourites
  useEffect(() => {
    async function fetchFavourites() {
      try {
        const response = await fetch('/api/favourites');
        if (response.ok) {
          const data = await response.json();
          const favIds = new Set<string>((data.data || []).map((d: { id: string }) => d.id));
          setFavourites(favIds);
        }
      } catch (err) {
        console.error('Failed to fetch favourites:', err);
      }
    }
    fetchFavourites();
  }, []);

  // Toggle favourite
  const toggleFavourite = useCallback(async (detailId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const isFav = favourites.has(detailId);

    // Optimistic update
    setFavourites((prev) => {
      const next = new Set(prev);
      if (isFav) {
        next.delete(detailId);
      } else {
        next.add(detailId);
      }
      return next;
    });

    try {
      if (isFav) {
        await fetch(`/api/favourites?detailId=${detailId}`, { method: 'DELETE' });
      } else {
        await fetch('/api/favourites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ detailId }),
        });
      }
    } catch {
      // Revert on error
      setFavourites((prev) => {
        const next = new Set(prev);
        if (isFav) {
          next.add(detailId);
        } else {
          next.delete(detailId);
        }
        return next;
      });
    }
  }, [favourites]);

  // Filtered and sorted results
  const displayResults = useMemo(() => {
    let filtered = [...results];

    // Apply filter
    switch (filterBy) {
      case 'warnings':
        filtered = filtered.filter((d) => d.warningCount > 0);
        break;
      case 'failures':
        filtered = filtered.filter((d) => d.failureCount > 0);
        break;
      case 'clean':
        filtered = filtered.filter((d) => d.warningCount === 0 && d.failureCount === 0);
        break;
    }

    // Apply sort
    switch (sortBy) {
      case 'code':
        filtered.sort((a, b) => a.code.localeCompare(b.code));
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'warnings':
        filtered.sort((a, b) => b.warningCount - a.warningCount);
        break;
      case 'failures':
        filtered.sort((a, b) => b.failureCount - a.failureCount);
        break;
    }

    return filtered;
  }, [results, sortBy, filterBy]);

  const handleNewSearch = () => {
    clearFixerContext();
    router.push('/fixer');
  };

  const handleChangeTask = () => {
    router.push(`/fixer?substrate=${substrateId}`);
  };

  const clearFilter = () => {
    setFilterBy('all');
  };

  if (!substrate) {
    return null;
  }

  const filterCount = filterBy !== 'all' ? displayResults.length : null;

  // Build breadcrumb items for fixer mode
  const breadcrumbItems = [
    { label: 'Fixer', href: '/fixer' },
    ...(substrate ? [{ label: substrate.name, href: `/fixer?substrate=${substrateId}` }] : []),
    ...(task ? [{ label: task.name }] : [{ label: 'Results' }]),
  ];

  return (
    <div className="container max-w-4xl p-4 md:p-6 lg:p-8 pb-24">
      {/* Breadcrumbs */}
      <Breadcrumbs items={breadcrumbItems} className="mb-4" />

      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          className="-ml-2 mb-2 min-h-[48px]"
          onClick={handleNewSearch}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          New Search
        </Button>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="text-base py-2 px-4">
            {substrate.name}
          </Badge>
          <ChevronRight className="h-4 w-4 text-slate-400" />
          {task && (
            <Badge
              variant="outline"
              className="text-base py-2 px-4 border-secondary text-secondary"
            >
              {task.name}
            </Badge>
          )}
        </div>

        <h1 className="mt-4 text-2xl font-bold text-slate-900">
          {loading ? (
            <Skeleton className="h-8 w-48" />
          ) : (
            `${displayResults.length} Detail${displayResults.length !== 1 ? 's' : ''} Found`
          )}
        </h1>
        <p className="mt-1 text-slate-600">
          {task
            ? `Showing ${task.name.toLowerCase()} details for ${substrate.name}`
            : `Showing all details for ${substrate.name}`}
        </p>
      </div>

      {/* Sort and Filter Controls */}
      {!loading && results.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {/* Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="min-h-[40px]">
                <ArrowUpDown className="mr-2 h-4 w-4" />
                Sort: {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSortBy('code')}>
                Code (A-Z)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('name')}>
                Name (A-Z)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('warnings')}>
                Most Warnings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('failures')}>
                Most Failure Cases
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={filterBy !== 'all' ? 'default' : 'outline'}
                size="sm"
                className="min-h-[40px]"
              >
                <Filter className="mr-2 h-4 w-4" />
                {filterBy === 'all'
                  ? 'Filter'
                  : filterBy === 'warnings'
                  ? 'Has Warnings'
                  : filterBy === 'failures'
                  ? 'Has Failures'
                  : 'No Issues'}
                {filterCount !== null && (
                  <Badge variant="secondary" className="ml-2">
                    {filterCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Filter by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setFilterBy('all')}>
                Show All ({results.length})
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterBy('warnings')}>
                <AlertTriangle className="mr-2 h-4 w-4 text-amber-500" />
                Has Warnings ({results.filter((d) => d.warningCount > 0).length})
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterBy('failures')}>
                <AlertTriangle className="mr-2 h-4 w-4 text-red-500" />
                Has Failure Cases ({results.filter((d) => d.failureCount > 0).length})
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterBy('clean')}>
                No Issues ({results.filter((d) => d.warningCount === 0 && d.failureCount === 0).length})
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Clear Filter Button */}
          {filterBy !== 'all' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilter}
              className="min-h-[40px]"
            >
              <X className="mr-1 h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-400" />
            <p className="mt-4 font-medium text-red-600">{error}</p>
            <p className="mt-1 text-sm text-slate-500">
              There was a problem loading the results
            </p>
            <Button onClick={handleNewSearch} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && !error && results.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-4 font-medium text-slate-700">
              No details found for this selection
            </p>
            <p className="text-sm text-slate-500 mb-6">
              Try selecting a different task type or substrate
            </p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={handleChangeTask}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Change Task
              </Button>
              <Button onClick={handleNewSearch}>
                <Wrench className="mr-2 h-4 w-4" />
                New Search
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtered Empty State */}
      {!loading && !error && results.length > 0 && displayResults.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Filter className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-4 font-medium text-slate-700">
              No details match your filter
            </p>
            <p className="text-sm text-slate-500 mb-4">
              {filterBy === 'warnings' && 'No details have warnings'}
              {filterBy === 'failures' && 'No details have linked failure cases'}
              {filterBy === 'clean' && 'All details have warnings or failure cases'}
            </p>
            <Button variant="outline" onClick={clearFilter}>
              <X className="mr-2 h-4 w-4" />
              Clear Filter
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results List */}
      {!loading && !error && displayResults.length > 0 && (
        <div className="space-y-3">
          {displayResults.map((detail) => {
            const isFavourite = favourites.has(detail.id);

            return (
              <Link
                key={detail.id}
                href={`/planner/${detail.substrateId}/${detail.categoryId}/${detail.id}`}
              >
                <Card className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50 active:scale-[0.99] touch-manipulation">
                  <CardContent className="flex items-center gap-4 p-4 min-h-[100px]">
                    {/* Thumbnail */}
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden">
                      {detail.thumbnailUrl ? (
                        <Image
                          src={detail.thumbnailUrl}
                          alt={detail.name}
                          width={64}
                          height={64}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <FileText className="h-8 w-8 text-slate-400" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="font-mono text-base">
                          {detail.code}
                        </Badge>
                        {detail.warningCount > 0 && (
                          <Badge className="bg-amber-100 text-amber-700 text-xs">
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            {detail.warningCount}
                          </Badge>
                        )}
                        {detail.failureCount > 0 && (
                          <Badge className="bg-red-100 text-red-700 text-xs">
                            {detail.failureCount} case{detail.failureCount > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 font-medium text-slate-900 text-lg truncate">
                        {detail.name}
                      </p>
                      {detail.description && (
                        <p className="text-sm text-slate-500 line-clamp-1">
                          {detail.description}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={(e) => toggleFavourite(detail.id, e)}
                        className={cn(
                          'p-2 rounded-full transition-colors',
                          isFavourite
                            ? 'text-red-500 bg-red-50 hover:bg-red-100'
                            : 'text-slate-400 hover:text-red-500 hover:bg-slate-100'
                        )}
                        aria-label={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
                      >
                        <Heart
                          className={cn('h-5 w-5', isFavourite && 'fill-current')}
                        />
                      </button>
                      <ChevronRight className="h-6 w-6 text-slate-400" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Quick Actions */}
      {!loading && !error && (
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button
            variant="outline"
            className="flex-1 min-h-[52px] text-base"
            onClick={handleChangeTask}
          >
            <RefreshCw className="mr-2 h-5 w-5" />
            Change Task
          </Button>
          <Link href="/search" className="flex-1">
            <Button variant="outline" className="w-full min-h-[52px] text-base">
              <Search className="mr-2 h-5 w-5" />
              Full Search
            </Button>
          </Link>
        </div>
      )}

      {/* Results Summary */}
      {!loading && !error && results.length > 0 && (
        <div className="mt-6 text-center text-sm text-slate-500">
          {filterBy !== 'all' ? (
            <span>
              Showing {displayResults.length} of {results.length} details
            </span>
          ) : (
            <span>
              {results.length} detail{results.length !== 1 ? 's' : ''} for{' '}
              {task?.name || 'all tasks'} on {substrate.name}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
