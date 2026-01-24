'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clipboard, Wrench, Star, Clock, FileText, AlertTriangle, Calendar, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/stores/app-store';
import { useFavourites } from '@/hooks/useFavourites';
import { SUBSTRATES } from '@/lib/constants';

interface Stats {
  totalDetails: number;
  totalFailureCases: number;
  totalSubstrates: number;
  totalCategories: number;
}

interface HistoryDetail {
  id: string;
  code: string;
  name: string;
  substrateId: string | null;
  categoryId: string | null;
  viewedAt: string;
}

export default function DashboardPage() {
  const { mode, setMode } = useAppStore();
  const { favourites, refetch: refetchFavourites } = useFavourites();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentHistory, setRecentHistory] = useState<HistoryDetail[]>([]);
  const [loading, setLoading] = useState(true);

  const getSubstrateName = (substrateId: string | null) => {
    if (!substrateId) return 'Unknown';
    return SUBSTRATES.find((s) => s.id === substrateId)?.name || substrateId;
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, historyRes] = await Promise.all([
          fetch('/api/stats'),
          fetch('/api/history?limit=5'),
        ]);

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }

        if (historyRes.ok) {
          const historyData = await historyRes.json();
          setRecentHistory(historyData.data || []);
        }

        // Also fetch favourites
        await refetchFavourites();
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [refetchFavourites]);

  return (
    <div className="container max-w-6xl p-4 md:p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
          Welcome to Master Roofers COP
        </h1>
        <p className="mt-2 text-slate-600">
          Your digital guide to New Zealand roofing standards and best practices
        </p>
      </div>

      {/* Mode Selector Cards */}
      <div className="mb-8 grid gap-4 md:grid-cols-2">
        <Link href="/planner">
          <Card
            className={`cursor-pointer transition-all hover:shadow-lg ${
              mode === 'planner' ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setMode('planner')}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Clipboard className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Planner Mode</CardTitle>
                  <CardDescription>Office & Desktop Planning</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                Browse all substrates, categories, and details. Perfect for project planning,
                specifications, and comprehensive documentation review.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="secondary">Full Navigation</Badge>
                <Badge variant="secondary">3D Viewers</Badge>
                <Badge variant="secondary">Checklists</Badge>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/fixer">
          <Card
            className={`cursor-pointer transition-all hover:shadow-lg ${
              mode === 'fixer' ? 'ring-2 ring-secondary' : ''
            }`}
            onClick={() => setMode('fixer')}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10">
                  <Wrench className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Fixer Mode</CardTitle>
                  <CardDescription>On-Site Quick Lookup</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                Quick context-based lookup. Select your substrate and task to get
                relevant details fast. Optimized for mobile and outdoor use.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="secondary">Quick Access</Badge>
                <Badge variant="secondary">Mobile First</Badge>
                <Badge variant="secondary">High Contrast</Badge>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              {loading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <p className="text-2xl font-bold">{stats?.totalDetails || 0}</p>
              )}
              <p className="text-sm text-slate-500">Total Details</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              {loading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <p className="text-2xl font-bold">{stats?.totalFailureCases || 0}</p>
              )}
              <p className="text-sm text-slate-500">Failure Cases</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <Calendar className="h-5 w-5 text-green-600" />
            </div>
            <div>
              {loading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <p className="text-2xl font-bold">{stats?.totalSubstrates || 0}</p>
              )}
              <p className="text-sm text-slate-500">Substrates</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Search Bar */}
      <Card className="mb-8">
        <CardContent className="p-4">
          <Link href="/search" className="flex items-center gap-3 text-slate-500 hover:text-slate-700">
            <Search className="h-5 w-5" aria-hidden="true" />
            <span>Search details, codes, or standards...</span>
          </Link>
        </CardContent>
      </Card>

      {/* Recent and Favourites */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recently Viewed */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-slate-500" aria-hidden="true" />
              <CardTitle className="text-lg">Recently Viewed</CardTitle>
            </div>
            <Link
              href="/planner"
              className="text-sm text-primary hover:underline"
            >
              Browse all
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : recentHistory.length > 0 ? (
              <div className="space-y-3" role="list" aria-label="Recently viewed details">
                {recentHistory.map((detail) => (
                  <Link
                    key={`${detail.id}-${detail.viewedAt}`}
                    href={`/planner/${detail.substrateId}/${detail.categoryId}/${detail.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-slate-50 min-h-[60px]"
                    role="listitem"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Badge variant="outline" className="font-mono flex-shrink-0">
                        {detail.code}
                      </Badge>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate">{detail.name}</p>
                        <p className="text-sm text-slate-500">{getSubstrateName(detail.substrateId)}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Clock className="h-10 w-10 text-slate-200 mb-3" aria-hidden="true" />
                <p className="text-sm text-slate-500">
                  No recently viewed details
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Details you view will appear here
                </p>
                <Link href="/planner">
                  <Button variant="outline" className="mt-4 min-h-[44px]">
                    Browse Details
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Favourites */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500" aria-hidden="true" />
              <CardTitle className="text-lg">Favourites</CardTitle>
            </div>
            <Link
              href="/favourites"
              className="text-sm text-primary hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : favourites.length > 0 ? (
              <div className="space-y-3" role="list" aria-label="Favourite details">
                {favourites.slice(0, 5).map((detail) => (
                  <Link
                    key={detail.id}
                    href={`/planner/${detail.substrateId}/${detail.categoryId}/${detail.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-slate-50 min-h-[60px]"
                    role="listitem"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Badge variant="outline" className="font-mono flex-shrink-0">
                        {detail.code}
                      </Badge>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate">{detail.name}</p>
                        <p className="text-sm text-slate-500">{getSubstrateName(detail.substrateId)}</p>
                      </div>
                    </div>
                    <Star className="h-4 w-4 text-amber-500 fill-amber-500 flex-shrink-0" aria-hidden="true" />
                  </Link>
                ))}
                {favourites.length > 5 && (
                  <Link
                    href="/favourites"
                    className="block text-center text-sm text-primary hover:underline py-2"
                  >
                    View all {favourites.length} favourites
                  </Link>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Star className="h-10 w-10 text-slate-200 mb-3" aria-hidden="true" />
                <p className="text-sm text-slate-500">
                  No favourites yet
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Star details to save them for quick access
                </p>
                <Link href="/planner">
                  <Button variant="outline" className="mt-4 min-h-[44px]">
                    Browse Details
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
