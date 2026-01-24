'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Calendar, FileWarning, Filter, X } from 'lucide-react';
import { SUBSTRATES, FAILURE_OUTCOMES } from '@/lib/constants';

interface FailureCase {
  id: string;
  caseId: string;
  summary: string | null;
  failureType: string | null;
  outcome: string | null;
  decisionDate: Date | string | null;
  substrateTags: string[] | unknown;
  nzbcClauses: string[] | unknown;
}

const outcomeColors: Record<string, string> = {
  'upheld': 'bg-red-100 text-red-800 border-red-200',
  'partially-upheld': 'bg-amber-100 text-amber-800 border-amber-200',
  'dismissed': 'bg-green-100 text-green-800 border-green-200',
};

const failureTypeLabels: Record<string, string> = {
  'water-ingress': 'Water Ingress',
  'structural': 'Structural',
  'design-error': 'Design Error',
  'workmanship': 'Workmanship',
  'durability': 'Durability',
};

const FAILURE_TYPES = [
  { id: 'water-ingress', name: 'Water Ingress' },
  { id: 'structural', name: 'Structural' },
  { id: 'design-error', name: 'Design Error' },
  { id: 'workmanship', name: 'Workmanship' },
  { id: 'durability', name: 'Durability' },
];

export default function FailuresPage() {
  const [cases, setCases] = useState<FailureCase[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [outcomeFilter, setOutcomeFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [substrateFilter, setSubstrateFilter] = useState<string | null>(null);

  // Stats
  const [stats, setStats] = useState({
    upheld: 0,
    waterIngress: 0,
  });

  useEffect(() => {
    async function fetchCases() {
      setLoading(true);
      try {
        const response = await fetch('/api/failures');
        if (response.ok) {
          const data = await response.json();
          setCases(data.cases || []);
          setTotal(data.total || 0);

          // Calculate stats
          const allCases = data.cases || [];
          setStats({
            upheld: allCases.filter((f: FailureCase) => f.outcome === 'upheld').length,
            waterIngress: allCases.filter((f: FailureCase) => f.failureType === 'water-ingress').length,
          });
        }
      } catch (error) {
        console.error('Error fetching failure cases:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCases();
  }, []);

  // Filter cases
  const filteredCases = cases.filter((c) => {
    if (outcomeFilter && c.outcome !== outcomeFilter) return false;
    if (typeFilter && c.failureType !== typeFilter) return false;
    if (substrateFilter) {
      const tags = c.substrateTags as string[] | null;
      if (!tags || !tags.some((t) => t.toLowerCase().includes(substrateFilter.toLowerCase()))) {
        return false;
      }
    }
    return true;
  });

  const clearFilters = () => {
    setOutcomeFilter(null);
    setTypeFilter(null);
    setSubstrateFilter(null);
  };

  const hasActiveFilters = outcomeFilter || typeFilter || substrateFilter;

  return (
    <div className="container max-w-4xl p-4 md:p-6 lg:p-8 pb-24">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-red-500" />
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
            Failure Cases
          </h1>
        </div>
        <p className="mt-2 text-slate-600">
          Learn from real MBIE and LBP tribunal decisions
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 text-center">
            {loading ? (
              <Skeleton className="h-10 w-12 mx-auto" />
            ) : (
              <p className="text-3xl font-bold text-red-600">{total}</p>
            )}
            <p className="text-sm text-slate-500">Total Cases</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            {loading ? (
              <Skeleton className="h-10 w-12 mx-auto" />
            ) : (
              <p className="text-3xl font-bold text-amber-600">{stats.upheld}</p>
            )}
            <p className="text-sm text-slate-500">Upheld</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            {loading ? (
              <Skeleton className="h-10 w-12 mx-auto" />
            ) : (
              <p className="text-3xl font-bold text-blue-600">{stats.waterIngress}</p>
            )}
            <p className="text-sm text-slate-500">Water Ingress</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Toggle */}
      <div className="mb-4 flex items-center justify-between">
        <Button
          variant={showFilters ? 'secondary' : 'outline'}
          onClick={() => setShowFilters(!showFilters)}
          className="min-h-[44px]"
        >
          <Filter className="mr-2 h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <Badge className="ml-2 bg-primary text-white">Active</Badge>
          )}
        </Button>

        {hasActiveFilters && (
          <Button variant="ghost" onClick={clearFilters} className="text-sm">
            Clear all
            <X className="ml-1 h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="mb-6">
          <CardContent className="p-4 space-y-4">
            {/* Outcome Filter */}
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Outcome</p>
              <div className="flex flex-wrap gap-2">
                {FAILURE_OUTCOMES.map((outcome) => (
                  <button
                    key={outcome.id}
                    onClick={() => setOutcomeFilter(
                      outcomeFilter === outcome.id ? null : outcome.id
                    )}
                    className={`px-3 py-2 text-sm rounded-lg transition-colors min-h-[40px] ${
                      outcomeFilter === outcome.id
                        ? 'bg-primary text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {outcome.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Failure Type Filter */}
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Failure Type</p>
              <div className="flex flex-wrap gap-2">
                {FAILURE_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setTypeFilter(
                      typeFilter === type.id ? null : type.id
                    )}
                    className={`px-3 py-2 text-sm rounded-lg transition-colors min-h-[40px] ${
                      typeFilter === type.id
                        ? 'bg-primary text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {type.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Substrate Filter */}
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Substrate</p>
              <div className="flex flex-wrap gap-2">
                {SUBSTRATES.map((substrate) => (
                  <button
                    key={substrate.id}
                    onClick={() => setSubstrateFilter(
                      substrateFilter === substrate.id ? null : substrate.id
                    )}
                    className={`px-3 py-2 text-sm rounded-lg transition-colors min-h-[40px] ${
                      substrateFilter === substrate.id
                        ? 'bg-primary text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {substrate.name}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-500">Filtered by:</span>
          {outcomeFilter && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {FAILURE_OUTCOMES.find((o) => o.id === outcomeFilter)?.name}
              <button onClick={() => setOutcomeFilter(null)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {typeFilter && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {failureTypeLabels[typeFilter]}
              <button onClick={() => setTypeFilter(null)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {substrateFilter && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {SUBSTRATES.find((s) => s.id === substrateFilter)?.name}
              <button onClick={() => setSubstrateFilter(null)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Results Count */}
      {!loading && (
        <p className="mb-4 text-sm text-slate-500">
          Showing {filteredCases.length} of {total} cases
        </p>
      )}

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      )}

      {/* Cases List */}
      {!loading && filteredCases.length > 0 ? (
        <div className="space-y-4">
          {filteredCases.map((failureCase) => (
            <Link key={failureCase.id} href={`/failures/${failureCase.id}`}>
              <Card className="cursor-pointer transition-all hover:shadow-md hover:border-red-200 active:scale-[0.99] touch-manipulation">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <FileWarning className="h-5 w-5 text-red-500" />
                      <Badge variant="outline" className="font-mono">
                        {failureCase.caseId}
                      </Badge>
                    </div>
                    {failureCase.outcome && (
                      <Badge className={outcomeColors[failureCase.outcome] || 'bg-slate-100'}>
                        {failureCase.outcome.replace('-', ' ')}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="font-medium text-slate-900 mb-3">
                    {failureCase.summary}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    {failureCase.decisionDate && (
                      <>
                        <div className="flex items-center gap-1 text-slate-500">
                          <Calendar className="h-4 w-4" />
                          {new Date(failureCase.decisionDate).toLocaleDateString('en-NZ', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                        <span className="text-slate-300">|</span>
                      </>
                    )}
                    {failureCase.failureType && (
                      <Badge variant="secondary">
                        {failureTypeLabels[failureCase.failureType] || failureCase.failureType}
                      </Badge>
                    )}
                    {(failureCase.substrateTags as string[] | null)?.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : !loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileWarning className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-4 text-slate-500">
              {hasActiveFilters ? 'No cases match your filters' : 'No failure cases found'}
            </p>
            <p className="text-sm text-slate-400">
              {hasActiveFilters
                ? 'Try adjusting your filter criteria'
                : 'Run the seed script to add sample data'}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters} className="mt-4">
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
