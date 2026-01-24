'use client';

import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';
import { Menu, Search, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ModeToggle } from './ModeToggle';
import { useAppStore } from '@/stores/app-store';
import { cn } from '@/lib/utils';

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

      {/* Center section - Search (hidden on mobile) */}
      <div className="hidden flex-1 max-w-md mx-8 md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="search"
            placeholder="Search details, codes, or standards..."
            className="w-full pl-10"
          />
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-4">
        {/* Connection status indicator */}
        <div className={cn(
          'hidden sm:flex items-center gap-1 text-xs',
          isOffline ? 'text-amber-600' : 'text-green-600'
        )}>
          {isOffline ? (
            <WifiOff className="h-3 w-3" />
          ) : (
            <Wifi className="h-3 w-3" />
          )}
        </div>

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
