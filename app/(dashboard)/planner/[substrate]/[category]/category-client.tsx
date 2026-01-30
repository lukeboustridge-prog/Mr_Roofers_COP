'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertTriangle,
  FileText,
  ChevronRight,
  Heart,
  ArrowUpDown,
  Filter,
  X,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DetailItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  thumbnailUrl: string | null;
  warningCount: number;
  failureCount: number;
}

interface CategoryDetailsClientProps {
  details: DetailItem[];
  substrateId: string;
  categoryId: string;
  substrateName: string;
  categoryName: string;
}

type SortOption = 'code' | 'name' | 'warnings' | 'failures';
type FilterOption = 'all' | 'warnings' | 'failures' | 'clean';

export function CategoryDetailsClient({
  details,
  substrateId,
  categoryId,
  substrateName,
  categoryName,
}: CategoryDetailsClientProps) {
  const [favourites, setFavourites] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<SortOption>('code');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');

  // Fetch user's favourites on mount
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
  const displayDetails = useMemo(() => {
    let filtered = [...details];

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
  }, [details, sortBy, filterBy]);

  const clearFilter = () => setFilterBy('all');
  const filterCount = filterBy !== 'all' ? displayDetails.length : null;

  // Empty state
  if (details.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <FileText className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-4 font-medium text-slate-700">No details found</h3>
          <p className="mt-1 text-sm text-slate-500">
            Details for {categoryName} will be added in a future update.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href={`/planner/${substrateId}`}>
              <Button variant="outline">
                Back to {substrateName}
              </Button>
            </Link>
            <Link href="/search">
              <Button>
                <Search className="mr-2 h-4 w-4" />
                Search All
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      {/* Sort and Filter Controls */}
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
              Most Case Law
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
              Show All ({details.length})
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterBy('warnings')}>
              <AlertTriangle className="mr-2 h-4 w-4 text-amber-500" />
              Has Warnings ({details.filter((d) => d.warningCount > 0).length})
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterBy('failures')}>
              <AlertTriangle className="mr-2 h-4 w-4 text-red-500" />
              Has Case Law ({details.filter((d) => d.failureCount > 0).length})
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterBy('clean')}>
              No Issues ({details.filter((d) => d.warningCount === 0 && d.failureCount === 0).length})
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

        {/* Results count */}
        <span className="text-sm text-slate-500 ml-auto">
          {displayDetails.length} of {details.length} details
        </span>
      </div>

      {/* Filtered Empty State */}
      {displayDetails.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Filter className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-4 font-medium text-slate-700">
              No details match your filter
            </p>
            <p className="text-sm text-slate-500 mb-4">
              {filterBy === 'warnings' && 'No details have warnings in this category'}
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

      {/* Details List */}
      {displayDetails.length > 0 && (
        <div className="space-y-3">
          {displayDetails.map((detail) => {
            const isFavourite = favourites.has(detail.id);

            return (
              <Link
                key={detail.id}
                href={`/planner/${substrateId}/${categoryId}/${detail.id}`}
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

      {/* Summary */}
      {displayDetails.length > 0 && (
        <div className="mt-6 text-center text-sm text-slate-500">
          {filterBy !== 'all' ? (
            <span>
              Showing {displayDetails.length} of {details.length} details
            </span>
          ) : (
            <span>
              {details.length} detail{details.length !== 1 ? 's' : ''} in {categoryName}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
