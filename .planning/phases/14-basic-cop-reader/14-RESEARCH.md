# Phase 14: Basic COP Reader - Research

**Researched:** 2026-02-08
**Domain:** Content rendering, Next.js App Router, JSON-based static content
**Confidence:** HIGH

## Summary

This research investigated how to build a COP (Code of Practice) Reader that displays 19 chapters of technical content as scrollable rich text. The reader needs to render plain text content with proper hierarchy, display inline images from Cloudflare R2, and provide a chapter grid listing.

**Key findings:**
- COP content already exists as 19 per-chapter JSON files in `/public/cop/` (3.7MB total)
- Content is plain text with section numbers, titles, and embedded PDF page references
- App follows established patterns: Card-based grids, Server Components, loading skeletons
- Images stored in R2 with `getPublicUrl()` helper for Next.js Image component
- Typography uses Tailwind utility classes with shadcn/ui components

**Primary recommendation:** Use Server Components for `/cop` chapter grid and `/cop/[chapterNumber]` reader pages. Render content with `white-space: pre-line` CSS for line breaks. Fetch chapter JSON from public directory server-side. Re-use existing Card, Badge, and Skeleton patterns.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 14.2.35 | App Router framework | Project standard, App Router only |
| React | 18.3.1 | UI rendering | Next.js dependency |
| Tailwind CSS | 3.4.1 | Styling | Project standard, utility-first |
| shadcn/ui | Latest | Component library | Provides Card, Badge, Skeleton |
| TypeScript | 5.x | Type safety | Project standard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Lucide React | 0.563.0 | Icons | Chapter grid icons, UI elements |
| next/image | (built-in) | Image optimization | Inline COP images from R2 |
| Clerk | 6.12.0 | Authentication | Already configured, all routes protected |
| clsx + tailwind-merge | 2.1.1, 3.4.0 | Conditional classes | `cn()` utility (project convention) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Plain text rendering | HTML sanitization (DOMPurify) | Content is plain text, sanitization unnecessary |
| Client Components | Server Components | Server Components preferred (project rule) |
| Dynamic routes | Static generation | Content rarely changes, but force-dynamic acceptable |

**Installation:**
No new packages required. All dependencies already installed.

## Architecture Patterns

### Recommended Project Structure
```
app/
├── (dashboard)/
│   ├── cop/
│   │   ├── page.tsx                    # Chapter grid (Server Component)
│   │   ├── loading.tsx                 # Grid loading skeleton
│   │   ├── [chapterNumber]/
│   │   │   ├── page.tsx                # Chapter reader (Server Component)
│   │   │   └── loading.tsx             # Reader loading skeleton
│   └── layout.tsx                      # Already wraps with auth + nav
public/
└── cop/
    ├── chapter-1.json                  # Existing (57KB)
    ├── chapter-2.json                  # Existing (218KB)
    └── ...                             # 19 files total
```

### Pattern 1: Server Component Chapter Grid

**What:** Server Component that lists all 19 chapters with metadata
**When to use:** `/cop` route - chapter listing page
**Example:**

```typescript
// app/(dashboard)/cop/page.tsx
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

// Read chapter metadata from JSON files server-side
async function getChapterMetadata() {
  const chapters = [];
  for (let i = 1; i <= 19; i++) {
    const data = await import(`@/public/cop/chapter-${i}.json`);
    chapters.push({
      chapterNumber: data.chapterNumber,
      title: data.title,
      sectionCount: data.sectionCount,
    });
  }
  return chapters;
}

export default async function COPIndexPage() {
  const chapters = await getChapterMetadata();

  return (
    <div className="container max-w-6xl p-4 md:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
          Code of Practice
        </h1>
        <p className="mt-2 text-slate-600">
          Browse all 19 COP chapters
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {chapters.map((chapter) => (
          <Link key={chapter.chapterNumber} href={`/cop/${chapter.chapterNumber}`}>
            <Card className="cursor-pointer hover:shadow-lg">
              <CardHeader>
                <Badge variant="secondary">Chapter {chapter.chapterNumber}</Badge>
                <CardTitle>{chapter.title}</CardTitle>
                <CardDescription>{chapter.sectionCount} sections</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

### Pattern 2: Plain Text Content Rendering

**What:** Render multi-paragraph plain text with preserved line breaks
**When to use:** Displaying COP section content from JSON
**Example:**

```typescript
// Use white-space: pre-line to preserve line breaks
<div className="prose max-w-none">
  <div className="whitespace-pre-line text-slate-700 leading-relaxed">
    {section.content}
  </div>
