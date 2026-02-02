# Phase 10: Detail Page Enhancement - Research

**Researched:** 2026-02-02
**Domain:** React content composition, image galleries, dynamic UI
**Confidence:** HIGH

## Summary

Phase 10 requires composing detail pages from multiple linked content sources, displaying MRM technical images in gallery format, showing cross-source related content in a dedicated tab, and dynamically revealing/hiding content sections based on data availability. This is a content composition and dynamic UI challenge rather than a library selection problem.

The existing architecture already has the foundation in place:
- `detailLinks` table with bidirectional relationships (primary/supplementary)
- `getDetailWithLinks()` query that fetches both directions
- Authority-aware styling components (`AuthoritativeContent`, `SupplementaryContent`)
- Radix UI tabs (via shadcn/ui) for tabbed interfaces
- Cloudflare R2 storage with MRM images already uploaded

The research reveals this is primarily about **orchestrating existing pieces** rather than introducing new libraries. The key challenges are conditional rendering patterns, image gallery UX, and content attribution clarity.

**Primary recommendation:** Use existing shadcn/ui Dialog for image lightbox, conditional tab rendering with guard patterns, and composition via linked detail queries. No new dependencies needed.

## Standard Stack

### Core (Already Established)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Radix UI Tabs | Current | Tabbed interfaces | Already via shadcn/ui, accessible by default |
| shadcn/ui Dialog | Current | Image lightbox modal | Natural extension of existing UI kit |
| Next.js Image | 14.x | Responsive images | Built-in optimization, gallery support |
| Drizzle ORM | Current | Linked detail queries | Already fetching relationships |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-medium-image-zoom | 5.x | Click-to-zoom images | If Dialog approach feels heavy |
| yet-another-react-lightbox | 3.x | Full-featured gallery | If need swipe/keyboard navigation |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| shadcn Dialog | react-image-lightbox | More features but heavier bundle, maintenance ceased |
| Custom composition | Contentful/Strapi | Overkill - not a CMS problem, just linked data |
| Full gallery lib | Dialog + Next Image | Libraries add 50KB+ for features already possible |

**Installation:**
```bash
# No new dependencies required - use existing shadcn/ui
# If adding image zoom enhancement:
npm install react-medium-image-zoom
```

## Architecture Patterns

### Recommended Project Structure
```
components/
├── details/
│   ├── DetailViewer.tsx              # Main container (already exists)
│   ├── ImageGallery.tsx              # NEW: MRM technical images
│   ├── ImageLightbox.tsx             # NEW: Full-screen image viewer
│   ├── LinkedContentSection.tsx      # NEW: Related tab content
│   └── ConditionalTabs.tsx           # NEW: Dynamic tab visibility
lib/
├── db/
│   └── queries/
│       └── detail-links.ts           # Already exists - use getDetailWithLinks()
└── utils/
    └── content-composition.ts        # NEW: Helpers for merging linked content
```

### Pattern 1: Conditional Tab Rendering

**What:** Only render tabs when content exists, hide empty sections
**When to use:** Every detail page (varies by source and linkage)

**Example:**
```typescript
// Source: React conditional rendering best practices 2026
interface TabConfig {
  id: string;
  label: string;
  icon: React.ComponentType;
  content: React.ReactNode;
  show: boolean; // Derived from data presence
}

const tabs: TabConfig[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: FileText,
    content: <OverviewTab {...detail} />,
    show: true, // Always show
  },
  {
    id: 'images',
    label: 'Technical Images',
    icon: Image,
    content: <ImageGallery images={detail.images} />,
    show: detail.images && detail.images.length > 0,
  },
  {
    id: 'installation',
    label: 'Installation',
    icon: Wrench,
    content: <StepByStep steps={detail.steps} />,
    show: detail.steps && detail.steps.length > 0,
  },
  {
    id: 'related',
    label: 'Related Content',
    icon: Link2,
    content: <LinkedContentSection supplements={detail.supplements} />,
    show: (detail.supplements?.length ?? 0) > 0 || (detail.supplementsTo?.length ?? 0) > 0,
  },
].filter(tab => tab.show); // Guard pattern - filter before render

return (
  <Tabs defaultValue={tabs[0]?.id}>
    <TabsList>
      {tabs.map(tab => (
        <TabsTrigger key={tab.id} value={tab.id}>
          <tab.icon className="h-4 w-4 mr-2" />
          {tab.label}
        </TabsTrigger>
      ))}
    </TabsList>
    {tabs.map(tab => (
      <TabsContent key={tab.id} value={tab.id}>
        {tab.content}
      </TabsContent>
    ))}
  </Tabs>
);
```

