'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import { Loader2 } from 'lucide-react';

interface SearchResult {
  sectionNumber: string;
  title: string;
  chapterNumber: number;
  chapterTitle: string;
  level: number;
  url: string;
  snippet: string;
}

/** Static chapter titles — these do not change between builds */
const CHAPTER_TITLES: { chapterNumber: number; title: string }[] = [
  { chapterNumber: 1, title: 'Introduction' },
  { chapterNumber: 2, title: 'Glossary' },
  { chapterNumber: 3, title: 'Structure' },
  { chapterNumber: 4, title: 'Durability' },
  { chapterNumber: 5, title: 'Roof Drainage' },
  { chapterNumber: 6, title: 'External Moisture Overview' },
  { chapterNumber: 7, title: 'External Moisture Roofing' },
  { chapterNumber: 8, title: 'External Moisture Flashings' },
  { chapterNumber: 9, title: 'External Moisture Penetrations' },
  { chapterNumber: 10, title: 'Internal Moisture' },
  { chapterNumber: 11, title: 'Natural Light' },
  { chapterNumber: 12, title: 'Fitness For Purpose' },
  { chapterNumber: 13, title: 'Safety' },
  { chapterNumber: 14, title: 'Installation' },
  { chapterNumber: 15, title: 'Other Products' },
  { chapterNumber: 16, title: 'Maintenance' },
  { chapterNumber: 17, title: 'Testing and MRM Standards' },
  { chapterNumber: 18, title: 'Useful Information' },
  { chapterNumber: 19, title: 'Revision History' },
];

export interface CommandPaletteProps {
  /** Optional: preloaded chapter titles for quick-jump when palette is empty */
  chapters?: { chapterNumber: number; title: string }[];
}

/**
 * Global command palette for fast COP section navigation.
 *
 * Opens on Cmd+K (Mac) / Ctrl+K (Windows).
 * Searches COP sections via the /api/encyclopedia/search endpoint.
 * Groups results by chapter. Shows quick-jump chapter list when empty.
 */
export function CommandPalette({ chapters }: CommandPaletteProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const chapterList = chapters ?? CHAPTER_TITLES;

  // Global Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
      setIsLoading(false);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    }
  }, [open]);

  // Debounced search on query change
  const handleSearch = useCallback((value: string) => {
    setQuery(value);

    // Cancel previous request
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();

    if (value.trim().length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch(
          `/api/encyclopedia/search?q=${encodeURIComponent(value.trim())}&limit=20`,
          { signal: controller.signal }
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
        }
      } catch {
        // Aborted or network error — ignore
      } finally {
        setIsLoading(false);
      }
    }, 200);
  }, []);

  // Navigate to a URL and close the palette
  const handleSelect = useCallback(
    (url: string) => {
      setOpen(false);
      router.push(url);
    },
    [router]
  );

  // Group results by chapter number
  const groupedResults = results.reduce<Record<number, SearchResult[]>>(
    (acc, result) => {
      if (!acc[result.chapterNumber]) {
        acc[result.chapterNumber] = [];
      }
      acc[result.chapterNumber].push(result);
      return acc;
    },
    {}
  );

  const hasQuery = query.trim().length >= 2;
  const hasResults = results.length > 0;

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search COP sections by number or keyword..."
        value={query}
        onValueChange={handleSearch}
      />
      <CommandList>
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
          </div>
        )}

        {/* No results message */}
        {hasQuery && !hasResults && !isLoading && (
          <CommandEmpty>No sections found for &ldquo;{query}&rdquo;</CommandEmpty>
        )}

        {/* Search results grouped by chapter */}
        {hasQuery && hasResults && !isLoading && (
          <>
            {Object.entries(groupedResults)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([chapterNum, chapterResults]) => (
                <CommandGroup
                  key={chapterNum}
                  heading={`Chapter ${chapterNum}: ${chapterResults[0].chapterTitle}`}
                >
                  {chapterResults.map((result) => (
                    <CommandItem
                      key={result.sectionNumber}
                      value={`${result.sectionNumber} ${result.title}`}
                      onSelect={() => handleSelect(result.url)}
                      className="flex flex-col items-start gap-1 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-600">
                          {result.sectionNumber}
                        </span>
                        <span className="text-sm font-medium">{result.title}</span>
                      </div>
                      {result.snippet && (
                        <p className="line-clamp-1 pl-[calc(theme(spacing.1.5)*2+theme(spacing.2))] text-xs text-muted-foreground">
                          {result.snippet}
                        </p>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
          </>
        )}

        {/* Quick-jump chapters (empty state) */}
        {!hasQuery && !isLoading && (
          <CommandGroup heading="Quick Jump">
            {chapterList.map((ch) => (
              <CommandItem
                key={ch.chapterNumber}
                value={`Chapter ${ch.chapterNumber}: ${ch.title}`}
                onSelect={() =>
                  handleSelect(`/encyclopedia/cop/${ch.chapterNumber}`)
                }
              >
                <span className="mr-2 shrink-0 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-600">
                  Ch {ch.chapterNumber}
                </span>
                <span className="text-sm">{ch.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
