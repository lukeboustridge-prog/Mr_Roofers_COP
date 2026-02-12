'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2 } from 'lucide-react';

interface SearchResult {
  sectionNumber: string;
  title: string;
  chapterNumber: number;
  chapterTitle: string;
  level: number;
  url: string;
  snippet: string;
}

export default function EncyclopediaSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced fetch
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/encyclopedia/search?q=${encodeURIComponent(query.trim())}`,
          { signal: controller.signal }
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
          setIsOpen(true);
        }
      } catch {
        // Aborted or network error — ignore
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timeout);
      controller.abort();
      setIsLoading(false);
    };
  }, [query]);

  const handleSelect = useCallback(
    (url: string) => {
      setIsOpen(false);
      setQuery('');
      router.push(url);
    },
    [router]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
        return;
      }

      if (!isOpen || results.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
      } else if (e.key === 'Enter' && activeIndex >= 0) {
        e.preventDefault();
        handleSelect(results[activeIndex].url);
      }
    },
    [isOpen, results, activeIndex, handleSelect]
  );

  const handleBlur = useCallback(() => {
    // Delay to allow click events on dropdown items to fire first
    blurTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  }, []);

  const handleFocus = useCallback(() => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
    }
    if (results.length > 0 && query.trim().length >= 2) {
      setIsOpen(true);
    }
  }, [results.length, query]);

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(-1);
  }, [results]);

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && dropdownRef.current) {
      const items = dropdownRef.current.querySelectorAll('[data-result-item]');
      items[activeIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  return (
    <div className="relative w-full">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder="Search COP sections..."
          className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-20 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          autoComplete="off"
        />
        {/* Loading spinner */}
        {isLoading && (
          <Loader2 className="absolute right-14 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
        )}
        {/* Cmd+K hint */}
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
          Cmd+K
        </kbd>
      </div>

      {/* Results Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[400px] overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg"
          role="listbox"
        >
          {results.length === 0 && !isLoading ? (
            <div className="px-4 py-6 text-center text-sm text-slate-500">
              No results found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            results.map((result, index) => (
              <button
                key={`${result.sectionNumber}-${index}`}
                data-result-item
                role="option"
                aria-selected={index === activeIndex}
                className={`w-full cursor-pointer border-b border-slate-100 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-slate-50 ${
                  index === activeIndex ? 'bg-slate-50' : ''
                }`}
                onMouseDown={(e) => {
                  e.preventDefault(); // Prevent blur from firing
                  handleSelect(result.url);
                }}
                onMouseEnter={() => setActiveIndex(index)}
              >
                <div className="flex items-start gap-3">
                  {/* Section number */}
                  <span className="mt-0.5 shrink-0 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-500">
                    {result.sectionNumber}
                  </span>
                  <div className="min-w-0 flex-1">
                    {/* Title */}
                    <p className="truncate font-medium text-slate-900">
                      {result.title}
                    </p>
                    {/* Chapter context */}
                    <span className="mt-0.5 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                      Chapter {result.chapterNumber}: {result.chapterTitle}
                    </span>
                    {/* Snippet */}
                    {result.snippet && (
                      <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                        {result.snippet}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
