# Architecture Research: Wikipedia-Style Encyclopedia Transformation

**Domain:** Technical documentation encyclopedia (roofing reference content)
**Researched:** 2026-02-12
**Confidence:** HIGH

## Standard Architecture for Encyclopedia Applications

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                                │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │   Article    │  │     TOC      │  │  Cross-Link  │  │  Breadcrumb│  │
│  │   Renderer   │  │  Generator   │  │    Engine    │  │  Builder   │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬─────┘  │
│         │                 │                 │                 │         │
├─────────┴─────────────────┴─────────────────┴─────────────────┴─────────┤
│                     COMPOSITION LAYER                                    │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │              Article Composer (Server Component)                  │  │
│  │  • Fetch cop_sections (primary content)                           │  │
│  │  • Fetch htg_content (supplementary guides)                       │  │
│  │  • Fetch details (installation details)                           │  │
│  │  • Fetch failure_cases (case law references)                      │  │
│  │  • Merge via junction tables                                      │  │
│  └───────────────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────────┤
│                        DATA LAYER                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │ cop_sections │  │ htg_content  │  │   details    │  │failure_cases│ │
│  │  (1,121)     │  │   (350)      │  │   (312)      │  │   (86)     │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬─────┘  │
│         └──────────────┬───────────────────┬─────────────────┘         │
│                        │  Junction Tables  │                           │
│                ┌───────┴──────────┬────────┴─────────┐                 │
│                │ cop_section_htg  │ cop_section_details│                │
│                │ detail_htg       │ detail_failure_links│               │
│                └──────────────────┴───────────────────┘                 │
└─────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Implementation Pattern |
|-----------|----------------|------------------------|
| ArticleComposer | Fetch + merge multi-source content into unified article | Next.js Server Component with parallel data fetching |
| ArticleRenderer | Transform plain text → rich content with inline links | MDX or custom parser with React components |
| TOCGenerator | Extract section hierarchy → scrollable navigation | Server-side extraction, client-side Intersection Observer |
| CrossLinkEngine | Parse section references → hyperlinks | Regex-based reference detection + link lookup table |
| BreadcrumbBuilder | Generate navigation path from COP hierarchy | Server Component using cop_sections parentId chain |

## Recommended Project Structure

```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── cop/                     # Existing COP routes
│   │   │   ├── [chapter]/page.tsx  # MODIFIED: redirect to /encyclopedia/cop/{chapter}
│   │   │   └── page.tsx            # MODIFIED: redirect to /encyclopedia/cop
│   │   ├── encyclopedia/            # NEW: unified encyclopedia routes
│   │   │   ├── page.tsx            # Encyclopedia home (all content sources)
│   │   │   ├── cop/                # COP articles (replaces /cop/)
│   │   │   │   ├── page.tsx        # COP chapter index
│   │   │   │   └── [chapter]/      # Individual COP articles
│   │   │   │       ├── page.tsx    # Article view (Server Component)
│   │   │   │       └── [...section]/page.tsx # Deep-link support
│   │   │   ├── guides/             # HTG articles (replaces /guides/)
│   │   │   │   ├── page.tsx        # Guide index
│   │   │   │   └── [guide]/page.tsx # Guide article view
│   │   │   └── details/            # Installation detail articles
│   │   │       ├── page.tsx        # Detail index
│   │   │       └── [code]/page.tsx # Detail article view
│   │   ├── planner/                # UNCHANGED: task-oriented interface
│   │   └── fixer/                  # UNCHANGED: task-oriented interface
├── components/
│   ├── encyclopedia/               # NEW: encyclopedia-specific components
│   │   ├── ArticleRenderer.tsx    # Renders merged content with inline links
│   │   ├── ArticleLayout.tsx      # Two-column layout (content + TOC)
│   │   ├── TableOfContents.tsx    # Client Component with scroll spy
│   │   ├── InlineReference.tsx    # Inline COP section reference link
│   │   ├── SupplementarySection.tsx # HTG/detail/case law callouts
│   │   └── CitationBlock.tsx      # Legislative reference formatting
│   ├── cop/                        # EXISTING: keep for backwards compat
│   │   ├── SectionRenderer.tsx    # DEPRECATED (use ArticleRenderer)
│   │   ├── SupplementaryPanel.tsx # MIGRATE to SupplementarySection
│   │   └── CopImage.tsx           # REUSE in ArticleRenderer
├── lib/
│   ├── db/
│   │   ├── queries/
│   │   │   ├── articles.ts        # NEW: article composition queries
│   │   │   ├── cross-links.ts     # EXISTING: extend for inline linking
│   │   │   ├── supplementary.ts   # EXISTING: reuse in composer
│   │   │   └── toc.ts             # NEW: TOC extraction logic
│   │   └── schema.ts              # UNCHANGED (no schema changes needed)
│   ├── content/
│   │   ├── article-composer.ts    # NEW: multi-source composition logic
│   │   ├── link-parser.ts         # NEW: parse "8.5.4" → link
│   │   ├── reference-resolver.ts  # NEW: resolve section refs to URLs
│   │   └── content-renderer.ts    # NEW: plain text → MDX/rich format
│   └── utils/
│       ├── section-hierarchy.ts   # NEW: build TOC from cop_sections
│       └── citation-formatter.ts  # NEW: format NZBC/legislative refs
└── types/
    └── encyclopedia.ts             # NEW: Article, Section, Reference types
```