</div>
```

**Alternative with split:**

```typescript
// Split by double newline for paragraph separation
{section.content.split('\n\n').map((para, i) => (
  <p key={i} className="mb-4 text-slate-700 leading-relaxed">
    {para}
  </p>
))}
```

**Recommendation:** Use `whitespace-pre-line` for simplicity. Content already has proper line breaks.

### Pattern 3: Recursive Section Rendering

**What:** Render nested section hierarchy with proper heading levels
**When to use:** Displaying chapter sections with subsections
**Example:**

```typescript
interface Section {
  number: string;
  title: string;
  level: number;
  content: string;
  subsections?: Section[];
}

function SectionRenderer({ section }: { section: Section }) {
  const HeadingTag = `h${Math.min(section.level + 1, 6)}` as keyof JSX.IntrinsicElements;

  return (
    <section id={`section-${section.number}`} className="mb-8">
      <HeadingTag className="font-bold text-slate-900 mb-4">
        {section.number} {section.title}
      </HeadingTag>

      <div className="whitespace-pre-line text-slate-700 leading-relaxed mb-6">
        {section.content}
      </div>

      {section.subsections?.map(sub => (
        <SectionRenderer key={sub.number} section={sub} />
      ))}
    </section>
  );
}
```

### Pattern 4: Loading Skeleton for Chapter Grid

**What:** Consistent loading state matching planner page pattern
**When to use:** `app/(dashboard)/cop/loading.tsx`
**Example:**

```typescript
// Follows existing pattern from app/(dashboard)/planner/loading.tsx
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export default function COPLoading() {
  return (
    <div className="container max-w-6xl p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

### Anti-Patterns to Avoid

- **Don't use Client Components unnecessarily:** COP reader is static content, Server Components are faster
- **Don't fetch JSON client-side:** Import directly in Server Component or use `fs.readFileSync` for more control
- **Don't render raw HTML without sanitization:** Content is plain text, keep it that way
- **Don't skip auth:** All routes under `(dashboard)` layout are protected by Clerk

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Card grid layout | Custom grid components | Existing Card + grid patterns from `/planner` | Already established, responsive, accessible |
| Loading skeletons | Custom shimmer effects | Skeleton component from shadcn/ui | Consistent with app, 48px touch targets |
| Image optimization | Raw `<img>` tags | Next.js Image component with `getPublicUrl()` | Automatic optimization, lazy loading, R2 integration exists |
| Conditional styling | Inline style objects | `cn()` utility (clsx + tailwind-merge) | Project convention, better IntelliSense |
| Route auth | Custom auth checks | Existing `(dashboard)` layout | Already wraps with Clerk auth + redirect |

**Key insight:** The app already has patterns for every UI element needed. Copy existing patterns from `/planner` pages rather than creating new components.

## Common Pitfalls

### Pitfall 1: JSON Import in Client Components

**What goes wrong:** Attempting to import `/public/cop/chapter-X.json` in a Client Component fails at build time
**Why it happens:** Next.js can't statically import JSON in Client Components
**How to avoid:**
- Use Server Components for pages that load chapter JSON
- If Client Component needed, fetch via API route or pass as prop from Server Component
- For static data, prefer Server Component import: `await import('@/public/cop/chapter-1.json')`

**Warning signs:**
- Build error: "Module not found" or "Cannot find module" for JSON files
- "use client" directive at top of file that imports chapter JSON

### Pitfall 2: Large JSON Performance

**What goes wrong:** Chapter 19 is 618KB - parsing large JSON blocks can slow initial render
**Why it happens:** JSON.parse of large strings is synchronous and blocks rendering
**How to avoid:**
- Import chapter JSON only for the specific chapter being viewed (not all 19)
- Use Server Components to parse JSON server-side before sending to client
- Consider showing content progressively (sections render as they're parsed)
- For chapter grid, only load metadata (first few fields), not full content

**Warning signs:**
- Slow page load on `/cop/19` route
- "Blocking main thread" warnings in browser DevTools
- Client-side JSON parsing in waterfall

### Pitfall 3: Line Break Rendering

**What goes wrong:** COP content has `\n` characters but they render as spaces in HTML
**Why it happens:** HTML collapses whitespace by default
**How to avoid:**
- Use CSS `white-space: pre-line` on content containers
- Or split content by `\n` and wrap in `<p>` tags
- Don't use `white-space: pre` (preserves all spaces, breaks responsive layout)

**Warning signs:**
- Content appears as single long line
- No paragraph breaks visible
- Section numbers run together with content

### Pitfall 4: Missing Version Identifier

**What goes wrong:** Forgetting to display COP version ("v25.12 -- 1 December 2025")
**Why it happens:** Version is in JSON but easy to overlook in UI
**How to avoid:**
- Extract `version` field from chapter JSON metadata
- Display prominently at top of COP index page
- Include in breadcrumb or page header for chapter pages
- Per requirement COPR-06: version must be "displayed prominently"

**Warning signs:**
- Version not visible on `/cop` page
- Chapter pages don't indicate which COP version is displayed

### Pitfall 5: Image URL Construction

**What goes wrong:** COP images fail to load due to incorrect R2 URL construction
**Why it happens:** Image URLs in JSON are R2 keys, not full URLs
**How to avoid:**
- Use existing `getPublicUrl(key)` helper from `lib/storage.ts`
- Pass full URL to Next.js Image component
- Check that `R2_PUBLIC_URL` env var is set

**Warning signs:**
- 404 errors for images in browser Network tab
- Broken image icons in COP content
- Image `src` doesn't start with full R2 domain

## Code Examples

Verified patterns from official sources:

### Reading Public JSON Files Server-Side

```typescript
// Server Component - reads JSON from public directory
// Source: Next.js 14 App Router conventions
import fs from 'fs';
import path from 'path';

export default async function ChapterPage({ params }: { params: { chapterNumber: string } }) {
  const chapterPath = path.join(process.cwd(), 'public', 'cop', `chapter-${params.chapterNumber}.json`);
  const chapterData = JSON.parse(fs.readFileSync(chapterPath, 'utf-8'));

  return (
    <div>
      <h1>{chapterData.title}</h1>
      {/* Render sections */}
    </div>
  );
}
```

**Alternative using dynamic import:**

```typescript
// Simpler but less flexible
export default async function ChapterPage({ params }: { params: { chapterNumber: string } }) {
  const chapterData = await import(`@/public/cop/chapter-${params.chapterNumber}.json`);

  return <div>{/* ... */}</div>;
}
```

### Rendering Plain Text with Line Breaks

```typescript
// Source: React best practices for newlines
// https://dev.to/cassidoo/make-line-breaks-work-when-you-render-text-in-a-react-or-vue-component-4m0n
<div className="prose max-w-none">
  <div style={{ whiteSpace: 'pre-line' }}>
    {section.content}
  </div>
</div>

// Or with Tailwind class:
<div className="whitespace-pre-line">
  {section.content}
</div>
```

### Next.js Image with R2 URLs

```typescript
// Source: Existing pattern from components/details/ImageGallery.tsx
import Image from 'next/image';
import { getPublicUrl } from '@/lib/storage';

// Inside component
<Image
  src={getPublicUrl(imageKey)}
  alt={`COP Chapter ${chapterNumber} diagram`}
  width={800}
  height={600}
  className="rounded-lg"
  quality={80}
/>
```

### Card Grid Pattern

```typescript
// Source: app/(dashboard)/planner/page.tsx (existing pattern)
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
  {chapters.map((chapter) => (
    <Link key={chapter.chapterNumber} href={`/cop/${chapter.chapterNumber}`}>
      <Card className="h-full cursor-pointer transition-all hover:shadow-lg hover:border-primary/50">
        <CardHeader>
          <div className="flex items-start justify-between">
            <Badge variant="secondary">Chapter {chapter.chapterNumber}</Badge>
          </div>
          <CardTitle className="mt-4 text-lg">{chapter.title}</CardTitle>
          <CardDescription>
            {chapter.sectionCount} sections
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  ))}
</div>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Markdown rendering | Plain text with CSS | 2026 (React ecosystem) | Simpler, no markdown parser needed, content is already plain text |
| Static HTML generation | Server Components | Next.js 13 (2022) | Faster time-to-interactive, server-side rendering |
| Client-side data fetching | Server Component imports | Next.js 13 App Router | Eliminates loading waterfalls |
| Manual image optimization | Next.js Image component | Next.js 10 (2020) | Automatic WebP/AVIF, lazy loading, size optimization |

**Deprecated/outdated:**
- `getStaticProps` / `getServerSideProps`: Replaced by async Server Components in App Router
- Pages Router patterns: Project uses App Router exclusively (per CLAUDE.md)
- Unoptimized `<img>` tags: Next.js Image component is standard

## Open Questions

Things that couldn't be fully resolved:

1. **Should chapter routes be statically generated or dynamic?**
   - What we know: Content is static JSON, changes quarterly
   - What's unclear: Whether to use `generateStaticParams` or `force-dynamic`
   - Recommendation: Use `force-dynamic` initially (simpler), optimize to static generation in Phase 15 if needed

2. **How should image captions be displayed?**
   - What we know: COP images may have captions in database (`cop_section_images.caption`)
   - What's unclear: Whether JSON files include caption data, how to link images to captions
   - Recommendation: Inspect JSON structure for images, add captions if present, defer to Phase 15 if complex

3. **Should chapter content be scrollable single-page or paginated?**
   - What we know: Requirement says "scrollable rich text"
   - What's unclear: Whether entire chapter or section-by-section navigation
   - Recommendation: Single scrollable page per requirement, add section navigation in Phase 15

4. **How to handle chapter cross-references?**
   - What we know: COP content has references like "see 8.5.4"
   - What's unclear: Whether to auto-link references to other sections
   - Recommendation: Display as plain text for Phase 14, add linking in Phase 15

## Sources

### Primary (HIGH confidence)
- Codebase investigation: `app/(dashboard)/planner/page.tsx`, `app/layout.tsx`, `components/details/ImageGallery.tsx`
- JSON structure: `public/cop/chapter-1.json`, `public/cop/chapter-6.json`, `public/cop/chapter-19.json`
- Database schema: `lib/db/schema.ts` (cop_sections table definition)
- Package.json dependencies: Next.js 14.2.35, React 18.3.1, Tailwind 3.4.1
- Existing patterns: Card grid, loading skeletons, Server Components, image handling

### Secondary (MEDIUM confidence)
- [Next.js Dynamic Routes documentation](https://nextjs.org/docs/app/api-reference/file-conventions/dynamic-routes)
- [Next.js Static and Dynamic Rendering](https://nextjs.org/learn/dashboard-app/static-and-dynamic-rendering)
- [React line break rendering](https://dev.to/cassidoo/make-line-breaks-work-when-you-render-text-in-a-react-or-vue-component-4m0n)
- [Next.js Image Optimization with Cloudflare R2](https://wphtaccess.com/2025/09/18/next-js-image-optimization-with-cloudflare-r2-app-router/)

### Tertiary (LOW confidence)
- React performance optimization patterns (virtualization not needed for COP reader - content length manageable)
- Static generation with generateStaticParams (deferred - force-dynamic simpler for MVP)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All dependencies already installed, patterns observed in codebase
- Architecture: HIGH - Existing patterns in `/planner` directly applicable to `/cop` routes
- Pitfalls: HIGH - Based on common Next.js App Router mistakes and JSON rendering issues

**Research date:** 2026-02-08
**Valid until:** 30 days (stable Next.js patterns, JSON structure unlikely to change)
