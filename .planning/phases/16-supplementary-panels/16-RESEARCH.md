# Phase 16: Supplementary Panels - Research

**Researched:** 2026-02-08
**Domain:** Inline collapsible UI, section-content linking, authority styling patterns
**Confidence:** HIGH

## Summary

This research investigated how to display supplementary content (3D models, case law, HTG guides) as inline collapsible panels within COP sections. The system needs to link COP sections to detail records via database relationships, render collapsible panels with visual distinction from authoritative content, and integrate with the existing SectionRenderer recursive component.

**Key findings:**
- Database schema already includes `cop_section_details` and `cop_section_htg` link tables for section-to-content relationships
- Existing authority styling system uses blue borders for authoritative MRM content and grey borders for supplementary content
- shadcn/ui Collapsible component is available but not yet installed (Radix UI primitive with accessibility built-in)
- Phase 13-02 found ZERO automatic section-detail links (COP narrative doesn't use explicit detail codes) — supplementary links will require manual curation
- Existing components provide patterns: Model3DViewer for 3D content, RelatedContentTab for detail cards, AuthoritativeContent/SupplementaryContent wrappers

**Primary recommendation:** Use shadcn/ui Collapsible component for panels (not Accordion — single panel per section), query `cop_section_details` and `cop_section_htg` tables to fetch linked content, wrap in SupplementaryContent component for grey border styling, and modify SectionRenderer to accept supplementary data as prop.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| shadcn/ui Collapsible | Latest | Expandable panels | Radix Dialog primitive, accessible (WAI-ARIA), keyboard support, data attributes for styling |
| Radix UI | 1.x | UI primitives | Already in project via shadcn/ui (Sheet, Dialog), consistent API |
| Drizzle ORM | Latest | Database queries | Project standard for PostgreSQL access |
| Next.js App Router | 14.2.35 | Server Components | Section data fetched server-side for optimal performance |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @react-three/fiber | ^8.15 | 3D model rendering | When displaying linked 3D models (Model3DViewer already exists) |
| Lucide icons | Latest | Chevron/Box icons | Panel trigger icons (ChevronDown, Box already used) |
| Tailwind CSS | 3.4.1 | Panel styling | Grey border, rounded corners, spacing |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Collapsible | Accordion | Accordion enforces mutually exclusive expansion (only one open at a time). Collapsible allows independent panel state, better for supplementary content that user may want to compare side-by-side. |
| Server Component queries | Client-side fetch | Client-side fetch adds loading states and waterfalls. Server queries provide data before render, simpler code. |
| Inline panels | Separate tabs | Separate tabs break reading flow. Inline panels keep narrative context while providing optional depth. |

**Installation:**
```bash
npx shadcn@latest add collapsible
```

## Architecture Patterns

### Recommended Component Structure
```
components/cop/
├── SectionRenderer.tsx       # Modified to accept supplementaryContent prop
├── SupplementaryPanel.tsx    # New: Collapsible wrapper with "Supplementary" label
├── SupplementaryDetail.tsx   # New: Renders linked detail card with 3D model
├── SupplementaryCaseLaw.tsx  # New: Renders linked failure case badge
└── ChapterContent.tsx        # Existing: May need supplementary data passed through
```

### Pattern 1: Server Component Data Fetching
**What:** Fetch supplementary links at page load server-side
**When to use:** COP section pages already Server Components, optimal performance
**Example:**
```typescript
// app/(dashboard)/cop/[chapterNumber]/page.tsx
import { db } from '@/lib/db';
import { copSectionDetails, copSectionHtg, details, htgContent } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

async function getSupplementaryContent(sectionIds: string[]) {
  // Fetch all linked details for sections
  const linkedDetails = await db
    .select({
      sectionId: copSectionDetails.sectionId,
      detail: details,
    })
    .from(copSectionDetails)
    .innerJoin(details, eq(copSectionDetails.detailId, details.id))
    .where(eq(copSectionDetails.sectionId, sectionIds));

  // Fetch all linked HTG guides
  const linkedHtg = await db
    .select({
      sectionId: copSectionHtg.sectionId,
      htg: htgContent,
    })
    .from(copSectionHtg)
    .innerJoin(htgContent, eq(copSectionHtg.htgId, htgContent.id))
    .where(eq(copSectionHtg.sectionId, sectionIds));

  // Group by section ID
  return { linkedDetails, linkedHtg };
}
```

**Rationale:** Single database query per content type, all sections fetched at once (no N+1 problem), data available before render (no loading states).

### Pattern 2: Collapsible Panel with Visual Distinction
**What:** Wrap supplementary content in Collapsible + SupplementaryContent styling
**When to use:** Every linked detail, case law, or HTG guide
**Example:**
```typescript
// components/cop/SupplementaryPanel.tsx
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { SupplementaryContent } from '@/components/authority';
import { ChevronDown, Info } from 'lucide-react';
import { useState } from 'react';

interface SupplementaryPanelProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function SupplementaryPanel({ title, children, defaultOpen = false }: SupplementaryPanelProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="my-4">
      <SupplementaryContent>
        <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 p-4 hover:bg-slate-100 transition-colors">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">Supplementary</span>
            <span className="text-sm text-slate-600">{title}</span>
          </div>
          <ChevronDown
            className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-4 pt-0">
            {children}
          </div>
        </CollapsibleContent>
      </SupplementaryContent>
    </Collapsible>
  );
}
```

**Rationale:** SupplementaryContent wrapper provides grey border (established pattern), Collapsible handles state, ChevronDown rotates to indicate open/closed state, "Supplementary" label provides visual distinction from authoritative content.

### Pattern 3: Recursive SectionRenderer with Supplementary Data
**What:** Modify SectionRenderer to check for supplementary content and render panels inline
**When to use:** Every section in COP reader
**Example:**
```typescript
// components/cop/SectionRenderer.tsx (modified)
interface SectionRendererProps {
  section: CopSection;
  chapterNumber: number;
  supplementaryContent?: Map<string, SupplementaryData>; // NEW
}

export function SectionRenderer({
  section,
  chapterNumber,
  supplementaryContent
}: SectionRendererProps) {
  const sectionId = `cop-${section.number}`; // Matches cop_sections.id format
  const supplements = supplementaryContent?.get(sectionId);

  return (
    <section id={`section-${section.number}`}>
      {/* Existing heading and content rendering */}

      {/* NEW: Supplementary panels */}
      {supplements?.details && supplements.details.length > 0 && (
        <SupplementaryPanel title="Related Installation Details">
          {supplements.details.map(detail => (
            <SupplementaryDetail key={detail.id} detail={detail} />
          ))}
        </SupplementaryPanel>
      )}

      {supplements?.caseLaw && supplements.caseLaw.length > 0 && (
        <SupplementaryPanel title="Related Failure Cases">
          {supplements.caseLaw.map(caseItem => (
            <SupplementaryCaseLaw key={caseItem.id} caseItem={caseItem} />
          ))}
        </SupplementaryPanel>
      )}

      {/* Existing images and subsections rendering */}
    </section>
  );
}
```

**Rationale:** Minimal changes to existing SectionRenderer, supplementary data passed as optional prop (doesn't break existing usage), section ID matches database format for lookups.

### Anti-Patterns to Avoid
- **Client-side data fetching in panels:** Causes waterfall loading (fetch chapter, then fetch supplements for each section). Fetch all supplementary data server-side upfront.
- **Accordion instead of Collapsible:** Accordion closes other panels when one opens. User may want to compare multiple supplementary items side-by-side.
- **No visual distinction:** Supplementary content must be visually distinct from authoritative MRM content. Always wrap in SupplementaryContent component.
- **Duplicate 3D model loading:** Model3DViewer already handles lazy loading and error states. Re-use this component, don't rebuild.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Collapsible panel component | Custom div + useState + CSS transitions | shadcn/ui Collapsible | Handles accessibility (ARIA attributes, keyboard support), smooth animations via Radix primitives, data attributes for styling |
| 3D model viewer | Custom Three.js scene | Model3DViewer component | Already handles lazy loading, error states, stage synchronization, camera controls, mobile gestures |
| Detail card layout | Custom HTML structure | RelatedContentTab component | Existing pattern with thumbnail, badges, description, action button — reusable for supplementary details |
| Authority styling | Custom CSS classes | AuthoritativeContent / SupplementaryContent | Consistent blue/grey border system already established, maintains visual language |
| Database queries | Raw SQL | Drizzle ORM queries | Type-safe, prevents SQL injection, consistent with project patterns |

**Key insight:** The app already has all the UI primitives needed (Model3DViewer, detail cards, authority wrappers). Phase 16 is primarily about data wiring and layout composition, not building new components from scratch.

## Common Pitfalls

### Pitfall 1: N+1 Query Problem
**What goes wrong:** Fetching supplementary content inside SectionRenderer creates N database queries (one per section)
**Why it happens:** Component doesn't have batch query context, queries on render
**How to avoid:** Fetch all supplementary content for all sections in one query at page level, pass data structure to SectionRenderer
**Warning signs:** Database connection pool exhaustion, slow page loads on chapters with many sections
**Verification:** Check database query logs — should see 2-3 queries per page load (one for details, one for HTG, one for failure cases), NOT one per section

### Pitfall 2: Zero Links Expected (Documented Issue)
**What goes wrong:** Developer assumes automatic linking will populate cop_section_details table
**Why it happens:** Phase 13-02 documented ZERO automatic detail code matches in COP narrative text
**How to avoid:** Accept that cop_section_details and cop_section_htg will be manually curated. Build UI to gracefully handle empty state (no panels when no links).
**Warning signs:** Empty supplementary panels on all sections
**Verification:** Check database: `SELECT COUNT(*) FROM cop_section_details;` — expect 0 rows initially

### Pitfall 3: Collapsible Breaks Server Component Boundary
**What goes wrong:** Collapsible requires client-side state (useState), but SectionRenderer is Server Component
**Why it happens:** shadcn/ui Collapsible requires 'use client' directive
**How to avoid:** Extract SupplementaryPanel as separate client component, keep SectionRenderer as Server Component that composes client components
**Warning signs:** Build error "useState can only be used in client components"
**Verification:** SectionRenderer.tsx should NOT have 'use client' directive at top

### Pitfall 4: Grey Border Doesn't Match Existing Pattern
**What goes wrong:** Custom styling on supplementary panels doesn't match SupplementaryContent grey border
**Why it happens:** Developer doesn't use existing SupplementaryContent wrapper component
**How to avoid:** Always wrap supplementary panels in `<SupplementaryContent>` component — provides consistent grey border, rounded corners, padding
**Warning signs:** Visual inconsistency with existing detail page supplementary content tabs
**Verification:** Inspect element — should see `border-l-4 border-slate-300 bg-slate-50` classes (from SupplementaryContent component)

### Pitfall 5: Panel Collapsed State Not Persisted
**What goes wrong:** User expands panel, navigates away, returns to section — panel is collapsed again
**Why it happens:** defaultOpen={false} means panel always starts collapsed
**How to avoid:** This is acceptable behavior for MVP (Phase 16). Panel persistence requires localStorage or URL state (deferred to future phase).
**Warning signs:** User feedback about "losing progress" when navigating
**Verification:** Expand panel, navigate to different chapter, return — panel should be collapsed (expected behavior)

### Pitfall 6: 3D Model Performance Issue
**What goes wrong:** Multiple 3D models on same page cause performance degradation
**Why it happens:** Model3DViewer loads Three.js canvas for each model (heavy resource usage)
**How to avoid:** Panels are collapsed by default (models not rendered until expanded). Lazy load models only when panel opens (React.lazy or dynamic import).
**Warning signs:** Slow scrolling, high CPU usage on chapter pages with multiple linked details
**Verification:** Check browser DevTools Performance tab — Three.js rendering should only start when panel expands

## Code Examples

Verified patterns from existing codebase:

### Existing Authority Styling Pattern
```typescript
// Source: components/authority/AuthoritativeContent.tsx
// Blue border for authoritative MRM content
<div className="relative rounded-lg border-l-4 border-primary bg-primary/5 p-4">
  {children}
</div>

// Source: components/authority/SupplementaryContent.tsx
// Grey border for supplementary content
<div className="relative rounded-lg border-l-4 border-slate-300 bg-slate-50 p-4">
  {children}
</div>
```

### Existing Model3DViewer Usage
```typescript
// Source: components/details/DetailViewer.tsx (similar pattern)
import { Model3DViewer } from '@/components/details/Model3DViewer';

<Model3DViewer
  modelUrl={detail.modelUrl}
  detailCode={detail.code}
  thumbnailUrl={detail.thumbnailUrl}
  activeStep={activeStep}
  stageMetadata={stageMetadata}
  onStepChange={handleStepChange}
/>
```

### Existing Detail Card Pattern
```typescript
// Source: components/details/RelatedContentTab.tsx
// Reusable pattern for displaying linked detail cards
<Card key={linked.id} className="hover:border-slate-300 transition-colors">
  <CardContent className="p-4">
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <SourceBadge
          shortName={linked.sourceName || 'RANZ'}
          authority="supplementary"
          size="sm"
        />
        <h4 className="font-semibold mt-2 text-slate-900">{linked.name}</h4>
        {linked.description && (
          <p className="text-sm text-slate-600 mt-1 line-clamp-2">
            {linked.description}
          </p>
        )}
        {linked.modelUrl && (
          <Badge variant="outline" className="mt-2">
            <Box className="h-3 w-3 mr-1" />
            3D Model Available
          </Badge>
        )}
      </div>
      <Link href={`/detail/${linked.id}`}>
        <Button variant="outline" size="sm" className="flex-shrink-0">
          View Guide
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </Link>
    </div>
  </CardContent>
</Card>
```

### Database Schema for Section Links
```typescript
// Source: lib/db/schema.ts
// cop_section_details links COP sections to detail records
export const copSectionDetails = pgTable('cop_section_details', {
  sectionId: text('section_id').references(() => copSections.id, { onDelete: 'cascade' }).notNull(),
  detailId: text('detail_id').references(() => details.id, { onDelete: 'cascade' }).notNull(),
  relationshipType: text('relationship_type').notNull(), // 'referenced', 'illustrates', 'alternative'
  notes: text('notes'),
}, (table) => ({
  pk: primaryKey({ columns: [table.sectionId, table.detailId] }),
  sectionIdx: index('idx_cop_section_details_section').on(table.sectionId),
  detailIdx: index('idx_cop_section_details_detail').on(table.detailId),
}));

// cop_section_htg links COP sections to HTG guides
export const copSectionHtg = pgTable('cop_section_htg', {
  sectionId: text('section_id').references(() => copSections.id, { onDelete: 'cascade' }).notNull(),
  htgId: text('htg_id').references(() => htgContent.id, { onDelete: 'cascade' }).notNull(),
  relevance: text('relevance'), // 'primary', 'supplementary'
  notes: text('notes'),
}, (table) => ({
  pk: primaryKey({ columns: [table.sectionId, table.htgId] }),
}));
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate tabs for related content | Inline collapsible panels | Phase 16 (2026-02) | Context preserved during reading, no navigation required |
| Client-side accordion libraries (react-collapse, etc.) | Radix UI primitives via shadcn/ui | shadcn/ui adoption (2025) | Better accessibility, consistent with project UI primitives |
| Custom collapse animations | CSS variables + data attributes | Radix UI best practices | Smoother animations, less JavaScript, easier to theme |
| Section-detail linking via regex | Manual curation in database | Phase 13-02 findings | More accurate links, no false positives from automated matching |

**Deprecated/outdated:**
- react-collapse library: Replaced by Radix Collapsible primitive (better accessibility, smaller bundle)
- Bootstrap collapse: Not compatible with Tailwind-first approach
- Custom useToggle hooks: Radix handles state management internally

## Open Questions

Things that couldn't be fully resolved:

1. **Manual Link Curation Workflow**
   - What we know: cop_section_details and cop_section_htg tables exist, Phase 13-02 documented zero automatic links
   - What's unclear: What admin UI exists for creating these links? Is there a bulk import script? Who curates the links?
   - Recommendation: Build UI to handle empty state gracefully. Phase 16 can ship without links populated. Admin curation UI is likely Phase 17+ scope.

2. **Multiple Supplementary Items Per Section**
   - What we know: A section could link to multiple details, multiple case law items, and multiple HTG guides
   - What's unclear: Should each type have its own collapsible panel? Or one panel with tabs inside?
   - Recommendation: One panel per content type (e.g., "Related Installation Details", "Related Failure Cases", "Related HTG Guides"). User can expand all simultaneously to compare.

3. **3D Model Loading Strategy**
   - What we know: Model3DViewer component exists, handles lazy loading
   - What's unclear: Should models load when panel opens, or only when model viewer scrolls into viewport?
   - Recommendation: Load when panel opens (simpler, user explicitly requested content). Further lazy loading can be added if performance issues arise.

4. **Failure Case Data Structure**
   - What we know: failureCases table exists with fields like caseId, summary, outcome, pdfUrl
   - What's unclear: Does SupplementaryCaseLaw component need to be built from scratch, or does an existing component handle case law badges?
   - Recommendation: Check components/warnings or components/details for existing case law rendering. If none exists, create simple badge component with case ID, outcome, and "View Details" link.

## Sources

### Primary (HIGH confidence)
- Codebase: components/authority/AuthoritativeContent.tsx, SupplementaryContent.tsx
- Codebase: components/details/Model3DViewer.tsx (942 lines, full 3D viewer with stage sync)
- Codebase: components/details/RelatedContentTab.tsx (existing detail card pattern)
- Codebase: components/cop/SectionRenderer.tsx (recursive section rendering)
- Database schema: lib/db/schema.ts (cop_section_details, cop_section_htg tables)
- Phase 13-02 findings: .planning/phases/13-data-foundation/13-02-PLAN.md (zero automatic links documented)
- Phase 15 verification: .planning/phases/15-navigation-chrome/15-VERIFY.md (TOC sidebar pattern)

### Secondary (MEDIUM confidence)
- [shadcn/ui Collapsible component](https://ui.shadcn.com/docs/components/radix/collapsible) — Installation and usage examples
- [Radix UI Collapsible API](https://www.radix-ui.com/primitives/docs/components/collapsible) — Props, data attributes, accessibility features
- [shadcn/ui Accordion component](https://ui.shadcn.com/docs/components/radix/accordion) — Comparison with Collapsible (why Collapsible is better for supplementary panels)

### Tertiary (LOW confidence)
- None — all findings verified against codebase or official documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - shadcn/ui Collapsible is documented, Radix UI already in project, established patterns observed
- Architecture: HIGH - SectionRenderer pattern exists, authority styling wrappers exist, database schema confirmed
- Pitfalls: HIGH - N+1 query problem is well-documented, Phase 13-02 explicitly documents zero automatic links, client/server boundary is established Next.js pattern

**Research date:** 2026-02-08
**Valid until:** 30 days for stable patterns (shadcn/ui Collapsible API, database schema), 7 days for fast-moving areas (admin UI for link curation)
