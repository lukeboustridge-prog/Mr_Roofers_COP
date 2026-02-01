# Phase 9: Unified Navigation - Research

**Researched:** 2026-02-01
**Domain:** Multi-source content navigation and filtering (Next.js App Router)
**Confidence:** HIGH

## Summary

Phase 9 implements unified topic-based navigation where users can browse semantic topics (e.g., "Flashings") and see content from all sources (MRM COP + RANZ Guide) in a single listing, with ability to filter by source and content capabilities.

The existing codebase already has strong foundations from Phases 7 and 8:
- Topic-based data model with `getDetailsByTopic` query function
- Authority system with visual indicators (SourceBadge, ContentCapabilityBadges)
- Existing client-side filtering pattern in `category-client.tsx`

The standard approach combines:
1. **Server Component page** with searchParams for URL state
2. **Client Component** for interactive filters (tabs, checkboxes)
3. **shadcn/ui Tabs** component with controlled state
4. **URL state management** via useSearchParams + router.replace
5. **Empty state patterns** for "Coming Soon" substrates

**Primary recommendation:** Extend existing category-client.tsx pattern to topic pages, using shadcn Tabs for source filtering and checkboxes for capability filters, with all filter state in URL searchParams for shareability.

## Standard Stack

### Core Navigation Components

| Component | Version/Type | Purpose | Why Standard |
|-----------|--------------|---------|--------------|
| shadcn/ui Tabs | Radix UI @1.1+ | Source filter tabs (All/MRM/RANZ) | Built on Radix Tabs primitive, supports controlled state for URL sync |
| useSearchParams | Next.js 14 native | Read URL query state in client | Official Next.js App Router hook for client-side param access |
| useRouter | Next.js 14 native | Update URL without full reload | router.replace() for shallow routing preserves scroll position |
| Checkbox | shadcn/ui | Capability filters (3D, Steps, etc.) | Accessible, works with form state or controlled state |
| Breadcrumbs | Existing component | Hierarchical navigation context | Already implemented in codebase at `components/navigation/Breadcrumbs.tsx` |

### Supporting Components

| Component | Version/Type | Purpose | When to Use |
|-----------|--------------|---------|-------------|
| SourceBadge | Existing (Phase 8) | Display source with authority styling | Already implements blue (authoritative) vs grey (supplementary) variants |
| ContentCapabilityBadges | Existing (Phase 8) | Show 3D/Steps/Warnings/Case Law icons | Already implemented with tooltip support |
| DetailCard | Existing (Phase 8) | Detail listing card | Already supports source badges and capability badges |
| Card (empty state) | shadcn/ui | Coming Soon placeholders | Standard shadcn pattern for empty states |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Tabs for source filter | DropdownMenu | Tabs are more discoverable for 2-3 options; dropdowns better for 5+ |
| URL state | Local React state | URL state enables shareable links, back button support |
| Checkboxes for capabilities | Toggle buttons | Checkboxes better for multi-select, clearer selected state |

**Installation:**
All components already installed. No new dependencies required.

## Architecture Patterns

### Recommended Page Structure

```
app/(dashboard)/
├── topics/
│   ├── page.tsx                    # Topic listing (may not be needed - could go straight from home)
│   └── [topicId]/
│       └── page.tsx                # TopicCategoryPage (Server Component)
│           └── topic-client.tsx    # TopicDetailsClient (Client Component with filters)
```

**Alternative:** Add topic navigation to home page instead of separate topics listing page.

### Pattern 1: Server + Client Split for Filter State

**What:** Server Component owns searchParams, passes to client component for filter UI
**When to use:** All filtered listing pages (enables shareability + back button)

**Example:**
```typescript
// app/(dashboard)/topics/[topicId]/page.tsx (Server Component)
interface TopicPageProps {
  params: { topicId: string };
  searchParams: { source?: string; capabilities?: string };
}

export default async function TopicPage({ params, searchParams }: TopicPageProps) {
  const { topicId } = params;
  const sourceFilter = searchParams.source || 'all';
  const capabilityFilter = searchParams.capabilities?.split(',') || [];

  // Fetch data with filters applied server-side
  const topic = await getTopicById(topicId);
  const detailsResult = await getDetailsByTopic(topicId, {
    sourceId: sourceFilter === 'all' ? undefined : sourceFilter,
  });

  return (
    <div>
      <TopicDetailsClient
        topic={topic}
        details={detailsResult.data}
        initialSourceFilter={sourceFilter}
        initialCapabilityFilter={capabilityFilter}
      />
    </div>
  );
}
```

