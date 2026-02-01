'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem } from '@/lib/breadcrumb-utils';

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
}

/**
 * Breadcrumbs component for navigation context
 *
 * Can be used in two ways:
 * 1. Pass explicit `items` array for full control
 * 2. Use without items for auto-generated breadcrumbs from URL path
 */
export function Breadcrumbs({ items, className, showHome = true }: BreadcrumbsProps) {
  // If items are provided, render directly without hooks
  if (items) {
    return (
      <BreadcrumbsView
        items={items}
        className={className}
        showHome={showHome}
      />
    );
  }

  // Otherwise, use the hook-based version
  return (
    <BreadcrumbsWithPathname
      className={className}
      showHome={showHome}
    />
  );
}

/**
 * Internal component that uses usePathname hook
 */
function BreadcrumbsWithPathname({
  className,
  showHome = true,
}: Omit<BreadcrumbsProps, 'items'>) {
  const pathname = usePathname();
  const items = generateBreadcrumbsFromPath(pathname);

  return (
    <BreadcrumbsView
      items={items}
      className={className}
      showHome={showHome}
    />
  );
}

/**
 * Pure view component - no hooks
 */
function BreadcrumbsView({
  items,
  className,
  showHome = true,
}: {
  items: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center text-sm', className)}
    >
      <ol className="flex items-center flex-wrap gap-1">
        {showHome && (
          <>
            <li>
              <Link
                href="/"
                className="flex items-center text-slate-500 hover:text-primary transition-colors min-h-[44px] min-w-[44px] justify-center"
                aria-label="Home"
              >
                <Home className="h-4 w-4" />
              </Link>
            </li>
            <li aria-hidden="true" className="text-slate-400">
              <ChevronRight className="h-4 w-4" />
            </li>
          </>
        )}

        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={item.href || item.label} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 mx-1 text-slate-400" aria-hidden="true" />
              )}

              {isLast || !item.href ? (
                <span
                  className="font-medium text-slate-900 px-1 py-2"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="text-slate-500 hover:text-primary transition-colors px-1 py-2 min-h-[44px] flex items-center"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * Generate breadcrumbs from URL pathname
 */
function generateBreadcrumbsFromPath(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  const items: BreadcrumbItem[] = [];
  let currentPath = '';

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    currentPath += `/${segment}`;

    // Skip route groups like (dashboard)
    if (segment.startsWith('(') && segment.endsWith(')')) {
      continue;
    }

    const label = formatSegmentLabel(segment);
    const isLast = i === segments.length - 1;

    items.push({
      label,
      href: isLast ? undefined : currentPath,
    });
  }

  return items;
}

/**
 * Format a URL segment into a human-readable label
 */
function formatSegmentLabel(segment: string): string {
  const routeLabels: Record<string, string> = {
    'planner': 'Planner',
    'fixer': 'Fixer',
    'search': 'Search',
    'favourites': 'Favourites',
    'failures': 'Case Law',
    'checklists': 'Checklists',
    'settings': 'Settings',
    'results': 'Results',
    'topics': 'Topics',
    'long-run-metal': 'Long-Run Metal',
    'membrane': 'Membrane',
    'asphalt-shingle': 'Asphalt Shingle',
    'concrete-tile': 'Concrete Tile',
    'clay-tile': 'Clay Tile',
    'pressed-metal-tile': 'Pressed Metal Tile',
    // Common topic IDs
    'flashings': 'Flashings',
    'ridges-hips': 'Ridges & Hips',
    'valleys': 'Valleys',
    'penetrations': 'Penetrations',
    'gutters': 'Gutters',
    'ventilation': 'Ventilation',
    'junctions': 'Junctions',
    'general': 'General',
  };

  if (routeLabels[segment]) {
    return routeLabels[segment];
  }

  // Check if it looks like a detail code (e.g., lrm-f01)
  if (segment.match(/^[a-z]+-[a-z]\d+$/i)) {
    const parts = segment.split('-');
    if (parts.length >= 2) {
      return parts.slice(1).join('-').toUpperCase();
    }
  }

  // Default: convert kebab-case to Title Case
  return segment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