### Structure Rationale

- **encyclopedia/ route group:** Isolates encyclopedia routes from task-oriented (planner/fixer) routes. Allows for encyclopedia-specific layouts (two-column, TOC sidebar) without affecting other app sections.
- **lib/content/ directory:** Separates content composition logic (article-composer.ts) from data access (lib/db/queries/). Composer orchestrates multiple queries, parsers transform content, resolvers map references to URLs.
- **components/encyclopedia/:** Encapsulates encyclopedia-specific UI components. ArticleRenderer handles rich content display, TableOfContents manages scroll spy, SupplementarySection replaces SupplementaryPanel with richer formatting.
- **Backward compatibility:** Old /cop/ routes redirect to /encyclopedia/cop/. SectionRenderer marked deprecated but retained during migration. Planner/fixer routes unchanged (task-oriented, not encyclopedia).

## Architectural Patterns

### Pattern 1: Runtime Article Composition (Server Component)

**What:** Fetch content from multiple tables in parallel, merge at request time, render as Server Component.

**When to use:** Content changes frequently (quarterly COP updates), pre-computation would require complex invalidation, data size manageable (1,121 sections + 350 HTG + 312 details = ~1,800 entities).

**Trade-offs:**
- **Pros:** Fresh data every request, no stale cache issues, simpler deployment (no build-time article generation), easy to add new content sources.
- **Cons:** Query overhead on every page load (mitigated by Neon connection pooling), no static generation for offline access.

**Example:**
```typescript
// app/encyclopedia/cop/[chapter]/page.tsx (Server Component)
import { db } from '@/lib/db';
import { composeArticle } from '@/lib/content/article-composer';
import { ArticleRenderer } from '@/components/encyclopedia/ArticleRenderer';

export default async function CopArticlePage({ params }) {
  const { chapter } = params;

  // Parallel data fetching (Server Component benefit)
  const [copData, htgData, detailData, caseLawData] = await Promise.all([
    db.query.copSections.findMany({ where: eq(copSections.chapterNumber, chapter) }),
    getSupplementaryContent(chapter), // Existing query
    getDetailsForChapter(chapter),    // New query
    getCaseLawForChapter(chapter),    // New query
  ]);

  // Compose article (merge content, resolve cross-references)
  const article = composeArticle({
    primaryContent: copData,
    supplementary: { htg: htgData, details: detailData, caseLaw: caseLawData },
  });

  return <ArticleRenderer article={article} />;
}
```

### Pattern 2: Reference Resolution via Lookup Table

**What:** Build in-memory Map of section numbers → URLs at module load, resolve references during content rendering.

**When to use:** Section numbering is stable (COP structure rarely changes), reference patterns predictable (e.g., "8.5.4", "Section 8.5.4", "see 8.5.4"), lookup is O(1).

**Trade-offs:**
- **Pros:** Fast resolution (no database query per reference), deterministic (no regex ambiguity), works with existing data (no new tables needed).
- **Cons:** Memory overhead (~1,121 entries × ~50 bytes = ~56KB), requires rebuild on COP structure change (acceptable for quarterly updates).

**Example:**
```typescript
// lib/content/reference-resolver.ts
import { db } from '@/lib/db';
import { copSections } from '@/lib/db/schema';

let sectionLookup: Map<string, { chapterNumber: number; url: string }> | null = null;

async function buildSectionLookup() {
  const sections = await db.select({
    sectionNumber: copSections.sectionNumber,
    chapterNumber: copSections.chapterNumber,
  }).from(copSections);

  const map = new Map();
  for (const section of sections) {
    map.set(section.sectionNumber, {
      chapterNumber: section.chapterNumber,
      url: `/encyclopedia/cop/${section.chapterNumber}#section-${section.sectionNumber}`,
    });
  }
  return map;
}