**Source:** [Next.js searchParams pattern](https://nextjs.org/docs/app/api-reference/file-conventions/page)

### Pattern 2: Tabs with URL State Sync

**What:** Use shadcn Tabs in controlled mode, sync active tab with URL params
**When to use:** Source filtering (All / MRM COP / RANZ Guide tabs)

**Example:**
```typescript
// topic-client.tsx (Client Component)
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export function TopicDetailsClient({ details, initialSourceFilter }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(initialSourceFilter);

  const handleTabChange = (value: string) => {
    setActiveTab(value);

    // Update URL
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') {
      params.delete('source');
    } else {
      params.set('source', value);
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <TabsList>
        <TabsTrigger value="all">All Sources</TabsTrigger>
        <TabsTrigger value="mrm-cop">MRM COP</TabsTrigger>
        <TabsTrigger value="ranz-guide">RANZ Guide</TabsTrigger>
      </TabsList>
      <TabsContent value={activeTab}>
        {/* Filtered details */}
      </TabsContent>
    </Tabs>
  );
}
```

**Source:** [Radix UI Tabs controlled state](https://www.radix-ui.com/primitives/docs/components/tabs)

### Pattern 3: Capability Filter Checkboxes

**What:** Multi-select checkboxes for content capabilities, stored as comma-separated URL param
**When to use:** Filtering by Has 3D Model / Has Steps / Has Warnings / Has Case Law

**Example:**
```typescript
const [selectedCapabilities, setSelectedCapabilities] = useState<string[]>([]);

const handleCapabilityToggle = (capability: string) => {
  const updated = selectedCapabilities.includes(capability)
    ? selectedCapabilities.filter(c => c !== capability)
    : [...selectedCapabilities, capability];

  setSelectedCapabilities(updated);

  const params = new URLSearchParams(searchParams.toString());
  if (updated.length === 0) {
    params.delete('capabilities');
  } else {
    params.set('capabilities', updated.join(','));
  }
  router.replace(`?${params.toString()}`, { scroll: false });
};

// Client-side filtering
const filteredDetails = details.filter(detail => {
  if (selectedCapabilities.length === 0) return true;

  return selectedCapabilities.every(cap => {
    if (cap === '3d') return detail.modelUrl !== null;
    if (cap === 'steps') return detail.hasSteps;
    if (cap === 'warnings') return detail.hasWarnings;
    if (cap === 'caseLaw') return detail.hasCaseLaw;
    return true;
  });
});
```

**Note:** Capability filtering happens **client-side** because these are derived/aggregated fields not directly queryable.

### Pattern 4: COP Section Navigation (Hierarchical)

**What:** Breadcrumb-style navigation through COP section numbers (Chapter 4 > Section 4.3 > Detail 4.3.2)
**When to use:** Consent documentation references where inspectors cite specific section numbers

**Example:**
```typescript
// lib/cop-sections.ts
export interface COPSection {
  id: string;
  chapterNumber: number;
  sectionNumber?: number;
  detailNumber?: number;
  title: string;
  parentId?: string;
}

// Navigation structure
const sections = [
  { id: 'ch4', chapterNumber: 4, title: 'Flashings' },
  { id: 'ch4-3', chapterNumber: 4, sectionNumber: 3, title: 'Valley Flashings', parentId: 'ch4' },
  { id: 'ch4-3-2', chapterNumber: 4, sectionNumber: 3, detailNumber: 2, title: 'Open Valley Detail', parentId: 'ch4-3' },
];

// Component
<Breadcrumbs
  items={[
    { label: 'Chapter 4: Flashings', href: '/sections/ch4' },
    { label: '4.3 Valley Flashings', href: '/sections/ch4-3' },
    { label: '4.3.2 Open Valley Detail', href: '/sections/ch4-3-2' },
  ]}
/>
```

**Best Practice:** Use ">" separator for hierarchical breadcrumbs per [NN/G guidelines](https://www.nngroup.com/articles/breadcrumbs/)

### Pattern 5: Coming Soon Empty State

**What:** Placeholder for substrates/topics with no content yet
**When to use:** User navigates to substrate section with 0 details

**Example:**
```typescript
if (details.length === 0) {
  return (
    <Card className="border-dashed">
      <CardContent className="p-12 text-center">
        <div className="mx-auto w-fit rounded-full bg-slate-100 p-4">
          <FileText className="h-12 w-12 text-slate-400" />
        </div>
        <h3 className="mt-6 text-lg font-semibold text-slate-900">
          Coming Soon
        </h3>
        <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
          {substrate.name} details are currently being prepared. Check back soon or explore other substrates.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/planner">
            <Button variant="outline">Browse Other Substrates</Button>
          </Link>
          <Link href="/search">
            <Button>Search All Details</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Source:** [Empty state best practices](https://www.eleken.co/blog-posts/empty-state-ux)

### Anti-Patterns to Avoid

- **Don't filter server-side by capabilities** - These require JOINs with counts, better filtered client-side
- **Don't use separate pages for each source** - Defeats unified navigation purpose
- **Don't use accordions for 2-3 source options** - Tabs are more discoverable
- **Don't show greyed-out capability badges** - Only show badges for TRUE capabilities (existing pattern)
- **Don't omit URL state** - Breaks shareable links and back button

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tab component | Custom tab switcher with state | shadcn/ui Tabs (Radix primitive) | Accessibility (ARIA roles, keyboard nav), controlled state support |
| URL parameter parsing | Manual searchParams string manipulation | URLSearchParams API | Handles encoding, multiple values, edge cases |
| Filter state sync | Custom useState + useEffect sync | Controlled components with onChange -> router.replace | Simpler, single source of truth (URL) |
| Empty state illustration | Custom SVG drawings | shadcn icons (lucide-react) + Card | Consistent with existing design system |
| Breadcrumb component | Manual nav trail markup | Existing Breadcrumbs component | Already implements best practices, ARIA labels |

**Key insight:** Next.js 14 App Router's searchParams + useSearchParams pattern is the standard for filter state. Don't fight the framework - embrace server/client split.

## Common Pitfalls

### Pitfall 1: Tabs Lose State on Navigation

**What goes wrong:** User filters by source, navigates to detail, clicks back - filter resets to "All"
**Why it happens:** Not persisting tab state in URL searchParams
**How to avoid:** Always sync active tab with URL via router.replace()
**Warning signs:** Browser back button doesn't restore filter state

**Prevention:**
```typescript
// WRONG - local state only
const [activeTab, setActiveTab] = useState('all');

// RIGHT - controlled from URL
const searchParams = useSearchParams();
const activeTab = searchParams.get('source') || 'all';

const handleTabChange = (value: string) => {
  const params = new URLSearchParams(searchParams.toString());
  params.set('source', value);
  router.replace(`?${params.toString()}`, { scroll: false });
};
```

### Pitfall 2: Server Component Fetching Wrong Data

**What goes wrong:** Client filters change but server keeps showing old data
**Why it happens:** Not passing searchParams from server component to query
**How to avoid:** Extract filters from searchParams in server component, pass to query functions
**Warning signs:** Tab changes but detail count doesn't update

**Prevention:**
```typescript
// Server Component
export default async function TopicPage({ searchParams }: TopicPageProps) {
  const sourceFilter = searchParams.source || 'all';

  // Apply filter to query
  const details = await getDetailsByTopic(topicId, {
    sourceId: sourceFilter === 'all' ? undefined : sourceFilter,
  });

  // Pass to client for UI state
  return <TopicClient details={details} initialSource={sourceFilter} />;
}
```

### Pitfall 3: Capability Filters Cause Hydration Mismatch

**What goes wrong:** "Hydration error: Text content does not match" when filtering by capabilities
**Why it happens:** Capability filtering logic runs differently server vs client
**How to avoid:** Apply capability filters ONLY client-side, after hydration
**Warning signs:** Console errors about mismatched content during development

**Prevention:**
```typescript
// Client Component
const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
}, []);

// Only apply client-side filters after mount
const filteredDetails = mounted
  ? details.filter(/* capability logic */)
  : details;
```

### Pitfall 4: Multiple Filter Updates Cause Race Conditions

**What goes wrong:** User clicks multiple filters rapidly, URL ends up in inconsistent state
**Why it happens:** Multiple router.replace() calls without debouncing
**How to avoid:** Use single filter state object, update all params at once
**Warning signs:** URL flickers between different states

**Prevention:**
```typescript
// WRONG - separate updates
const updateSource = (source: string) => {
  params.set('source', source);
  router.replace(`?${params.toString()}`);
};
const updateCapabilities = (caps: string[]) => {
  params.set('capabilities', caps.join(','));
  router.replace(`?${params.toString()}`);
};

// RIGHT - batch updates
const updateFilters = (updates: { source?: string; capabilities?: string[] }) => {
  const params = new URLSearchParams(searchParams.toString());
  if (updates.source) params.set('source', updates.source);
  if (updates.capabilities) params.set('capabilities', updates.capabilities.join(','));
  router.replace(`?${params.toString()}`, { scroll: false });
};
```

### Pitfall 5: Breadcrumbs Don't Show Topic Context

**What goes wrong:** User on unified topic page doesn't see they're viewing cross-source content
**Why it happens:** Breadcrumbs only show substrate > category, not topic layer
**How to avoid:** Add topic level to breadcrumb hierarchy
**Warning signs:** Confusion about why MRM and RANZ content appear together

**Prevention:**
```typescript
// Include topic in breadcrumb items
const breadcrumbItems = [
  { label: 'Home', href: '/' },
  { label: 'Topics', href: '/topics' },
  { label: topic.name, href: `/topics/${topic.id}` }, // Topic layer
];

// vs old substrate-only path:
// Home > Planner > Profiled Metal > Flashings
```

## Code Examples

Verified patterns from existing codebase and official sources:

### Source Filter Tabs with URL State

```typescript
// Source: Existing pattern from category-client.tsx + shadcn Tabs
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface SourceFilterTabsProps {
  allCount: number;
  mrmCount: number;
  ranzCount: number;
  children: React.ReactNode;
}

export function SourceFilterTabs({
  allCount,
  mrmCount,
  ranzCount,
  children,
}: SourceFilterTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeSource = searchParams.get('source') || 'all';

  const handleSourceChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') {
      params.delete('source');
    } else {
      params.set('source', value);
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return (
    <Tabs value={activeSource} onValueChange={handleSourceChange}>
      <TabsList className="w-full justify-start">
        <TabsTrigger value="all" className="gap-2">
          All Sources
          <Badge variant="secondary">{allCount}</Badge>
        </TabsTrigger>
        <TabsTrigger value="mrm-cop" className="gap-2">
          MRM COP
          <Badge variant="secondary">{mrmCount}</Badge>
        </TabsTrigger>
        <TabsTrigger value="ranz-guide" className="gap-2">
          RANZ Guide
          <Badge variant="secondary">{ranzCount}</Badge>
        </TabsTrigger>
      </TabsList>
      <TabsContent value={activeSource}>
        {children}
      </TabsContent>
    </Tabs>
  );
}
```

### Capability Filter Checkboxes

```typescript
// Source: Adapted from FilterPanel.tsx pattern + shadcn Checkbox
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Box, ListChecks, AlertTriangle, Scale } from 'lucide-react';

