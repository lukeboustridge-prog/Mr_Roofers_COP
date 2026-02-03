'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { SearchBar } from '@/components/search/SearchBar';
import { VoiceSearch } from '@/components/search/VoiceSearch';
import { GroupedSearchResults } from '@/components/search/GroupedSearchResults';
import { ConsentModeToggle } from '@/components/search/ConsentModeToggle';
import {
  Search,
  Filter,
  AlertTriangle,
  X,
  ExternalLink,
  Zap,
} from 'lucide-react';
import { SUBSTRATES } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  code: string;
  name: string;
  description: string | null;
  substrateId: string | null;
  categoryId: string | null;
  sourceId: string | null;
  type: 'detail' | 'failure';
  warningCount: number;
  failureCount: number;
  isExactMatch?: boolean;
  relevanceScore?: number;
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(urlQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [substrateFilter, setSubstrateFilter] = useState<string | null>(null);
  const [hasWarningsFilter, setHasWarningsFilter] = useState(false);
  const [hasFailuresFilter, setHasFailuresFilter] = useState(false);
  const [exactMatch, setExactMatch] = useState<SearchResult | null>(null);

  // Search when URL query changes
  useEffect(() => {
    if (urlQuery !== query) {
      setQuery(urlQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlQuery]);

  // Fetch search results
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setTotal(0);
      setExactMatch(null);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({ q: searchQuery });
      if (substrateFilter) {
        params.append('substrate', substrateFilter);
      }
      if (hasWarningsFilter) {
        params.append('hasWarnings', 'true');
      }
      if (hasFailuresFilter) {
        params.append('hasFailures', 'true');
      }
      // Add consent mode to API call
      const consentMode = searchParams.get('consentMode') === 'true';
      if (consentMode) {
        params.append('consentMode', 'true');
      }

      const response = await fetch(`/api/search?${params}`);
      if (response.ok) {
        const data = await response.json();

        // Check for section redirect (section number search)
        if (data.redirect) {
          router.push(data.redirect);
          return;
        }

        setResults(data.results || []);
        setTotal(data.total || 0);

        // Check for exact code match
        const exact = data.results?.find((r: SearchResult) => r.isExactMatch);
        setExactMatch(exact || null);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, [substrateFilter, hasWarningsFilter, hasFailuresFilter, searchParams, router]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  const handleSearch = useCallback((newQuery: string) => {
    setQuery(newQuery);
    router.push(`/search?q=${encodeURIComponent(newQuery)}`, { scroll: false });
  }, [router]);

  const handleVoiceResult = useCallback((transcript: string) => {
    handleSearch(transcript);
  }, [handleSearch]);

  const handleClearFilters = () => {
    setSubstrateFilter(null);
    setHasWarningsFilter(false);
    setHasFailuresFilter(false);
  };

  const hasActiveFilters = substrateFilter || hasWarningsFilter || hasFailuresFilter;

  const getSubstrateName = (id: string | null) => {
    if (!id) return 'Unknown';
    return SUBSTRATES.find((s) => s.id === id)?.name || id;
  };

  return (
    <div className="container max-w-4xl p-4 md:p-6 lg:p-8 pb-24">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
          Search
        </h1>
        <p className="mt-2 text-slate-600">
          Search details, failure cases, and standard references
        </p>
      </div>

      {/* Search Input */}
      <div className="mb-6">
        <div className="flex gap-2">
          <div className="flex-1">
            <SearchBar
              defaultValue={query}
              onSearch={handleSearch}
              autoFocus
              placeholder="Search by name, code (e.g., F07), or standard..."
            />
          </div>
          <Button
            variant={showFilters ? 'secondary' : 'outline'}
            className="min-h-[48px] min-w-[48px]"
            onClick={() => setShowFilters(!showFilters)}
            aria-expanded={showFilters}
            aria-controls="search-filters"
            aria-label="Toggle search filters"
          >
            <Filter className="h-5 w-5" aria-hidden="true" />
            {hasActiveFilters && (
              <span className="sr-only">Filters active</span>
            )}
          </Button>
          <VoiceSearch
            onResult={handleVoiceResult}
            onError={(err) => console.error(err)}
          />
        </div>

        {/* Consent Mode Toggle */}
        <div className="mt-4">
          <ConsentModeToggle />
        </div>

        {/* Filters */}
        {showFilters && (
          <Card className="mt-4" id="search-filters">
            <CardContent className="p-4 space-y-4">
              {/* Substrate Filter */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-slate-700">
                    Filter by Substrate
                  </span>
                  {hasActiveFilters && (
                    <button
                      onClick={handleClearFilters}
                      className="text-xs text-primary hover:underline"
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Substrate filters">
                  {SUBSTRATES.map((substrate) => (
                    <button
                      key={substrate.id}
                      onClick={() => setSubstrateFilter(
                        substrateFilter === substrate.id ? null : substrate.id
                      )}
                      className={cn(
                        'px-3 py-2 text-sm rounded-lg transition-colors min-h-[44px]',
                        substrateFilter === substrate.id
                          ? 'bg-primary text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      )}
                      aria-pressed={substrateFilter === substrate.id}
                    >
                      {substrate.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Additional Filters */}
              <div className="border-t pt-4">
                <span className="text-sm font-medium text-slate-700 block mb-3">
                  Additional Filters
                </span>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
                    <Checkbox
                      checked={hasWarningsFilter}
                      onCheckedChange={(checked) => setHasWarningsFilter(checked === true)}
                      id="has-warnings"
                    />
                    <span className="text-sm text-slate-700">Has warnings</span>
                    <AlertTriangle className="h-4 w-4 text-amber-500" aria-hidden="true" />
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
                    <Checkbox
                      checked={hasFailuresFilter}
                      onCheckedChange={(checked) => setHasFailuresFilter(checked === true)}
                      id="has-failures"
                    />
                    <span className="text-sm text-slate-700">Has failure cases</span>
                    <Badge className="bg-red-100 text-red-700 text-xs">!</Badge>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="mb-4 flex items-center gap-2 flex-wrap" role="status" aria-live="polite">
          <span className="text-sm text-slate-500">Filtered by:</span>
          {substrateFilter && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {getSubstrateName(substrateFilter)}
              <button
                onClick={() => setSubstrateFilter(null)}
                className="ml-1"
                aria-label={`Remove ${getSubstrateName(substrateFilter)} filter`}
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </Badge>
          )}
          {hasWarningsFilter && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Has warnings
              <button
                onClick={() => setHasWarningsFilter(false)}
                className="ml-1"
                aria-label="Remove warnings filter"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </Badge>
          )}
          {hasFailuresFilter && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Has failures
              <button
                onClick={() => setHasFailuresFilter(false)}
                className="ml-1"
                aria-label="Remove failures filter"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Exact Code Match - Quick Jump */}
      {exactMatch && !loading && (
        <Link href={exactMatch.type === 'failure' ? `/failures/${exactMatch.id}` : `/planner/${exactMatch.substrateId}/${exactMatch.categoryId}/${exactMatch.id}`}>
          <Card className="mb-4 border-primary bg-primary/5 cursor-pointer hover:shadow-md transition-all">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20 flex-shrink-0">
                <Zap className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary text-white font-mono">
                    {exactMatch.code}
                  </Badge>
                  <span className="text-sm font-medium text-primary">
                    Exact match found - Click to go directly
                  </span>
                </div>
                <p className="text-sm text-slate-700 truncate mt-1">
                  {exactMatch.name}
                </p>
              </div>
              <ExternalLink className="h-5 w-5 text-primary flex-shrink-0" aria-hidden="true" />
            </CardContent>
          </Card>
        </Link>
      )}

      {/* Loading State */}
      {loading && (
        <div className="space-y-3" aria-busy="true" aria-label="Loading search results">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      )}

      {/* Results */}
      {!loading && query ? (
        <div>
          <p className="mb-4 text-sm text-slate-500" role="status" aria-live="polite">
            {total} result{total !== 1 ? 's' : ''} for &quot;{query}&quot;
          </p>

          {results.length > 0 ? (
            <GroupedSearchResults
              results={results}
              consentMode={searchParams.get('consentMode') === 'true'}
            />
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Search className="mx-auto h-12 w-12 text-slate-300" aria-hidden="true" />
                <p className="mt-4 text-slate-500">No results found</p>
                <p className="text-sm text-slate-400">
                  Try a different search term or clear filters
                </p>
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={handleClearFilters}
                  >
                    Clear Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      ) : !loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <Search className="mx-auto h-12 w-12 text-slate-300" aria-hidden="true" />
            <p className="mt-4 text-slate-500">Start typing to search</p>
            <p className="text-sm text-slate-400">
              Search by detail name, code (e.g., F07), or standard reference
            </p>
            <div className="mt-4 text-xs text-slate-400">
              <p>Tip: Type a detail code like &quot;F07&quot; to jump directly to it</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
