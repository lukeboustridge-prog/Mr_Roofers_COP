'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { UserButton } from '@clerk/nextjs';
import { Menu, Search, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ModeToggle } from './ModeToggle';
import { useAppStore } from '@/stores/app-store';

// Lazy load CommandSearch to avoid loading cmdk dialog on initial render (~40KB savings)
const CommandSearch = dynamic(
  () => import('@/components/search/CommandSearch').then((mod) => mod.CommandSearch),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center gap-2 rounded-lg border bg-slate-50 px-3 py-2 text-sm text-slate-500 w-64">
        <Search className="h-4 w-4" />
        <span>Search...</span>
        <Skeleton className="ml-auto h-5 w-12" />
      </div>
    ),
  }
);

export function Header() {
  const { toggleSidebar, isOffline } = useAppStore();

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-white px-4 lg:px-6">
      {/* Left section */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={toggleSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white font-bold">
            MR
          </div>
          <span className="hidden font-semibold text-slate-900 sm:inline-block">
            Master Roofers COP
          </span>
        </Link>
      </div>

      {/* Center section - Command Search */}
      <div className="hidden flex-1 justify-center mx-8 md:flex">
        <CommandSearch />
      </div>

      {/* Mobile search button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => {
          // Trigger the command palette via custom event
          window.dispatchEvent(new CustomEvent('open-command-search'));
        }}
        aria-label="Search"
      >
        <Search className="h-5 w-5" />
      </Button>

      {/* Right section */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Connection status indicator - always visible when offline */}
        {isOffline ? (
          <div className="flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
            <WifiOff className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Offline</span>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-1 text-xs text-green-600">
            <Wifi className="h-3 w-3" />
          </div>
        )}

        <ModeToggle />

        <UserButton
          afterSignOutUrl="/sign-in"
          appearance={{
            elements: {
              avatarBox: 'h-8 w-8',
            },
          }}
        />
      </div>
    </header>
  );
}
