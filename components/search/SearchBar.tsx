'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { VoiceSearchInline } from './VoiceSearch';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
  onSearch?: (query: string) => void;
  defaultValue?: string;
}

export function SearchBar({
  className,
  placeholder = 'Search details, codes, standards...',
  autoFocus = false,
  onSearch,
  defaultValue = '',
}: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultValue);

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      if (query.trim()) {
        if (onSearch) {
          onSearch(query.trim());
        } else {
          router.push(`/search?q=${encodeURIComponent(query.trim())}`);
        }
      }
    },
    [query, onSearch, router]
  );

  const handleVoiceResult = useCallback(
    (transcript: string) => {
      setQuery(transcript);
      if (onSearch) {
        onSearch(transcript);
      } else {
        router.push(`/search?q=${encodeURIComponent(transcript)}`);
      }
    },
    [onSearch, router]
  );

  const handleClear = useCallback(() => {
    setQuery('');
  }, []);

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('relative', className)}
      role="search"
      aria-label="Search details"
    >
      <div className="relative flex items-center">
        <Search
          className="absolute left-3 h-5 w-5 text-slate-400 pointer-events-none"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="pl-10 pr-20 h-12 text-base rounded-xl border-slate-200 focus:border-primary focus:ring-primary"
          aria-label="Search query"
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
        />
        <div className="absolute right-2 flex items-center gap-1">
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 min-h-[32px] min-w-[32px] flex items-center justify-center"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
          <VoiceSearchInline
            onResult={handleVoiceResult}
            onError={(err) => toast.error(err)}
          />
        </div>
      </div>
    </form>
  );
}

// Compact version for header
export function SearchBarCompact({ className }: { className?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (query.trim()) {
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      }
    },
    [query, router]
  );

  const handleVoiceResult = useCallback(
    (transcript: string) => {
      setQuery(transcript);
      router.push(`/search?q=${encodeURIComponent(transcript)}`);
    },
    [router]
  );

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('relative', className)}
      role="search"
      aria-label="Quick search"
    >
      <div className="relative flex items-center">
        <Search
          className="absolute left-3 h-4 w-4 text-slate-400 pointer-events-none"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Search..."
          className={cn(
            'pl-9 pr-10 h-10 text-sm rounded-lg border-slate-200 transition-all',
            isFocused ? 'w-64' : 'w-48'
          )}
          aria-label="Search query"
          autoComplete="off"
        />
        <div className="absolute right-1">
          <VoiceSearchInline
            onResult={handleVoiceResult}
            onError={(err) => toast.error(err)}
            className="h-8 w-8"
          />
        </div>
      </div>
    </form>
  );
}
