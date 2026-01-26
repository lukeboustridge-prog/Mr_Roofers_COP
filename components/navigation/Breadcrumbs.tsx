'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

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
 *
 * Example usage:
 * <Breadcrumbs items={[
 *   { label: 'Planner', href: '/planner' },
 *   { label: 'Long-Run Metal', href: '/planner/long-run-metal' },
 *   { label: 'Flashings' }  // No href = current page
 * ]} />
 */
export function Breadcrumbs({ items, className, showHome = true }: BreadcrumbsProps) {
  const pathname = usePathname();

  // If no items provided, generate from pathname
  const breadcrumbItems = items || generateBreadcrumbsFromPath(pathname);

  if (breadcrumbItems.length === 0) {
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

        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;

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
 * Maps route segments to human-readable labels
 */
function generateBreadcrumbsFromPath(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  const items: BreadcrumbItem[] = [];

  // Build breadcrumbs based on route structure
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
  // Known route mappings
  const routeLabels: Record<string, string> = {
    'planner': 'Planner',
    'fixer': 'Fixer',
    'search': 'Search',
    'favourites': 'Favourites',
    'failures': 'Failure Cases',
    'checklists': 'Checklists',
    'settings': 'Settings',
    'results': 'Results',
    // Substrate mappings
    'long-run-metal': 'Long-Run Metal',
    'membrane': 'Membrane',
    'asphalt-shingle': 'Asphalt Shingle',
    'concrete-tile': 'Concrete Tile',
    'clay-tile': 'Clay Tile',
    'pressed-metal-tile': 'Pressed Metal Tile',
    // Common category patterns
    'lrm-flashings': 'Flashings',
    'lrm-ridges': 'Ridges & Hips',
    'lrm-valleys': 'Valleys',
    'lrm-penetrations': 'Penetrations',
    'lrm-gutters': 'Gutters',
    'lrm-ventilation': 'Ventilation',
    'mem-flashings': 'Flashings',
    'mem-penetrations': 'Penetrations',
    'mem-drains': 'Drains & Outlets',
    'mem-edges': 'Edges & Parapets',
    'ash-starter': 'Starter & Eaves',
    'ash-ridges': 'Ridges & Hips',
    'ash-valleys': 'Valleys',
    'ash-flashings': 'Flashings',
    'ct-flashings': 'Flashings',
    'ct-ridges': 'Ridges & Hips',
    'ct-valleys': 'Valleys',
    'ct-ventilation': 'Ventilation',
    'clt-flashings': 'Flashings',
    'clt-ridges': 'Ridges & Hips',
    'clt-valleys': 'Valleys',
    'pmt-flashings': 'Flashings',
    'pmt-ridges': 'Ridges & Hips',
    'pmt-valleys': 'Valleys',
  };

  if (routeLabels[segment]) {
    return routeLabels[segment];
  }

  // Check if it looks like a detail code (e.g., lrm-f01)
  if (segment.match(/^[a-z]+-[a-z]\d+$/i)) {
    // Extract the code part and uppercase it (e.g., 'lrm-f01' -> 'F01')
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

/**
 * Hook to get breadcrumb items with data from server
 * Use this in server components to pass proper labels
 */
export function createBreadcrumbItems(
  base: 'planner' | 'fixer' | 'failures',
  options?: {
    substrate?: { id: string; name: string } | null;
    category?: { id: string; name: string } | null;
    detail?: { id: string; code: string; name?: string } | null;
    failureCase?: { id: string; caseId: string } | null;
  }
): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [];

  // Base route
  const baseLabels = {
    planner: 'Planner',
    fixer: 'Fixer',
    failures: 'Failure Cases',
  };

  items.push({
    label: baseLabels[base],
    href: `/${base}`,
  });

  if (!options) {
    // Remove href from last item
    items[items.length - 1].href = undefined;
    return items;
  }

  // Substrate level
  if (options.substrate) {
    items.push({
      label: options.substrate.name,
      href: `/${base}/${options.substrate.id}`,
    });
  }

  // Category level
  if (options.category && options.substrate) {
    items.push({
      label: options.category.name,
      href: `/${base}/${options.substrate.id}/${options.category.id}`,
    });
  }

  // Detail level
  if (options.detail && options.category && options.substrate) {
    items.push({
      label: options.detail.code,
    });
  }

  // Failure case level
  if (options.failureCase) {
    items.push({
      label: options.failureCase.caseId,
    });
  }

  // Remove href from last item (current page)
  if (items.length > 0) {
    items[items.length - 1].href = undefined;
  }

  return items;
}