export async function resolveReference(sectionRef: string): Promise<string | null> {
  if (!sectionLookup) {
    sectionLookup = await buildSectionLookup();
  }
  return sectionLookup.get(sectionRef)?.url || null;
}

// Usage in link parser
// "See section 8.5.4 for details" → "See <a href="/encyclopedia/cop/8#section-8.5.4">section 8.5.4</a> for details"
```

### Pattern 3: Progressive Enhancement for Cross-Linking

**What:** Render plain text on server, enhance with inline links via custom React components. Start with regex-based detection (Phase 1), add natural language parsing later (Phase 2+).

**When to use:** Content contains structured references ("8.5.4") but also prose references ("see Flashings chapter"), need incremental complexity (ship links for structured refs first, improve detection later).

**Trade-offs:**
- **Pros:** Incremental delivery (ship basic linking fast), testable (regex patterns easy to unit test), extensible (swap parser without changing renderer).
- **Cons:** Regex fragile for prose (false positives on "8.5 mm"), requires multiple passes (Section refs → Detail codes → Legislative refs).

**Example:**
```typescript
// lib/content/link-parser.ts
const SECTION_REF_PATTERN = /\b(\d+(?:\.\d+){1,3})\b/g;
const DETAIL_CODE_PATTERN = /\b([A-Z]\d{2,3})\b/g;

export function parseLinks(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;

  // Pass 1: Section references (e.g., "8.5.4")
  const matches = Array.from(text.matchAll(SECTION_REF_PATTERN));

  for (const match of matches) {
    const ref = match[1];
    const url = resolveReference(ref); // Lookup table

    if (url) {
      // Text before link
      nodes.push(text.slice(lastIndex, match.index));
      // Link component
      nodes.push(<InlineReference key={match.index} href={url}>{ref}</InlineReference>);
      lastIndex = match.index + match[0].length;
    }
  }

  // Remaining text
  nodes.push(text.slice(lastIndex));
  return nodes;
}
```

### Pattern 4: Server-Side TOC + Client-Side Scroll Spy

**What:** Extract section hierarchy on server (pure data), pass to client component for scroll tracking and active state.

**When to use:** TOC structure is static per article (doesn't change during user session), scroll interaction requires client state (Intersection Observer), hydration overhead acceptable (~2KB for TOC component).

**Trade-offs:**
- **Pros:** SEO-friendly (TOC in initial HTML), fast page load (no JS required to see TOC), smooth scroll highlighting (Intersection Observer efficient).
- **Cons:** Hydration cost (TOC re-renders on client), requires "use client" boundary (breaks Server Component tree).

**Example:**
```typescript
// app/encyclopedia/cop/[chapter]/page.tsx (Server Component)
import { TableOfContents } from '@/components/encyclopedia/TableOfContents';
import { extractTOC } from '@/lib/utils/section-hierarchy';

export default async function CopArticlePage({ params }) {
  const copData = await fetchCopSections(params.chapter);
  const toc = extractTOC(copData); // Server-side extraction

  return (
    <div className="grid grid-cols-[1fr_250px]">
      <ArticleRenderer content={copData} />
      <TableOfContents sections={toc} /> {/* Client Component */}
    </div>
  );
}

// components/encyclopedia/TableOfContents.tsx (Client Component)
'use client';
import { useEffect, useState } from 'react';

export function TableOfContents({ sections }: { sections: TOCSection[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: '-80px 0px -80%' }
    );

    sections.forEach(section => {
      const el = document.getElementById(`section-${section.number}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav className="sticky top-20">
      {sections.map(section => (
        <a
          key={section.number}
          href={`#section-${section.number}`}
          className={activeId === `section-${section.number}` ? 'active' : ''}
        >
          {section.number} {section.title}
        </a>
      ))}
    </nav>
  );
}
```

## Data Flow

### Article Request Flow

```
User requests /encyclopedia/cop/8
    ↓
Next.js Server Component renders
    ↓
article-composer.ts orchestrates parallel queries
    ↓
