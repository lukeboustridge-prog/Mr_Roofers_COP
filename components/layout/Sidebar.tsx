'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Clipboard,
  Wrench,
  Search,
  Star,
  AlertTriangle,
  Settings,
  ChevronDown,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { SUBSTRATES } from '@/lib/constants';
import { Separator } from '@/components/ui/separator';

const mainNavItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/planner', label: 'Planner', icon: Clipboard },
  { href: '/fixer', label: 'Fixer', icon: Wrench },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/favourites', label: 'Favourites', icon: Star },
];

const secondaryNavItems = [
  { href: '/failures', label: 'Failure Cases', icon: AlertTriangle },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [substratesOpen, setSubstratesOpen] = useState(false);

  return (
    <aside className="hidden lg:flex w-64 flex-col border-r bg-white">
      <nav className="flex-1 space-y-1 p-4">
        {/* Main Navigation */}
        <div className="space-y-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
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
        </div>

        <Separator className="my-4" />

        {/* Substrates Accordion */}
        <div className="space-y-1">
          <button
            onClick={() => setSubstratesOpen(!substratesOpen)}
            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            <div className="flex items-center gap-3">
              <Layers className="h-5 w-5" />
              Substrates
            </div>
            {substratesOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>

          {substratesOpen && (
            <div className="ml-4 space-y-1 border-l pl-4">
              {SUBSTRATES.map((substrate) => {
                const isActive = pathname.includes(`/planner/${substrate.id}`);
                return (
                  <Link
                    key={substrate.id}
                    href={`/planner/${substrate.id}`}
                    className={cn(
                      'block rounded-lg px-3 py-2 text-sm transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                    )}
                  >
                    {substrate.name}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <Separator className="my-4" />

        {/* Secondary Navigation */}
        <div className="space-y-1">
          {secondaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
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
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t p-4">
        <p className="text-xs text-slate-500">
          Master Roofers COP v1.0
        </p>
        <p className="text-xs text-slate-400">
          Last updated: Jan 2024
        </p>
      </div>
    </aside>
  );
}