### Pattern 2: Image Gallery with Lightbox

**What:** Grid of thumbnails that open full-size in modal
**When to use:** MRM details with technical images array

**Example:**
```typescript
// Source: shadcn/ui Dialog + Next.js Image optimization patterns
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { getPublicUrl } from '@/lib/storage';

interface ImageGalleryProps {
  images: string[]; // R2 keys from detail.images
  detailCode: string;
}

export function ImageGallery({ images, detailCode }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!images || images.length === 0) return null;

  return (
    <div>
      {/* Grid of thumbnails */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((imageKey, index) => (
          <Dialog key={imageKey}>
            <DialogTrigger asChild>
              <button
                onClick={() => setSelectedIndex(index)}
                className="relative aspect-video rounded-lg overflow-hidden border hover:border-primary transition-colors"
              >
                <Image
                  src={getPublicUrl(imageKey)}
                  alt={`${detailCode} technical detail ${index + 1}`}
                  fill
                  sizes="(max-width: 768px) 50vw, 33vw"
                  className="object-cover"
                />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <div className="relative w-full h-[80vh]">
                <Image
                  src={getPublicUrl(images[selectedIndex])}
                  alt={`${detailCode} technical detail ${selectedIndex + 1}`}
                  fill
                  sizes="90vw"
                  className="object-contain"
                  priority
                />
              </div>
            </DialogContent>
          </Dialog>
        ))}
      </div>
    </div>
  );
}
```

### Pattern 3: Content Composition with Attribution

**What:** Merge linked content while showing source attribution
**When to use:** MRM detail linked to RANZ guide (primary shows supplementary)

**Example:**
```typescript
// Source: React composition patterns for linked data 2026
interface LinkedContentSectionProps {
  detail: DetailWithLinks;
}

export function LinkedContentSection({ detail }: LinkedContentSectionProps) {
  const { supplements, supplementsTo } = detail;
  const hasLinkedContent = (supplements?.length ?? 0) > 0 || (supplementsTo?.length ?? 0) > 0;

  if (!hasLinkedContent) return null;

  return (
    <div className="space-y-6">
      {/* Supplementary content (e.g., RANZ guides for this MRM detail) */}
      {supplements && supplements.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">
            Installation Guides & Supplements
          </h3>
          <div className="grid gap-4">
            {supplements.map(linked => (
              <Card key={linked.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <SourceBadge
                        shortName={linked.sourceName || 'RANZ'}
                        authority="supplementary"
                        size="sm"
                      />
                      <h4 className="font-semibold mt-2">{linked.name}</h4>
                      {linked.description && (
                        <p className="text-sm text-slate-600 mt-1">
                          {linked.description}
                        </p>
                      )}
                      {linked.modelUrl && (
                        <Badge variant="outline" className="mt-2">
                          <Cube className="h-3 w-3 mr-1" />
                          3D Model Available
                        </Badge>
                      )}
                    </div>
                    <Link href={`/detail/${linked.id}`}>
                      <Button variant="outline" size="sm">
                        View Guide
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Primary content (e.g., MRM specs that this RANZ guide supports) */}
      {supplementsTo && supplementsTo.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">
            Related Specifications
          </h3>
          <div className="grid gap-4">
            {supplementsTo.map(linked => (
              <Card key={linked.id} className="border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <SourceBadge
                        shortName={linked.sourceName || 'MRM'}
                        authority="authoritative"
                        size="sm"
                      />
                      <h4 className="font-semibold mt-2">{linked.name}</h4>
                      {linked.description && (
                        <p className="text-sm text-slate-600 mt-1">
                          {linked.description}
                        </p>
                      )}
                    </div>
                    <Link href={`/detail/${linked.id}`}>
                      <Button variant="outline" size="sm">
                        View Spec
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

### Pattern 4: Integrated Linked Content (DETAIL-01)

**What:** When MRM detail has linked RANZ guide, show RANZ 3D/steps in MRM page
**When to use:** Primary (MRM) detail with supplementary (RANZ) linked

**Example:**
```typescript
// Source: React composition via render props pattern
interface DetailViewerProps {
  detail: DetailWithLinks;
}

