'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useFavourites } from '@/hooks/useFavourites';
import { SUBSTRATES } from '@/lib/constants';
import { Star, FileText, Trash2 } from 'lucide-react';

export default function FavouritesPage() {
  const { favourites, isLoading, removeFavourite, refetch } = useFavourites();

  useEffect(() => {
    refetch();
  }, [refetch]);

  const getSubstrateName = (substrateId: string | null) => {
    if (!substrateId) return 'Unknown';
    return SUBSTRATES.find((s) => s.id === substrateId)?.name || substrateId;
  };

  const handleRemove = async (detailId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await removeFavourite(detailId);
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl p-4 md:p-6 lg:p-8">
        <div className="mb-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-5 w-64" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl p-4 md:p-6 lg:p-8 pb-24">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <Star className="h-6 w-6 text-amber-500" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
            Favourites
          </h1>
        </div>
        <p className="mt-2 text-slate-600">
          Your saved details for quick access ({favourites.length} saved)
        </p>
      </div>

      {/* Favourites List */}
      {favourites.length > 0 ? (
        <div className="space-y-3" role="list" aria-label="Favourite details">
          {favourites.map((favourite) => (
            <Card
              key={favourite.id}
              className="transition-all hover:shadow-md focus-within:ring-2 focus-within:ring-primary"
              role="listitem"
            >
              <CardContent className="flex items-center justify-between p-4">
                <Link
                  href={`/planner/${favourite.substrateId}/${favourite.categoryId}/${favourite.id}`}
                  className="flex flex-1 items-center gap-4 min-h-[48px]"
                  aria-label={`View ${favourite.code} - ${favourite.name}`}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 flex-shrink-0">
                    <FileText className="h-6 w-6 text-slate-600" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="font-mono">
                        {favourite.code}
                      </Badge>
                      <span className="font-medium text-slate-900 truncate">
                        {favourite.name}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">
                      {getSubstrateName(favourite.substrateId)}
                    </p>
                  </div>
                </Link>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-slate-400 hover:text-red-500 min-h-[48px] min-w-[48px]"
                    onClick={(e) => handleRemove(favourite.id, e)}
                    aria-label={`Remove ${favourite.code} from favourites`}
                  >
                    <Trash2 className="h-5 w-5" aria-hidden="true" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Star className="mx-auto h-12 w-12 text-slate-300" aria-hidden="true" />
            <p className="mt-4 text-slate-500">No favourites yet</p>
            <p className="text-sm text-slate-400">
              Star details to add them here for quick access
            </p>
            <Link href="/planner">
              <Button variant="outline" className="mt-4 min-h-[48px]">
                Browse Details
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