┌───────────────┬───────────────┬───────────────┬───────────────┐
│ cop_sections  │ cop_section_  │ cop_section_  │ detail_       │
│ (chapter 8)   │ htg (links)   │ details       │ failure_links │
└───────┬───────┴───────┬───────┴───────┬───────┴───────┬───────┘
        │               │               │               │
        └───────────────┴───────────────┴───────────────┘
                         ↓
            Merge results by section ID
                         ↓
            reference-resolver.ts parses content
                         ↓
            link-parser.ts converts "8.5.4" → <a>
                         ↓
            ArticleRenderer receives enriched data
                         ↓
            Server Component HTML (with inline links)
                         ↓
            Streamed to client (React Streaming)
                         ↓
            TableOfContents hydrates (Intersection Observer)
                         ↓
            User sees article with active TOC highlighting
```

### Cross-Reference Resolution Flow

```
Content text: "Refer to Section 8.5.4 for flashing details"
    ↓
link-parser.ts regex match: "8.5.4"
    ↓
reference-resolver.ts lookup: sectionLookup.get("8.5.4")
    ↓
Returns: { chapterNumber: 8, url: "/encyclopedia/cop/8#section-8.5.4" }
    ↓
InlineReference component: <a href="/encyclopedia/cop/8#section-8.5.4">8.5.4</a>
    ↓
Rendered HTML: "Refer to Section <a>8.5.4</a> for flashing details"
```

### Supplementary Content Integration Flow

```
Primary content (cop_sections)
    ↓
For each section, query junction tables:
    ├── cop_section_htg → htg_content (How-To Guides)
    ├── cop_section_details → details (Installation Details)
    └── detail_failure_links → failure_cases (Case Law)
    ↓
Compose SupplementarySection components:
    ├── HTG: Expandable callout "Related Guide: Metal Flashing Installation"
    ├── Details: Card grid with 3D model thumbnails
    └── Case Law: Citation block "MBIE Determination 2024-035"
    ↓
Inject after relevant section content
    ↓
