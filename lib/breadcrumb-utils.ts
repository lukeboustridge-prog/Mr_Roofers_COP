/**
 * Breadcrumb utility functions for Server Components
 * Separated from client component to allow usage in RSC
 */

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

/**
 * Create breadcrumb items with data from server
 * Use this in server components to pass proper labels to the Breadcrumbs component
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
    failures: 'Case Law',
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