export function DetailViewer({ detail }: DetailViewerProps) {
  // Find first linked RANZ guide with 3D model
  const linkedGuide = detail.supplements?.find(s => s.modelUrl !== null);

  // Use MRM content as primary, fallback to linked RANZ for 3D/steps
  const display3DModel = detail.modelUrl || linkedGuide?.modelUrl;
  const displaySteps = detail.steps?.length > 0 ? detail.steps : linkedGuide?.steps;

  return (
    <div className="space-y-6">
      {/* 3D Model - show source attribution if from linked content */}
      {display3DModel && (
        <div>
          {linkedGuide && !detail.modelUrl && (
            <SourceAttribution
              shortName="RANZ"
              name="RANZ Installation Guide"
              authority="supplementary"
              note="3D model provided by linked installation guide"
            />
          )}
          <Model3DViewer modelUrl={display3DModel} />
        </div>
      )}

      {/* Steps - show source attribution if from linked content */}
      {displaySteps && displaySteps.length > 0 && (
        <div>
          {linkedGuide && detail.steps?.length === 0 && (
            <SourceAttribution
              shortName="RANZ"
              name="RANZ Installation Guide"
              authority="supplementary"
              note="Installation steps from linked guide"
            />
          )}
          <StepByStep steps={displaySteps} />
        </div>
      )}

      {/* Link to full guide if content was borrowed */}
      {linkedGuide && (
        <Card className="border-slate-200 bg-slate-50">
          <CardContent className="p-4">
            <p className="text-sm text-slate-700">
              Complete installation guidance available in the linked guide:
            </p>
            <Link href={`/detail/${linkedGuide.id}`}>
              <Button variant="link" className="p-0 h-auto">
                {linkedGuide.name}
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

### Anti-Patterns to Avoid

- **Rendering all tabs always:** Creates empty tab bodies, confusing UX. Filter tabs array before rendering.
- **No source attribution:** User won't know MRM spec borrowed RANZ 3D model. Always show `<SourceAttribution>` when mixing content.
- **Thumbnail-only images:** MRM images are technical diagrams needing zoom. Must have lightbox/full-size view.
- **Hard-coded tab order:** Tabs should derive from data presence. `tabs.filter(t => t.show)` pattern.
- **Loading all images upfront:** Use Next.js Image lazy loading. Only priority load first image in gallery.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image lightbox | Custom modal with pan/zoom | shadcn Dialog + Next Image | Dialog handles focus trap, ESC key, backdrop. Next Image handles responsive srcset. |
| Conditional tabs | Complex state management | Array.filter() before render | Declarative, testable, no state bugs. React re-renders naturally when data changes. |
| Image optimization | Manual srcset generation | Next.js Image component | Handles device pixel ratio, WebP/AVIF, lazy loading, blur placeholder automatically. |
| Content merging | Redux/Context for linked data | Query-time composition | Simpler - `getDetailWithLinks()` returns complete graph. No client state complexity. |

**Key insight:** React's conditional rendering (filter/map) is sufficient for dynamic tabs. Don't reach for state management or render prop complexity when simple boolean checks work.

## Common Pitfalls

### Pitfall 1: Rendering `0` Instead of Nothing

**What goes wrong:** Writing `{images.length && <Gallery />}` renders the number `0` when empty
**Why it happens:** In JavaScript, `0 && <Component>` evaluates to `0` (falsy but renderable)
**How to avoid:** Use `images.length > 0 && <Gallery />` or `images?.length ? <Gallery /> : null`
**Warning signs:** Seeing literal "0" appear in UI when data is empty

### Pitfall 2: Tabs Without Keys in Dynamic Lists

**What goes wrong:** Tab state resets when data changes or tabs reorder
**Why it happens:** React can't track which tab is which without stable keys
**How to avoid:** Use data-derived keys (`tab.id`), not array indices
**Warning signs:** Clicking tab briefly shows content then resets to first tab

### Pitfall 3: Missing Image Sizes Attribute

**What goes wrong:** Next.js loads overly large images, slow gallery
**Why it happens:** Without `sizes`, browser assumes 100vw (full width)
**How to avoid:** Set `sizes="(max-width: 768px) 50vw, 33vw"` for grid layouts
**Warning signs:** Network tab shows 2000px images downloading for 300px thumbnails

### Pitfall 4: Circular Attribution Display

**What goes wrong:** MRM detail showing "from RANZ" which shows "from MRM" in infinite loop
**Why it happens:** Bidirectional links rendered without direction awareness
**How to avoid:** Only show attribution when content is **borrowed** (primary showing supplementary's content). Don't show attribution for mere links.
**Warning signs:** "Source: X" appears when viewing X's own content

### Pitfall 5: Gallery Dialog Without Close Button

**What goes wrong:** Mobile users can't close full-screen image (ESC key not obvious)
**Why it happens:** Relying only on shadcn Dialog's default close (small X in corner)
**How to avoid:** Add explicit "Close" button in DialogContent footer or larger tap target
**Warning signs:** User testing reveals confusion about how to exit lightbox on mobile

### Pitfall 6: Not Handling Missing Thumbnails

**What goes wrong:** MRM details without `thumbnailUrl` show broken image or placeholder icon
**Why it happens:** Assuming all details have thumbnails (MRM seed data is incomplete)
**How to avoid:** Use `detail.images[0]` as fallback thumbnail if `thumbnailUrl` is null
**Warning signs:** Cards show FileText icon when technical image exists in detail.images array

## Code Examples

Verified patterns from existing codebase:

### Existing Query Pattern (Use This)

```typescript
// Source: lib/db/queries/detail-links.ts (already implemented)
import { getDetailWithLinks } from '@/lib/db/queries/detail-links';

// Fetches detail with supplements (outbound) and supplementsTo (inbound)
const detailWithLinks = await getDetailWithLinks(detailId);

// detailWithLinks.supplements = RANZ guides linked to this MRM spec
// detailWithLinks.supplementsTo = MRM specs this RANZ guide supports
```

### Authority-Aware Styling (Already Exists)

```typescript
// Source: components/details/DetailViewer.tsx (line 131-144)
import { AuthoritativeContent, SupplementaryContent } from '@/components/authority';
import { getAuthorityLevel } from '@/lib/constants';

const authority = getAuthorityLevel(detail.sourceId);
const isAuthoritative = authority === 'authoritative';

const ContentWrapper = ({ children }: { children: React.ReactNode }) => {
  if (isAuthoritative) {
    return <AuthoritativeContent>{children}</AuthoritativeContent>;
  }
  return <SupplementaryContent>{children}</SupplementaryContent>;
};

// Use in tabs:
<TabsContent value="installation">
  <ContentWrapper>
    <StepByStep steps={steps} />
  </ContentWrapper>
</TabsContent>
```

### Next.js Image for Gallery Thumbnails

```typescript
// Source: Next.js 14 Image optimization best practices
import Image from 'next/image';
import { getPublicUrl } from '@/lib/storage';

<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
  {detail.images.map((imageKey, index) => (
    <button
      key={imageKey}
      onClick={() => openLightbox(index)}
      className="relative aspect-video rounded-lg overflow-hidden"
    >
      <Image
        src={getPublicUrl(imageKey)}
        alt={`${detail.code} detail ${index + 1}`}
        fill
        sizes="(max-width: 768px) 50vw, 33vw"
        className="object-cover hover:scale-105 transition-transform"
      />
    </button>
  ))}
</div>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-image-lightbox | shadcn Dialog + Next Image | 2024 | Maintenance ceased on old library, shadcn approach is lighter |
| Static tab lists | Conditional rendering | 2025-2026 | Dynamic UX based on data, no empty tabs |
| Separate gallery libraries | Next.js Image component | Next.js 13+ | Built-in optimization, no external dependency |
| Client-side image optimization | Server-side image generation | Next.js 14 | Automatic WebP/AVIF, responsive srcset |

**Deprecated/outdated:**
- **react-image-lightbox**: No longer maintained (last update 2021), use shadcn Dialog or yet-another-react-lightbox
- **react-photoswipe-gallery**: Maintenance uncertain, lighter alternatives exist
- **Manual srcset generation**: Next.js Image handles this automatically in 2026

## Open Questions

### 1. Navigation Between Gallery Images

**What we know:** Dialog pattern shows one image at a time, requires closing to see next
**What's unclear:** Should gallery support left/right arrows to navigate between images without closing?
**Recommendation:** Start with single-image Dialog (simpler). Add navigation arrows in Phase 11 polish if users request it. Most technical diagrams are viewed independently, not as sequence.

### 2. Image Zoom Level for Technical Diagrams

**What we know:** Technical diagrams may have fine text/dimensions
**What's unclear:** Do we need pinch-to-zoom or is full-size sufficient?
**Recommendation:** Use `object-contain` in Dialog so full image fits screen. If user feedback indicates need, add `react-medium-image-zoom` (8KB) for click-to-zoom-further. Test with actual MRM images first.

### 3. Thumbnail Generation for Existing MRM Images

**What we know:** MRM details have `images[]` array but not all have `thumbnailUrl`
**What's unclear:** Should we generate thumbnails server-side or use Next.js Image dynamic resizing?
**Recommendation:** Use Next.js Image with `sizes` attribute - no pre-generation needed. R2 + Next.js handles resizing automatically. Set `quality={80}` for technical diagrams (default 75 may blur text).

### 4. Multiple RANZ Guides for One MRM Detail

**What we know:** Schema supports one MRM detail linking to multiple RANZ guides
**What's unclear:** How to choose which 3D model/steps to show on MRM page if multiple exist?
**Recommendation:** Show first linked guide's content, display others in "Related" tab. Later add preference/ranking (e.g., "Primary Guide" flag in detailLinks).

## Sources

### Primary (HIGH confidence)

- [shadcn/ui Dialog Component](https://ui.shadcn.com/docs/components/dialog) - Official component documentation
- [shadcn/ui Image Zoom Pattern](https://www.shadcn.io/components/image/image-zoom) - Click-to-zoom implementation
- [Next.js 14 Image Optimization](https://nextjs.org/docs/14/app/building-your-application/optimizing/images) - Official optimization guide
- [Next.js Image Component API](https://nextjs.org/docs/app/api-reference/components/image) - Component reference
- Existing codebase: `lib/db/queries/detail-links.ts`, `components/details/DetailViewer.tsx`

### Secondary (MEDIUM confidence)

- [React Conditional Rendering Best Practices](https://react.dev/learn/conditional-rendering) - Official React docs
- [Yet Another React Lightbox](https://yet-another-react-lightbox.com/) - Modern alternative if Dialog insufficient
- [react-medium-image-zoom](https://github.com/rpearce/react-medium-image-zoom) - Medium.com-style zoom (lightweight)
- [React Tab Patterns 2026](https://sandroroth.com/blog/react-tabs-component/) - Dynamic tab implementations
- [React Composition Patterns](https://frontendmastery.com/posts/advanced-react-component-composition-guide/) - Content composition strategies

### Tertiary (LOW confidence - requires verification)

- [Syncfusion React Image Editor](https://www.syncfusion.com/react-components/react-image-editor) - If annotations needed (commercial license required)
- [PhotoSwipe React](https://photoswipe.com/react-image-gallery/) - Full-featured gallery (may be overkill)
- WebSearch results on content aggregation patterns (general principles, not React-specific implementations)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing shadcn/ui and Next.js, no new libraries needed
- Architecture: HIGH - Patterns verified in existing codebase (DetailViewer, authority styling)
- Pitfalls: HIGH - Next.js Image `sizes` pitfall is documented in official docs, conditional rendering `0` is well-known React gotcha
- Integration approach: HIGH - `getDetailWithLinks()` already exists and returns required data structure

**Research date:** 2026-02-02
**Valid until:** 60 days (stable APIs - Next.js 14, Radix UI)

**Dependencies:**
- No new npm packages required
- Optional: `react-medium-image-zoom` if enhanced zoom needed after user testing (defer to Phase 11)

**Key Architectural Decision:**
This phase is about **orchestration, not introduction**. All required primitives exist:
- Linked detail queries (detailLinks table, getDetailWithLinks)
- Authority styling (AuthoritativeContent components)
- Tabbed UI (Radix via shadcn)
- Image storage (R2 with MRM images uploaded)
- Responsive images (Next.js Image)

Success depends on **composition patterns** (conditional rendering, content merging with attribution) rather than technology selection.
