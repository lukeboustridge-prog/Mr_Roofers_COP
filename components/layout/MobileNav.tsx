'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Wrench, Star, Menu, Clipboard, AlertTriangle, Settings, ClipboardCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { useAppStore } from '@/stores/app-store';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/fixer', label: 'Fixer', icon: Wrench },
  { href: '/favourites', label: 'Saved', icon: Star },
];

export function MobileNav() {
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white lg:hidden">
      <div className="flex h-16 items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex min-h-[48px] min-w-[48px] flex-col items-center justify-center gap-1 px-2',
                isActive ? 'text-primary' : 'text-slate-500'
              )}
            >
              <Icon className="h-6 w-6" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}

        {/* Menu Sheet Trigger */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <button
              className={cn(
                'flex min-h-[48px] min-w-[48px] flex-col items-center justify-center gap-1 px-2',
                'text-slate-500'
              )}
            >
              <Menu className="h-6 w-6" />
              <span className="text-xs font-medium">Menu</span>
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0">
            <SheetHeader className="border-b p-4">
              <SheetTitle className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white font-bold text-sm">
                  MR
                </div>
                Master Roofers COP
              </SheetTitle>
            </SheetHeader>
            <div onClick={() => setSheetOpen(false)}>
              <MobileSidebarContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}

function MobileSidebarContent() {
  const pathname = usePathname();
  const { mode, isOffline } = useAppStore();

  const mainNavItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/planner', label: 'Planner Mode', icon: Clipboard, highlight: mode === 'planner' },
    { href: '/fixer', label: 'Fixer Mode', icon: Wrench, highlight: mode === 'fixer' },
    { href: '/search', label: 'Search', icon: Search },
    { href: '/favourites', label: 'Favourites', icon: Star },
  ];

  const secondaryNavItems = [
    { href: '/checklists', label: 'My Checklists', icon: ClipboardCheck },
    { href: '/failures', label: 'Failure Cases', icon: AlertTriangle },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Offline Indicator */}
      {isOffline && (
        <div className="mx-4 mt-2 rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-800">
          You&apos;re offline - some features may be limited
        </div>
      )}

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        <p className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Navigation
        </p>
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium transition-colors min-h-[52px]',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : item.highlight
                  ? 'bg-secondary/5 text-secondary hover:bg-secondary/10'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
              {item.highlight && (
                <Badge variant="secondary" className="ml-auto text-xs">
                  Active
                </Badge>
              )}
            </Link>
          );
        })}

        <div className="my-4 border-t" />

        <p className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Resources
        </p>
        {secondaryNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium transition-colors min-h-[52px]',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Mode Indicator */}
      <div className="p-4 border-t">
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs text-slate-500 mb-1">Current Mode</p>
          <div className="flex items-center gap-2">
            {mode === 'planner' ? (
              <>
                <Clipboard className="h-4 w-4 text-primary" />
                <span className="font-medium text-primary">Planner</span>
              </>
            ) : (
              <>
                <Wrench className="h-4 w-4 text-secondary" />
                <span className="font-medium text-secondary">Fixer</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