export function CapabilityFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const capabilities = searchParams.get('capabilities')?.split(',') || [];

  const handleToggle = (capability: string) => {
    const updated = capabilities.includes(capability)
      ? capabilities.filter(c => c !== capability)
      : [...capabilities, capability];

    const params = new URLSearchParams(searchParams.toString());
    if (updated.length === 0) {
      params.delete('capabilities');
    } else {
      params.set('capabilities', updated.join(','));
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-slate-700">Content Features</h3>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Checkbox
            id="cap-3d"
            checked={capabilities.includes('3d')}
            onCheckedChange={() => handleToggle('3d')}
          />
          <Label htmlFor="cap-3d" className="flex items-center gap-2 cursor-pointer">
            <Box className="h-4 w-4 text-blue-500" />
            Has 3D Model
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="cap-steps"
            checked={capabilities.includes('steps')}
            onCheckedChange={() => handleToggle('steps')}
          />
          <Label htmlFor="cap-steps" className="flex items-center gap-2 cursor-pointer">
            <ListChecks className="h-4 w-4 text-green-500" />
            Has Installation Steps
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="cap-warnings"
            checked={capabilities.includes('warnings')}
            onCheckedChange={() => handleToggle('warnings')}
          />
          <Label htmlFor="cap-warnings" className="flex items-center gap-2 cursor-pointer">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Has Warnings
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="cap-caselaw"
            checked={capabilities.includes('caselaw')}
            onCheckedChange={() => handleToggle('caselaw')}
          />
          <Label htmlFor="cap-caselaw" className="flex items-center gap-2 cursor-pointer">
            <Scale className="h-4 w-4 text-red-500" />
            Related Case Law
          </Label>
        </div>
      </div>
    </div>
  );
}
```

### Coming Soon Empty State

```typescript
// Source: Existing pattern from category-client.tsx lines 160-184
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import Link from 'next/link';