User sees cohesive article with primary + supplementary content
```

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| **Current (1.8K content entities)** | Runtime composition with Server Components, in-memory lookup table, single database (Neon). Expected response time: <200ms (Neon cold start mitigated by Vercel Edge). |
| **Growth to 5K entities** | Add React.cache() for deduplication across components, consider Redis for sectionLookup (shared across instances), implement ISR for popular articles (revalidate: 3600). |
| **Growth to 10K+ entities** | Pre-compute article HTML at build time (Next.js generateStaticParams), store in database or R2, serve via edge cache. Incremental Static Regeneration for COP updates (on-demand revalidation via webhook). |

### Scaling Priorities

1. **First bottleneck (likely at 3K entities):** Parallel query overhead. Each article fetches 4+ tables. **Fix:** Use `Promise.all()` already (current pattern), add `React.cache()` to deduplicate identical queries within request, enable Drizzle prepared statements.

2. **Second bottleneck (likely at 5K entities):** Lookup table memory (56KB → 250KB). Vercel serverless has 1GB limit, but multiple instances = redundant memory. **Fix:** Move sectionLookup to Redis (Upstash), cache with 1-hour TTL, rebuild on COP content updates.

3. **Third bottleneck (10K+ entities):** Server Component render time. Complex articles with 100+ sections + 50+ supplementary items = 500ms+ render. **Fix:** Switch to ISR (Incremental Static Regeneration), pre-render popular chapters, revalidate on-demand via /api/revalidate webhook after COP updates.

## Anti-Patterns

### Anti-Pattern 1: Pre-Computing Articles into New Tables

**What people do:** Create `encyclopedia_articles` table, run migration to merge cop_sections + htg_content + details into pre-computed article records, query single table at runtime.

**Why it's wrong:**
- Duplicates data (cop_sections content now in two tables),
- Stale data risk (cop_sections updated but articles table not regenerated),
- Complex update logic (any change to cop_sections/htg_content requires article regeneration),
- Breaks existing junction table relationships (cop_section_details now points to old cop_sections, not article records).

**Do this instead:** Use runtime composition in Server Components. Leverage PostgreSQL query performance (Neon can join 4 tables in <50ms). Keep single source of truth (cop_sections), compose on-demand, cache at HTTP layer (Vercel Edge) if needed.

### Anti-Pattern 2: Client-Side Content Fetching

**What people do:** Make ArticleRenderer a Client Component, fetch cop_sections + supplementary via useEffect, show loading spinner, render when data arrives.

**Why it's wrong:**
- Waterfalls (HTML loads → JS parses → useEffect runs → fetch starts → data arrives → render),
- No SEO (content not in initial HTML, search engines don't execute JS reliably),
- Slower perceived performance (blank screen → spinner → content vs. content immediately),
- Higher bandwidth (sends React runtime + data fetching code to client).

**Do this instead:** Use Server Components (default in Next.js App Router). Fetch data on server, stream HTML to client, no client-side fetching needed. Result: instant content, perfect SEO, minimal client JS.

### Anti-Pattern 3: Markdown Files for Content

**What people do:** Export cop_sections to Markdown files (e.g., `content/cop/8.5.4.md`), use MDX to render, add frontmatter for metadata.

**Why it's wrong:**
- Loses relational structure (junction tables like cop_section_htg can't be represented in Markdown),
- Manual sync burden (cop_sections table updates require regenerating Markdown files),
- No dynamic queries (can't filter by chapterNumber, can't join with details table),
- Complex cross-linking (need to manually maintain links in Markdown, breaks when section numbers change).

**Do this instead:** Keep content in database (single source of truth), use Server Components to query dynamically, render with custom React components (InlineReference, SupplementarySection). Convert to MDX only for final display if rich formatting needed (but plain text with React components likely sufficient).

### Anti-Pattern 4: Global Context for Article Data

**What people do:** Fetch article data in layout, store in React Context, consume in ArticleRenderer.

**Why it's wrong:**
- Forces "use client" on layout (breaks Server Component tree, entire app becomes client-rendered),
- Context not available on server (can't use in Server Components),
- Props drilling still exists (context just moves it up the tree),
- Re-renders entire tree when context changes (performance issue for large articles).

**Do this instead:** Pass data as props from Server Component parent to child. Server Components can fetch and pass data down naturally. No context needed. Example: `<ArticleRenderer article={article} />` where article fetched in page.tsx Server Component.

## Integration Points

### Data Layer Integration

| Integration Point | Pattern | Notes |
|----------|---------|-------|
| **cop_sections → article content** | Primary content source, query by chapterNumber, extract section hierarchy for TOC | Existing table, no changes needed. Use `copSections.parentId` to build nested TOC. |
| **cop_section_htg → htg_content** | Junction table for HTG guides, query by sectionId, display as "Related Guides" callout | Existing junction, reuse getSupplementaryContent() query pattern. |
| **cop_section_details → details** | Junction table for installation details, query by sectionId, render as card grid with 3D model links | Existing junction, extend with thumbnail display in SupplementarySection. |
| **detail_htg → htg_content** | Junction table for HTG-to-detail links, enables bidirectional navigation (HTG articles link to details) | Existing junction, use in HTG article pages (/encyclopedia/guides/[guide]). |
| **detail_failure_links → failure_cases** | Junction table for case law, query by detailId, render as citation blocks with PDF links | Existing junction, format with CitationBlock component (case ID, outcome, summary, PDF link). |
| **legislativeReferences → detail_legislative_links** | Normalized NZBC citations, query by detailId, render as "Building Code References" section | Existing tables (DATA-03), use authorityLevel to style (building_code = red badge, acceptable_solution = blue). |

### Component Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **ArticleComposer (Server) → ArticleRenderer (Server)** | Props (article object with merged content) | Both Server Components, no serialization needed, pass complex objects directly. |
| **ArticleRenderer (Server) → TableOfContents (Client)** | Props (TOC section array) | Client Component boundary, serialize TOC as JSON, hydrate with Intersection Observer. |
| **ArticleRenderer (Server) → InlineReference (Server)** | Props (href, children) | Both Server Components, no hydration cost, links work without JS. |
| **ChapterPage (Server) → SupplementarySection (Server)** | Props (htgGuides, details, caseLaw arrays) | Compose in page, pass down, SupplementarySection handles rendering logic. |
| **Existing SectionRenderer → new ArticleRenderer** | Gradual migration, SectionRenderer becomes wrapper around ArticleRenderer | Backward compat: SectionRenderer calls ArticleRenderer internally, deprecated in docs. |

### Routing Structure

| Old Route | New Route | Migration Strategy |
|-----------|-----------|-------------------|
| `/cop` | `/encyclopedia/cop` | Redirect in cop/page.tsx, preserve backward compat for 2 releases. |
| `/cop/[chapter]` | `/encyclopedia/cop/[chapter]` | Redirect with 301, update all internal links in one phase. |
| `/cop/[chapter]#section-X` | `/encyclopedia/cop/[chapter]#section-X` | Deep links preserved, anchor IDs unchanged. |
| `/guides/[sourceDocument]` | `/encyclopedia/guides/[guide]` | Parallel routes (both work), deprecate /guides/ in Phase 3. |
| `/planner/[substrate]/[category]/[detailId]` | **UNCHANGED** | Task-oriented, not encyclopedia. Keep separate. |
| `/fixer/[detailId]` | **UNCHANGED** | Task-oriented, not encyclopedia. Keep separate. |

