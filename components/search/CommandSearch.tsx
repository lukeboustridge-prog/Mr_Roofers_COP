'use client';

import { useEffect, useState, useCallback, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Search,
  Home,
  Layers,
  Wrench,
  AlertTriangle,
  Settings,
  Star,
} from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Quick navigation items
const quickActions = [
  { label: 'Home', href: '/', icon: Home, keywords: ['dashboard', 'main'] },
  { label: 'Planner', href: '/planner', icon: Layers, keywords: ['browse', 'substrates'] },
  { label: 'Fixer', href: '/fixer', icon: Wrench, keywords: ['quick', 'lookup', 'mobile'] },
  { label: 'Failures', href: '/failures', icon: AlertTriangle, keywords: ['cases', 'lbp', 'mbie'] },
  { label: 'Favourites', href: '/favourites', icon: Star, keywords: ['saved', 'bookmarks'] },
  { label: 'Settings', href: '/settings', icon: Settings, keywords: ['preferences', 'profile'] },
];

// Substrate options for quick access
const substrates = [
  { id: 'long-run-metal', name: 'Long Run Metal', href: '/planner/long-run-metal' },
  { id: 'profiled-metal', name: 'Profiled Metal', href: '/planner/profiled-metal' },
  { id: 'pressed-metal', name: 'Pressed Metal Tile', href: '/planner/pressed-metal' },
  { id: 'concrete-tile', name: 'Concrete Tile', href: '/planner/concrete-tile' },
  { id: 'membrane', name: 'Membrane', href: '/planner/membrane' },
  { id: 'shingle', name: 'Asphalt Shingle', href: '/planner/shingle' },
];

interface SearchResult {
  id: string;
  code: string;
  name: string;
  substrate?: { name: string } | null;
  category?: { name: string } | null;
}

interface CommandSearchProps {
  className?: string;
}

// Context for controlling command search from anywhere
interface CommandSearchContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const CommandSearchContext = createContext<CommandSearchContextValue | null>(null);

export function useCommandSearch() {
  const context = useContext(CommandSearchContext);
  if (!context) {
    throw new Error('useCommandSearch must be used within CommandSearchProvider');
  }
  return context;
}

export function CommandSearch({ className }: CommandSearchProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Handle keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || e.key === '/') {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Listen for custom open event (for mobile trigger)
  useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener('open-command-search', handleOpen);
    return () => window.removeEventListener('open-command-search', handleOpen);
  }, []);

  // Search for details when query changes
  const searchDetails = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/details?q=${encodeURIComponent(searchQuery)}&limit=5`);
      if (response.ok) {
        const data = await response.json();
        setResults(data.details || []);
      }
    } catch {
      // Silently fail - results will just be empty
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchDetails(query);
    }, 200);

    return () => clearTimeout(timer);
  }, [query, searchDetails]);

  const handleSelect = useCallback((href: string) => {
    setOpen(false);
    setQuery('');
    router.push(href);
  }, [router]);

  const handleSearchSubmit = useCallback(() => {
    if (query.trim()) {
      setOpen(false);
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setQuery('');
    }
  }, [query, router]);

  return (
    <>
      {/* Trigger button for header */}
      <Button
        variant="outline"
        className={cn(
          'relative h-10 justify-start text-sm text-muted-foreground sm:w-64 md:w-80',
          className
        )}
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span className="hidden lg:inline-flex">Search details, codes...</span>
        <span className="inline-flex lg:hidden">Search...</span>
        <kbd className="pointer-events-none absolute right-2 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      {/* Command palette dialog */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search details, navigate..."
          value={query}
          onValueChange={setQuery}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && query.trim()) {
              handleSearchSubmit();
            }
          }}
        />
        <CommandList>
          <CommandEmpty>
            {isSearching ? (
              'Searching...'
            ) : query.length > 0 ? (
              <div className="py-4 text-center">
                <p className="text-sm text-muted-foreground">No results found.</p>
                <Button
                  variant="link"
                  size="sm"
                  onClick={handleSearchSubmit}
                  className="mt-2"
                >
                  Search for &quot;{query}&quot; →
                </Button>
              </div>
            ) : (
              'Type to search...'
            )}
          </CommandEmpty>

          {/* Search results */}
          {results.length > 0 && (
            <CommandGroup heading="Details">
              {results.map((result) => (
                <CommandItem
                  key={result.id}
                  value={`${result.code} ${result.name}`}
                  onSelect={() => handleSelect(`/search?q=${encodeURIComponent(result.code)}`)}
                  className="min-h-[48px]"
                >
                  <FileText className="mr-2 h-4 w-4 text-primary" />
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {result.code} - {result.name}
                    </span>
                    {(result.substrate || result.category) && (
                      <span className="text-xs text-muted-foreground">
                        {[result.substrate?.name, result.category?.name].filter(Boolean).join(' • ')}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
              {query.trim() && (
                <CommandItem
                  value={`search-${query}`}
                  onSelect={handleSearchSubmit}
                  className="min-h-[48px] text-primary"
                >
                  <Search className="mr-2 h-4 w-4" />
                  <span>Search all for &quot;{query}&quot;</span>
                </CommandItem>
              )}
            </CommandGroup>
          )}

          {/* Quick Navigation - only show when not searching */}
          {!query && (
            <>
              <CommandGroup heading="Quick Navigation">
                {quickActions.map((action) => (
                  <CommandItem
                    key={action.href}
                    value={`${action.label} ${action.keywords.join(' ')}`}
                    onSelect={() => handleSelect(action.href)}
                    className="min-h-[48px]"
                  >
                    <action.icon className="mr-2 h-4 w-4" />
                    <span>{action.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>

              <CommandSeparator />

              <CommandGroup heading="Substrates">
                {substrates.map((substrate) => (
                  <CommandItem
                    key={substrate.id}
                    value={`substrate ${substrate.name}`}
                    onSelect={() => handleSelect(substrate.href)}
                    className="min-h-[48px]"
                  >
                    <Layers className="mr-2 h-4 w-4" />
                    <span>{substrate.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}

// Mobile search trigger button (opens command search)
export function CommandSearchTrigger({ className }: { className?: string }) {
  const handleOpen = useCallback(() => {
    window.dispatchEvent(new CustomEvent('open-command-search'));
  }, []);

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn('h-10 w-10', className)}
      onClick={handleOpen}
      aria-label="Open search (⌘K)"
    >
      <Search className="h-5 w-5" />
    </Button>
  );
}