interface ComingSoonPlaceholderProps {
  substrateName: string;
  topicName: string;
}

export function ComingSoonPlaceholder({
  substrateName,
  topicName,
}: ComingSoonPlaceholderProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="p-12 text-center">
        <div className="mx-auto w-fit rounded-full bg-slate-100 p-4">
          <FileText className="h-12 w-12 text-slate-400" />
        </div>
        <h3 className="mt-6 text-lg font-semibold text-slate-900">
          Coming Soon
        </h3>
        <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
          {topicName} details for {substrateName} are currently being prepared.
          Check back soon or explore other topics and substrates.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/topics">
            <Button variant="outline">Browse Topics</Button>
          </Link>
          <Link href="/planner">
            <Button variant="outline">Browse by Substrate</Button>
          </Link>
          <Link href="/search">
            <Button>Search All Details</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Client-Side Capability Filtering Logic

```typescript
// Source: Adapted from category-client.tsx filtering pattern
import { useMemo } from 'react';

interface Detail {
  id: string;
  modelUrl: string | null;
  hasSteps: boolean;
  hasWarnings: boolean;
  hasCaseLaw: boolean;
  sourceId: string;
}

export function useFilteredDetails(
  details: Detail[],
  sourceFilter: string,
  capabilityFilters: string[]
) {
  return useMemo(() => {
    let filtered = [...details];

    // Source filter (already applied server-side, but could be client-side too)
    if (sourceFilter !== 'all') {
      filtered = filtered.filter(d => d.sourceId === sourceFilter);
    }

    // Capability filters (client-side only)
    if (capabilityFilters.length > 0) {
      filtered = filtered.filter(detail => {
        return capabilityFilters.every(cap => {
          switch (cap) {
            case '3d':
              return detail.modelUrl !== null;
            case 'steps':
              return detail.hasSteps;
            case 'warnings':
              return detail.hasWarnings;
            case 'caselaw':
              return detail.hasCaseLaw;
            default:
              return true;
          }
        });
      });
    }

    return filtered;
  }, [details, sourceFilter, capabilityFilters]);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate pages per source | Unified topic pages with source tabs | Phase 7-9 (2026) | Users see all relevant content without knowing source structure |
| Client-only filter state | URL searchParams for filters | Next.js 13+ App Router | Shareable filtered views, back button support |
| Custom tab components | Radix UI primitives via shadcn | 2023+ | Better accessibility, keyboard navigation OOTB |
| Manual URLSearchParams parsing | Built-in useSearchParams hook | Next.js 13+ | Type-safe, framework-integrated |
| Greyed-out capability placeholders | Show only TRUE capabilities | Phase 8 decision | Cleaner UI, less visual noise |

**Deprecated/outdated:**
- **Pages Router searchParams patterns**: App Router uses different conventions (params/searchParams as props, not router.query)
- **Client-side only filtering without URL state**: Modern expectation is shareable filter links
- **Accordion-style source selectors**: Tabs are more discoverable for 2-3 options

## Open Questions

Things that couldn't be fully resolved:

1. **Should topic navigation be primary or secondary?**
   - What we know: Topic-based is more intuitive for finding "all flashings" content
   - What's unclear: Whether users still need substrate-first navigation for material-specific workflows
   - Recommendation: Keep both paths (topics/ and planner/) - users self-select based on mental model

2. **How to handle COP section numbers for multi-source content?**
   - What we know: MRM COP has formal section numbering (4.3.2), RANZ Guide may not
   - What's unclear: Whether to generate section numbers for RANZ content or leave blank
   - Recommendation: Only show section navigation for MRM COP content (authoritative source), treat as optional metadata

3. **Should capability filters apply to all tabs or only active tab?**
   - What we know: Filtering "All Sources" by "Has 3D Model" is intuitive
   - What's unclear: If user switches to "MRM COP" tab, should capability filter persist or reset?
   - Recommendation: Persist capability filters across source tabs (URL param independent of source param)

4. **How many topics to seed initially?**
   - What we know: Phase 7 created topics table structure
   - What's unclear: Which semantic topics cover 80% of use cases
   - Recommendation: Start with 6-8 core topics (Flashings, Ridges/Hips, Valleys, Penetrations, Gutters, Ventilation, Junctions, General) - align with FIXER_TASKS in constants.ts

## Sources

### Primary (HIGH confidence)

- [Next.js 14 searchParams documentation](https://nextjs.org/docs/app/api-reference/file-conventions/page) - Official pattern for server component params
- [Next.js useSearchParams hook](https://nextjs.org/docs/app/api-reference/functions/use-search-params) - Client-side URL param access
- [shadcn/ui Tabs component](https://ui.shadcn.com/docs/components/tabs) - Radix-based tabs with controlled state
- [Radix UI Tabs primitive](https://www.radix-ui.com/primitives/docs/components/tabs) - Underlying accessible tab implementation
- Existing codebase: `components/details/DetailCard.tsx`, `components/authority/SourceBadge.tsx`, `lib/db/queries/topics.ts`

### Secondary (MEDIUM confidence)

- [Next.js App Router search and pagination tutorial](https://nextjs.org/learn/dashboard-app/adding-search-and-pagination) - Official filtering pattern example
- [NN/G Breadcrumbs Guidelines](https://www.nngroup.com/articles/breadcrumbs/) - Hierarchical navigation best practices
- [BricxLabs Filter UI Patterns](https://bricxlabs.com/blogs/universal-search-and-filters-ui) - Modern filtering UX trends (2025)
- [Pencil & Paper Empty State UX](https://www.pencilandpaper.io/articles/empty-states) - Empty state best practices
- [Robin Wieruch Next.js Search Params guide](https://www.robinwieruch.de/next-search-params/) - URL state management patterns

### Tertiary (LOW confidence)

- [Aurora Scharff Advanced Search Param Filtering](https://aurorascharff.no/posts/managing-advanced-search-param-filtering-next-app-router/) - Blog post on complex filtering (not verified with official docs)
- [DEV Community: Radix Tabs URL-based](https://dev.to/yinks/how-to-make-radix-ui-tabs-url-based-in-nextjs-2nfn) - Community pattern (pre-App Router)

## Metadata

**Confidence breakdown:**
- Standard stack: **HIGH** - All components exist in codebase or official Next.js/shadcn docs
- Architecture patterns: **HIGH** - Based on existing category-client.tsx pattern + official Next.js App Router conventions
- Pitfalls: **MEDIUM** - Derived from common Next.js forum issues + existing codebase patterns
- COP section navigation: **LOW** - Limited information on how MRM COP section numbers map to RANZ content

**Research date:** 2026-02-01
**Valid until:** 2026-03-01 (30 days - stable domain, Next.js 14 patterns unlikely to change)

**Key assumptions:**
- Next.js 14 App Router conventions remain stable (no breaking changes in 14.x patch versions)
- Existing Phase 7 query functions (getDetailsByTopic) are correct and performant
- Phase 8 authority system components (SourceBadge, ContentCapabilityBadges) work as specified
- RANZ Guide content will use same topic mapping as MRM COP (via category_topics table)