## Migration Strategy

### Phase 1: Foundation (No Breaking Changes)

**Scope:** Build new encyclopedia architecture in parallel with existing /cop/ routes. No user-facing changes.

**Changes:**
- Create `/app/(dashboard)/encyclopedia/` route group with cop/page.tsx (chapter index)
- Build `lib/content/article-composer.ts` (runtime composition logic)
- Build `lib/content/reference-resolver.ts` (section number → URL lookup)
- Build `lib/content/link-parser.ts` (regex-based reference detection)
- Create `components/encyclopedia/ArticleRenderer.tsx` (wrapper around SectionRenderer initially)
- Create `components/encyclopedia/TableOfContents.tsx` (client component with scroll spy)
- Add redirect in `/cop/page.tsx`: `redirect('/encyclopedia/cop')` (behind feature flag)

**Validation:**
- Visit `/encyclopedia/cop/8` → renders same content as `/cop/8`
- TOC shows all sections, highlights on scroll
- No inline links yet (Phase 2), but infrastructure ready

**Rollback:** Remove `/encyclopedia/` directory, remove redirects, no data changes made.

### Phase 2: Cross-Linking (Progressive Enhancement)

**Scope:** Enable inline cross-references in COP articles. Start with structured refs ("8.5.4"), expand to detail codes ("F07"), legislative refs ("E2/AS1") in later iterations.

**Changes:**
- Implement `parseLinks()` in link-parser.ts (regex for section numbers)
- Update ArticleRenderer to use parseLinks() on section content
- Create `components/encyclopedia/InlineReference.tsx` (link component with hover preview)
- Build reference lookup table in reference-resolver.ts (Map<sectionNumber, url>)
- Add unit tests for regex patterns (test false positives on "8.5 mm" vs "8.5.4")

**Validation:**
- Visit `/encyclopedia/cop/8` → section text contains clickable links to other sections
- Click "8.5.4" → navigates to `/encyclopedia/cop/8#section-8.5.4`
- Hover link → shows preview tooltip (section title)

**Rollback:** Disable parseLinks() call, ArticleRenderer falls back to plain text rendering.

### Phase 3: Supplementary Integration (Richer Content)

**Scope:** Replace SupplementaryPanel (simple link lists) with SupplementarySection (rich callouts with thumbnails, excerpts, model previews).

**Changes:**
- Create `components/encyclopedia/SupplementarySection.tsx` (HTG/detail/case law callouts)
- Update article-composer.ts to include supplementary content in article object
- Modify ArticleRenderer to inject SupplementarySection after relevant sections
- Deprecate SupplementaryPanel (mark in docs, redirect imports)
- Add CitationBlock component for case law (format: "MBIE Determination 2024-035", outcome badge, summary excerpt, PDF link)

**Validation:**
- Visit `/encyclopedia/cop/8` → see "Related Guides" callout with HTG thumbnails
- See "Installation Details" grid with 3D model links
- See "Case Law" citation blocks with PDF links

**Rollback:** Remove SupplementarySection, revert to SupplementaryPanel, no data changes.

### Phase 4: Full Cutover (User-Facing)

**Scope:** Make `/encyclopedia/cop/` the primary route, redirect old `/cop/` routes, update all internal navigation.

**Changes:**
- Update all `<Link href="/cop/...">` → `<Link href="/encyclopedia/cop/...">` across codebase
- Add permanent redirects (301) in `/cop/page.tsx` and `/cop/[chapter]/page.tsx`
- Update breadcrumbs to show "Encyclopedia" instead of "COP"
- Add banner to old /cop/ routes: "This page has moved to /encyclopedia/cop/" (for 2 releases)
- Update sitemap.xml to prioritize /encyclopedia/ routes

**Validation:**
- Search Console: verify /encyclopedia/cop/ routes indexed, /cop/ routes showing 301 redirects
- Analytics: confirm traffic shifting to new routes
- User feedback: no reported broken links

**Rollback:** Remove redirects, revert internal links, prioritize /cop/ in sitemap (data unchanged, easy rollback).

## HTG Absorption Strategy

### Current State
- HTG content stored in `htg_content` table (350 records from 3 PDFs)
- Each record = one page from PDF (guideName, content, images, pdfPage)
- Linked to COP sections via `cop_section_htg` junction table (many-to-many)
- Linked to details via `detail_htg` junction table (many-to-many)

