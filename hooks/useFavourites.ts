'use client';

import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import type { Detail } from '@/types';

interface UseFavouritesReturn {
  favourites: Detail[];
  isLoading: boolean;
  error: string | null;
  addFavourite: (detailId: string, detail?: Detail) => Promise<void>;
  removeFavourite: (detailId: string) => Promise<void>;
  toggleFavourite: (detailId: string, detail?: Detail) => Promise<void>;
  isFavourite: (detailId: string) => boolean;
  refetch: () => Promise<void>;
}

export function useFavourites(): UseFavouritesReturn {
  const [favourites, setFavourites] = useState<Detail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track pending operations for optimistic UI
  const pendingOpsRef = useRef<Set<string>>(new Set());

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

  const addFavourite = useCallback(async (detailId: string, detail?: Detail) => {
    // Prevent duplicate operations
    if (pendingOpsRef.current.has(`add-${detailId}`)) return;
    pendingOpsRef.current.add(`add-${detailId}`);

    // Optimistic update - add placeholder or provided detail
    const optimisticDetail = detail || { id: detailId, code: '', name: '' } as Detail;
    setFavourites((prev) => {
      if (prev.some(f => f.id === detailId)) return prev;
      return [...prev, optimisticDetail];
    });

    try {
      const response = await fetch('/api/favourites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ detailId }),
      });

      if (!response.ok) {
        throw new Error('Failed to add favourite');
      }

      toast.success('Added to favourites');
      // Refetch to get full detail data if we used placeholder
      if (!detail) {
        await refetch();
      }
    } catch (err) {
      // Rollback optimistic update
      setFavourites((prev) => prev.filter((f) => f.id !== detailId));

      const message = err instanceof Error ? err.message : 'Failed to add favourite';
      setError(message);
      toast.error(message);
    } finally {
      pendingOpsRef.current.delete(`add-${detailId}`);
    }
  }, [refetch]);

  const removeFavourite = useCallback(async (detailId: string) => {
    // Prevent duplicate operations
    if (pendingOpsRef.current.has(`remove-${detailId}`)) return;
    pendingOpsRef.current.add(`remove-${detailId}`);

    // Store current state for rollback
    const previousFavourites = [...favourites];

    // Optimistic update - remove immediately
    setFavourites((prev) => prev.filter((f) => f.id !== detailId));

    try {
      const response = await fetch(`/api/favourites?detailId=${detailId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove favourite');
      }

      toast.success('Removed from favourites');
    } catch (err) {
      // Rollback optimistic update
      setFavourites(previousFavourites);

      const message = err instanceof Error ? err.message : 'Failed to remove favourite';
      setError(message);
      toast.error(message);
    } finally {
      pendingOpsRef.current.delete(`remove-${detailId}`);
    }
  }, [favourites]);

  const toggleFavourite = useCallback(async (detailId: string, detail?: Detail) => {
    const isFav = favourites.some((f) => f.id === detailId);
    if (isFav) {
      await removeFavourite(detailId);
    } else {
      await addFavourite(detailId, detail);
    }
  }, [favourites, addFavourite, removeFavourite]);

  const isFavourite = useCallback((detailId: string) => {
    return favourites.some((fav) => fav.id === detailId);
  }, [favourites]);

  return {
    favourites,
    isLoading,
    error,
    addFavourite,
    removeFavourite,
    toggleFavourite,
    isFavourite,
    refetch,
  };
}
