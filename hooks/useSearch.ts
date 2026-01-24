'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { Detail, SearchResult } from '@/types';

interface UseSearchReturn {
  results: Detail[];
  totalCount: number;
  isSearching: boolean;
  error: string | null;
  search: (query: string, filters?: SearchFilters) => Promise<void>;
  clearResults: () => void;
}

interface SearchFilters {
  substrate?: string;
  category?: string;
  page?: number;
  pageSize?: number;
}

export function useSearch(): UseSearchReturn {
  const [results, setResults] = useState<Detail[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string, filters?: SearchFilters) => {
    if (!query.trim()) {
      setResults([]);
      setTotalCount(0);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const params = new URLSearchParams({ q: query });
      if (filters?.substrate) params.set('substrate', filters.substrate);
      if (filters?.category) params.set('category', filters.category);
      if (filters?.page) params.set('page', String(filters.page));
      if (filters?.pageSize) params.set('pageSize', String(filters.pageSize));

      const response = await fetch(`/api/search?${params}`);
      if (!response.ok) throw new Error('Search failed');

      const data: SearchResult = await response.json();
      setResults(data.details);
      setTotalCount(data.totalCount);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Search failed';
      setError(message);
      toast.error(message);
      setResults([]);
      setTotalCount(0);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setTotalCount(0);
    setError(null);
  }, []);

  return {
    results,
    totalCount,
    isSearching,
    error,
    search,
    clearResults,
  };
}