### Mapping Strategy

**1:1 Mapping (HTG page → COP section):**
- Query: `SELECT htgId FROM cop_section_htg WHERE sectionId = 'cop-8.5.4'`
- Render: Inject HTG content directly into COP section as expandable callout
- Example: COP section 8.5.4 "Flashings" → HTG page "Metal Flashing Installation" → display as "How-To Guide" callout below section text

**1:Many Mapping (HTG page → Multiple COP sections):**
- Query: `SELECT sectionId FROM cop_section_htg WHERE htgId = 'htg-metal-flashing-install'`
- Render: Show HTG content in all related sections, OR create standalone HTG article at `/encyclopedia/guides/metal-flashing-install`
- Decision: Use standalone article if HTG page references 3+ COP sections (avoids content duplication)

**Many:1 Mapping (Multiple HTG pages → COP section):**
- Query: `SELECT htgId FROM cop_section_htg WHERE sectionId = 'cop-8.5.4' ORDER BY relevance`
- Render: Show multiple "Related Guides" callouts, prioritize by relevance (primary vs supplementary)
- Example: COP section 15.1 "Curved Roofing" → 5 HTG pages (spring curving, roll bending, etc.) → show as tabbed interface

**No Mapping (HTG page standalone):**
- Query: `SELECT htgId FROM cop_section_htg` (if htgId not present, orphaned HTG content)
- Render: Show at `/encyclopedia/guides/[sourceDocument]` only, link from search results
- Example: HTG "General Roofing Safety" (applies to all COP sections) → standalone guide article

### Rendering Logic

```typescript
// lib/content/article-composer.ts
export function composeArticle({ copSection, htgLinks, details }) {
  const supplementary = [];

  // HTG content integration
  for (const htgLink of htgLinks) {
    if (htgLink.relevance === 'primary') {
      // Inline HTG content directly into section (1:1 mapping)
      supplementary.push({
        type: 'htg-inline',
        position: 'after-section-content',
        content: htgLink.content,
        images: htgLink.images,
      });
    } else {
      // Link to standalone HTG article (1:Many mapping)
      supplementary.push({
        type: 'htg-link',
        position: 'sidebar',
        title: htgLink.guideName,
        href: `/encyclopedia/guides/${htgLink.sourceDocument}#${htgLink.guideName}`,
      });
    }
  }

  return { ...copSection, supplementary };
}
```

## Content Rendering Approach

### Plain Text + React Components (Recommended for Phase 1-2)

**Why:** Existing content is plain text in `cop_sections.content` (JSON chapter files). Adding MDX requires content migration (convert all 1,121 records). React components can wrap plain text without migration.

**Implementation:**
```typescript
// components/encyclopedia/ArticleRenderer.tsx
export function ArticleRenderer({ section }) {
  // Plain text from database
  const contentWithLinks = parseLinks(section.content); // Returns ReactNode[]

  return (
    <div className="prose">
      {section.title && <h2>{section.title}</h2>}
      <div className="whitespace-pre-line">{contentWithLinks}</div>
      {section.images?.map(img => <CopImage key={img} src={img} />)}
    </div>
  );
}
```

**Trade-offs:**
- **Pros:** No content migration, works with existing data, incremental enhancement (add components as needed)
- **Cons:** Limited rich formatting (no bold/italic in content text), harder to add callouts mid-paragraph

### MDX Conversion (Future Enhancement - Phase 3+)

**Why:** Enables rich formatting (bold, italic, lists), allows React components in content (e.g., `<DetailCard code="F07" />`), better authoring experience (Markdown familiar to technical writers).

**Migration Required:**
1. Add `contentMd` column to `cop_sections` table (nullable, defaults to null)
2. Write migration script: convert `content` (plain text) → `contentMd` (Markdown with frontmatter)
3. Update ArticleRenderer to use MDX runtime: `import { MDXRemote } from 'next-mdx-remote/rsc'`
4. Gradual rollout: render `contentMd` if present, fallback to `content` (plain text) if null

**Implementation:**
```typescript
// Migration script (one-time)
for (const section of copSections) {
  const md = convertPlainTextToMarkdown(section.content); // Escape special chars, preserve line breaks
  await db.update(copSections).set({ contentMd: md }).where(eq(copSections.id, section.id));
}

// ArticleRenderer (after migration)
import { MDXRemote } from 'next-mdx-remote/rsc';

