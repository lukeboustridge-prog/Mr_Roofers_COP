'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { Detail } from '@/types';

interface UseFavouritesReturn {
  favourites: Detail[];
  isLoading: boolean;
  error: string | null;
  addFavourite: (detailId: string) => Promise<void>;
  removeFavourite: (detailId: string) => Promise<void>;
  isFavourite: (detailId: string) => boolean;
  refetch: () => Promise<void>;
}

export function useFavourites(): UseFavouritesReturn {
  const [favourites, setFavourites] = useState<Detail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/favourites');
      if (!response.ok) throw new Error('Failed to fetch favourites');
      const data = await response.json();
      setFavourites(data.data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load favourites';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addFavourite = useCallback(async (detailId: string) => {
    try {
      const response = await fetch('/api/favourites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ detailId }),
      });
      if (!response.ok) throw new Error('Failed to add favourite');
      toast.success('Added to favourites');
      await refetch();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add favourite';
      setError(message);
      toast.error(message);
    }
  }, [refetch]);

  const removeFavourite = useCallback(async (detailId: string) => {
    try {
      const response = await fetch(`/api/favourites?detailId=${detailId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to remove favourite');
      toast.success('Removed from favourites');
      await refetch();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove favourite';
      setError(message);
      toast.error(message);
    }
  }, [refetch]);

  const isFavourite = useCallback((detailId: string) => {
    return favourites.some((fav) => fav.id === detailId);
  }, [favourites]);

  return {
    favourites,
    isLoading,
    error,
    addFavourite,
    removeFavourite,
    isFavourite,
    refetch,
  };
}