export function ArticleRenderer({ section }) {
  if (section.contentMd) {
    return (
      <div className="prose">
        <MDXRemote source={section.contentMd} components={{ InlineReference, CopImage }} />
      </div>
    );
  } else {
    // Fallback to plain text (backward compat during migration)
    return <div className="whitespace-pre-line">{section.content}</div>;
  }
}
```

**Trade-offs:**
- **Pros:** Full Markdown support, React components in content, better DX for content updates
- **Cons:** Schema change (add column), migration risk (test on 1,121 records), bundle size (+15KB for MDX runtime)

**Recommendation:** Start with plain text + React components (Phase 1-2), evaluate MDX in Phase 3 if user feedback demands richer formatting.

## Build Order (Recommended Phases)

### Phase 1: Foundation & TOC (Week 1-2)
**Dependencies:** None (parallel to existing codebase)

1. Create `/app/(dashboard)/encyclopedia/` route structure
2. Build ArticleComposer (runtime composition, no linking yet)
3. Build ArticleRenderer (wrapper around SectionRenderer initially)
4. Build TableOfContents (client component with Intersection Observer)
5. Build section-hierarchy.ts (extract TOC from cop_sections)
6. Test: `/encyclopedia/cop/8` renders with TOC, no inline links

**Deliverable:** Encyclopedia routes functional, TOC with scroll spy works, content identical to old /cop/ routes.

### Phase 2: Cross-Linking Engine (Week 3-4)
**Dependencies:** Phase 1 complete (ArticleRenderer exists)

1. Build reference-resolver.ts (section lookup table)
2. Build link-parser.ts (regex for section numbers)
3. Create InlineReference component (link with hover preview)
4. Update ArticleRenderer to use parseLinks()
5. Add unit tests (regex edge cases, false positives)
6. Test: Section references become clickable links

**Deliverable:** Inline cross-linking works for section numbers (e.g., "8.5.4"), hover preview shows section title.

### Phase 3: Supplementary Integration (Week 5-6)
**Dependencies:** Phase 2 complete (ArticleRenderer enhanced)

1. Build SupplementarySection component (rich callouts)
2. Build CitationBlock component (case law formatting)
3. Update article-composer.ts to inject supplementary content
4. Deprecate SupplementaryPanel (mark in docs)
5. Test: HTG guides, details, case law display as rich callouts

**Deliverable:** Articles show integrated supplementary content (not just link lists), case law formatted as citations.

### Phase 4: Migration & Cutover (Week 7)
**Dependencies:** Phase 3 complete, user testing done

1. Add redirects in /cop/ routes (301 permanent)
2. Update all internal `<Link>` components to /encyclopedia/ routes
3. Update breadcrumbs, navigation menus
4. Add deprecation banner to old routes
5. Update sitemap.xml, submit to Search Console
6. Monitor analytics for traffic shift

**Deliverable:** /encyclopedia/cop/ is primary route, old /cop/ routes redirect, no broken links.

### Phase 5: Detail & Guide Articles (Week 8-10)
**Dependencies:** Phase 4 complete (COP articles live)

1. Create `/encyclopedia/details/[code]/page.tsx` (detail article view)
2. Create `/encyclopedia/guides/[guide]/page.tsx` (HTG article view)
3. Build DetailArticleComposer (merge details + htg_content + case law)
4. Build GuideArticleComposer (merge htg_content + linked details)
5. Update planner/fixer routes to link to encyclopedia detail articles
6. Test: Detail articles show HTG guides, COP sections, case law in unified view

**Deliverable:** All content types (COP, details, guides) accessible via encyclopedia routes, cross-linked bidirectionally.

## Sources

Official documentation and architectural patterns research:

- [Next.js App Router Server Components Guide](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [Next.js Composition Patterns Documentation](https://nextjs.org/docs/14/app/building-your-application/rendering/composition-patterns)
- [React Server Components Comprehensive Guide](https://blog.logrocket.com/react-server-components-comprehensive-guide/)
- [How to Create Table of Contents with Next.js 13/14](https://www.evolvingdev.com/post/how-to-create-a-table-of-contents-with-next-js)
- [Scrollspy Demystified](https://blog.maximeheckel.com/posts/scrollspy-demystified/)
- [MDX in Next.js Guide](https://nextjs.org/docs/app/guides/mdx)
- [MyST Markdown Cross-References](https://mystmd.org/guide/cross-references)
- [React Stack Patterns 2026](https://www.patterns.dev/react/react-2026/)

---

*Architecture research for: Wikipedia-style encyclopedia transformation*
*Researched: 2026-02-12*
*Confidence: HIGH (official Next.js docs + proven patterns)*
