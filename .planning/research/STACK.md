# Technology Stack: Digital COP Reader Features

**Project:** Master Roofers Code of Practice - Chapter Navigation & HTG Extraction
**Researched:** 2026-02-08
**Mode:** Focused research on stack additions for COP reader, supplementary panels, and HTG PDF extraction
**Overall Confidence:** HIGH

---

## Executive Summary

The Digital COP reader milestone requires five capability areas that map to specific stack additions. The good news: the existing stack (Next.js 14, shadcn/ui, Zustand, Drizzle, Cloudflare R2) handles most of the work. Only three new npm packages are genuinely needed, plus two shadcn/ui components that ship with the existing Radix dependency pattern.

The content is already extracted as structured JSON (sections_hierarchy.json: 19 chapters, hierarchical subsections, 772/775 images mapped to sections). The primary rendering challenge is not parsing -- it is presenting plain text content with inline images, collapsible supplementary panels, and section-addressable deep links. This is a UI/routing problem, not a content processing problem.

The HTG PDF extraction pipeline is a separate offline concern (build-time scripts, not runtime). The three HTG PDFs (Flashings 3MB, Penetrations 352MB, Cladding 100MB) are press-quality artwork PDFs. Extraction will use `unpdf` for text and `sharp` (already installed) for image processing.

---

## Recommended Stack Additions

### New Runtime Dependencies (3 packages)

| Technology | Version | Purpose | Why This One |
|------------|---------|---------|--------------|
| `@radix-ui/react-accordion` | ^1.2.12 | Chapter TOC with expandable sections | Already using 12 Radix primitives. Accordion handles multi-level chapter/section navigation with keyboard accessibility. shadcn/ui `accordion` component wraps this. |
| `@radix-ui/react-collapsible` | ^1.1.12 | Inline supplementary panels (3D, HTG, case law) | Collapsible panels within COP section content. Distinct from accordion: individual panels that toggle independently within flowing document text. shadcn/ui `collapsible` component wraps this. |
| `@radix-ui/react-scroll-area` | ^1.2.10 | Scrollable TOC sidebar with custom scrollbar | Chapter navigation sidebar needs independent scroll from main content. Consistent cross-browser scrollbar styling. shadcn/ui `scroll-area` component wraps this. |

### New Dev/Script Dependencies (1 package)

| Technology | Version | Purpose | Why This One |
|------------|---------|---------|--------------|
| `unpdf` | ^1.4.0 | HTG PDF text + image extraction (build-time scripts only) | Modern ESM-first alternative to unmaintained `pdf-parse`. Zero dependencies. TypeScript-native. Built on PDF.js v5.4. Extracts text per-page and images with raw pixel data. Used in `scripts/` only, never in production bundle. |

### Already Installed (No New Packages)

| Existing Package | Version in Project | New Use |
|------------------|--------------------|---------|
| `sharp` | ^0.34.5 (devDependency) | Process raw pixel data from `unpdf` image extraction into PNG/WebP. Already used for image optimization. |
| `zustand` | ^5.0.10 | Active section tracking, TOC expansion state, reading position persistence. Existing `app-store.ts` extended. |
| `lucide-react` | ^0.563.0 | Navigation icons (BookOpen, ChevronRight, Hash, Layers, FileText). Already has 500+ icons. |
| `next/link` + `next/navigation` | 14.2.35 | Hash fragment deep linking (`/cop/8#8.4.2`). Native App Router support for `#hash` in Link href. |
| `zod` | ^4.3.6 | Schema validation for HTG extraction output and section content types. |

---

## What NOT to Add (and Why)

### DO NOT add `react-markdown` or `rehype-*` plugins

**Reasoning:** The COP content in `sections_hierarchy.json` is plain text extracted from PDF, not Markdown. It contains no Markdown syntax (no `#`, `**`, `[links]()`, etc.). Adding react-markdown would require converting all content to Markdown first -- unnecessary complexity. Instead, build a simple `<SectionContent>` component that:
- Splits text on `\n` for paragraphs
- Renders inline images by matching section numbers to `images_manifest.json`
- Wraps content in semantic HTML (`<section>`, `<h2>`-`<h6>`, `<p>`)

This is 50-100 lines of custom code vs. adding a Markdown pipeline that does not match the data format.

### DO NOT add `react-intersection-observer`

**Reasoning:** The project needs scroll-spy for active TOC highlighting (showing which section the user is reading). The native `IntersectionObserver` API is sufficient for this use case. A custom `useScrollSpy` hook (30-40 lines) using `IntersectionObserver` directly avoids adding a dependency for one feature. React 18's `useRef` + `useEffect` pattern handles this cleanly. The existing project already uses custom hooks (`useOffline`, `useFavourites`, `useSearch`) -- this pattern is consistent.

### DO NOT add `tocbot` or any TOC generation library

**Reasoning:** TOC libraries are designed for blogs/docs sites where headings are parsed from rendered HTML. The COP content already has a perfect hierarchical structure in `sections_hierarchy.json` with numbered sections (1, 1.1, 1.1.1, etc.). The TOC is data-driven from the JSON, not parsed from DOM headings. Building a `<TableOfContents>` component from the JSON is simpler and more reliable than retrofitting a DOM-parsing library.

### DO NOT add `framer-motion`

**Reasoning:** The collapsible/accordion animations are handled natively by Radix UI primitives with CSS transitions via Tailwind's `data-[state=open]` / `data-[state=closed]` selectors and `tailwindcss-animate` (already installed). No animation library needed for expand/collapse.

### DO NOT add `@napi-rs/canvas`

**Reasoning:** This is listed as a requirement for `unpdf` rendering (page-to-image rasterization). We do NOT need page rendering -- we need image extraction. The `extractImages()` function returns raw pixel data that `sharp` converts to PNG. No canvas rendering required for this use case.

### DO NOT add a CMS or structured text renderer

**Reasoning:** DatoCMS Structured Text, Contentful Rich Text Renderer, and similar are designed for CMS-delivered content with embedded blocks. The COP content is local JSON with a known schema. A custom renderer is simpler, has zero API calls, and matches the data shape exactly.

---

## Integration Points with Existing Stack

### 1. Content Data Flow

```
sections_hierarchy.json (3.8MB, 19 chapters)
    |
    v
Drizzle: New `cop_sections` table (imported via seed script)
    |
    v
Server Component: Fetch chapter/section by number
    |
    v
<SectionContent>: Render text + inline images
    |
    +-> <CollapsiblePanel type="3d">: Embed existing Model3DViewer
    +-> <CollapsiblePanel type="htg">: Embed HTG content
    +-> <CollapsiblePanel type="case-law">: Embed existing DynamicWarning
```

### 2. Database Schema Additions

The `sections_hierarchy.json` data needs to be imported into PostgreSQL for efficient querying (the 3.8MB JSON should not be loaded client-side in full). New tables required:

```typescript
// New table: COP Sections (hierarchical)
export const copSections = pgTable('cop_sections', {
  id: text('id').primaryKey(),              // e.g., 'mrm-8.4.2'
  sourceId: text('source_id').references(() => contentSources.id),
  number: text('number').notNull(),          // '8.4.2'
  title: text('title').notNull(),
  content: text('content'),                  // Full section text
  parentNumber: text('parent_number'),       // '8.4' (null for chapters)
  chapterNumber: text('chapter_number'),     // '8'
  depth: integer('depth').notNull(),         // 0=chapter, 1=section, 2=subsection...
  pdfPages: jsonb('pdf_pages').$type<number[]>(),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  numberIdx: index('idx_cop_sections_number').on(table.number),
  parentIdx: index('idx_cop_sections_parent').on(table.parentNumber),
  chapterIdx: index('idx_cop_sections_chapter').on(table.chapterNumber),
}));

// New table: Section-Image mapping
export const copSectionImages = pgTable('cop_section_images', {
  sectionNumber: text('section_number').notNull(),
  imageFilename: text('image_filename').notNull(),
  imageUrl: text('image_url'),               // R2 URL
  caption: text('caption'),
  sortOrder: integer('sort_order').default(0),
}, (table) => ({
  pk: primaryKey({ columns: [table.sectionNumber, table.imageFilename] }),
  sectionIdx: index('idx_section_images_section').on(table.sectionNumber),
}));

// New table: HTG Content (extracted from PDFs)
export const htgSections = pgTable('htg_sections', {
  id: text('id').primaryKey(),
  guideType: text('guide_type').notNull(),   // 'flashings', 'penetrations', 'cladding'
  title: text('title').notNull(),
  content: text('content'),
  pageNumber: integer('page_number'),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// New table: HTG Images
export const htgImages = pgTable('htg_images', {
  id: text('id').primaryKey(),
  htgSectionId: text('htg_section_id').references(() => htgSections.id),
  imageUrl: text('image_url'),               // R2 URL
  caption: text('caption'),
  sortOrder: integer('sort_order').default(0),
});

// New table: COP-HTG cross-references
export const copHtgLinks = pgTable('cop_htg_links', {
  copSectionNumber: text('cop_section_number').notNull(),
  htgSectionId: text('htg_section_id').references(() => htgSections.id).notNull(),
  relevance: text('relevance'),              // 'primary', 'supplementary'
}, (table) => ({
  pk: primaryKey({ columns: [table.copSectionNumber, table.htgSectionId] }),
}));
```

### 3. Route Structure

New routes within existing `(dashboard)` layout group:

```
app/(dashboard)/cop/
  page.tsx                    # COP home - chapter listing (19 chapters)
  [chapter]/
    page.tsx                  # Chapter view with sections + TOC sidebar
    [section]/
      page.tsx                # Deep section view (e.g., /cop/8/8.4.2)
```

These sit alongside existing `/planner`, `/fixer`, `/search` routes. The sidebar adds a "Code of Practice" nav item with chapter-level expandable navigation.

### 4. Zustand Store Extensions

```typescript
// Extend existing app-store.ts
interface COPReaderSlice {
  // TOC state
  expandedChapters: Set<string>;       // Which chapters are expanded in TOC
  activeSection: string | null;         // Currently visible section (scroll-spy)

  // Reading state
  lastReadSection: string | null;       // Resume reading position
  readingSections: Set<string>;         // Sections the user has scrolled through

  // Panel state
  expandedPanels: Record<string, boolean>; // Which supplementary panels are open

  // Actions
  toggleChapter: (chapter: string) => void;
  setActiveSection: (section: string | null) => void;
  togglePanel: (panelId: string) => void;
}
```

### 5. Image Pipeline

MRM COP images (775 files) are already uploaded to R2 with URLs in `r2_image_urls.json`. The section-image mapping exists in `images_manifest.json` (772 images mapped to section numbers). The seed script will populate `cop_section_images` from these two sources.

HTG images will be extracted by the build-time script and uploaded to R2 via the existing `scripts/upload-mrm-images-to-r2.ts` pattern.

---

## HTG PDF Extraction Pipeline

### Architecture

This is a **build-time script pipeline**, not a runtime feature. It runs once (or when HTG PDFs are updated) and produces structured data that gets seeded into the database.

```
HTG PDFs (3 guides)
    |
    v
scripts/extract-htg.ts (Node.js, uses unpdf + sharp)
    |
    v
htg_extract/
  flashings/
    sections.json           # Extracted text with page numbers
    images/                 # Extracted images as PNG
  penetrations/
    sections.json
    images/
  cladding/
    sections.json
    images/
    |
    v
scripts/upload-htg-to-r2.ts (reuses existing R2 upload pattern)
    |
    v
scripts/import-htg.ts (seeds htg_sections + htg_images tables)
```

### Key Considerations for HTG PDFs

1. **File sizes are extreme**: Penetrations PDF is 352MB, Cladding is ~100MB. These are press-quality artwork files with embedded high-resolution images. The extraction script must:
   - Process pages sequentially (not load entire PDF into memory)
   - Extract images at web-appropriate resolution (1200px max width)
   - Use `sharp` to convert raw pixel data to optimized WebP/PNG

2. **Text content may be minimal**: These are "How To Guide" artwork PDFs, not text-heavy documents. They likely contain mostly large diagrams with captions and brief instructions. The extraction script should handle pages that are primarily images with small text labels.

3. **Page-by-page processing**: Use `unpdf`'s `getDocumentProxy` + iterate pages, rather than loading all at once:
   ```typescript
   import { getDocumentProxy, extractText, extractImages } from 'unpdf';

   const pdf = await getDocumentProxy(new Uint8Array(buffer));
   for (let page = 1; page <= pdf.numPages; page++) {
     const text = await extractText(pdf, { mergePages: false });
     const images = await extractImages(pdf, page);
     // Process with sharp, save to htg_extract/
   }
   ```

### Script Dependencies

```bash
# Dev dependency only (build-time extraction)
npm install -D unpdf
```

`sharp` is already a devDependency at ^0.34.5. No additional packages needed.

---

## Component Architecture for New Features

### New shadcn/ui Components to Install

```bash
# These use the Radix primitives listed above
npx shadcn-ui@latest add accordion
npx shadcn-ui@latest add collapsible
npx shadcn-ui@latest add scroll-area
```

This will add:
- `components/ui/accordion.tsx` (wraps @radix-ui/react-accordion)
- `components/ui/collapsible.tsx` (wraps @radix-ui/react-collapsible)
- `components/ui/scroll-area.tsx` (wraps @radix-ui/react-scroll-area)

### New Custom Components

| Component | Location | Responsibility |
|-----------|----------|---------------|
| `TableOfContents` | `components/cop/TableOfContents.tsx` | Sticky sidebar with chapter/section tree. Uses Accordion for expand/collapse. ScrollArea for overflow. Highlights active section via scroll-spy. |
| `SectionContent` | `components/cop/SectionContent.tsx` | Renders a COP section's text content as semantic HTML. Splits paragraphs on newlines. Inserts inline images from section-image mapping. Adds `id` attributes for deep linking. |
| `SupplementaryPanel` | `components/cop/SupplementaryPanel.tsx` | Collapsible inline panel within section content. Variants: `3d-viewer`, `htg-guide`, `case-law`, `detail-link`. Uses Collapsible primitive. |
| `ChapterHeader` | `components/cop/ChapterHeader.tsx` | Chapter title, section count, reading progress indicator. |
| `SectionAnchor` | `components/cop/SectionAnchor.tsx` | Section number heading with copy-link button and hash anchor. |
| `useScrollSpy` | `hooks/useScrollSpy.ts` | Custom hook using IntersectionObserver to track which section is in view. Updates Zustand store's `activeSection`. |
| `useSectionDeepLink` | `hooks/useSectionDeepLink.ts` | Reads URL hash on mount, scrolls to target section. Handles Next.js App Router hash navigation quirks. |

### Component Composition

```tsx
// Page: /cop/[chapter]/page.tsx
<div className="flex">
  {/* Left: Sticky TOC sidebar */}
  <ScrollArea className="w-64 h-[calc(100vh-4rem)] sticky top-16">
    <TableOfContents
      chapters={chapters}
      activeSection={activeSection}
      expandedChapters={expandedChapters}
    />
  </ScrollArea>

  {/* Right: Section content */}
  <main className="flex-1 max-w-3xl mx-auto px-6 py-8">
    <ChapterHeader chapter={chapter} />

    {sections.map(section => (
      <article key={section.number} id={section.number}>
        <SectionAnchor number={section.number} title={section.title} />
        <SectionContent
          content={section.content}
          images={sectionImages[section.number]}
        />

        {/* Inline supplementary panels */}
        {section.linkedDetails?.map(detail => (
          <SupplementaryPanel key={detail.id} type="detail-link" detail={detail} />
        ))}
        {section.linkedHTG?.map(htg => (
          <SupplementaryPanel key={htg.id} type="htg-guide" htg={htg} />
        ))}
        {section.linkedCaseLaw?.map(c => (
          <SupplementaryPanel key={c.id} type="case-law" caseData={c} />
        ))}

        {/* Recursive subsections */}
        {section.subsections?.map(sub => (
          <SectionContent key={sub.number} section={sub} depth={depth + 1} />
        ))}
      </article>
    ))}
  </main>
</div>
```

---

## Deep Linking Strategy

### URL Pattern

```
/cop                          # Chapter listing
/cop/8                        # Chapter 8: External Moisture Flashings
/cop/8#8.4.2                  # Chapter 8, scrolled to section 8.4.2
/cop/8/8.4.2                  # Direct section page (alternative for very deep sections)
```

### Implementation

Next.js App Router supports `#hash` in `<Link href>`. The hash-based approach is preferred because:
1. Section content is rendered on the chapter page (no extra route/fetch)
2. Browser-native scroll behavior works with `id` attributes
3. Shareable URLs that resolve to the correct scroll position
4. Back/forward navigation preserves position

For initial load with hash, use `useSectionDeepLink` hook:
```typescript
'use client';
import { useEffect } from 'react';

export function useSectionDeepLink() {
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      // Small delay for SSR hydration
      requestAnimationFrame(() => {
        const el = document.getElementById(hash);
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }, []);
}
```

---

## Installation Commands

```bash
# New runtime dependencies (Radix primitives for shadcn components)
npm install @radix-ui/react-accordion@^1.2.12 @radix-ui/react-collapsible@^1.1.12 @radix-ui/react-scroll-area@^1.2.10

# New dev dependency (HTG PDF extraction - build-time only)
npm install -D unpdf@^1.4.0

# shadcn/ui component generation (creates component wrapper files)
npx shadcn-ui@latest add accordion
npx shadcn-ui@latest add collapsible
npx shadcn-ui@latest add scroll-area
```

**Total new packages: 4** (3 Radix primitives + 1 dev dependency)
**Bundle impact: Minimal** -- Radix primitives are tree-shaken, typically 3-8KB each gzipped. `unpdf` is dev-only, zero runtime impact.

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| PDF extraction | `unpdf` ^1.4.0 | `pdf-parse` ^2.4.5 | `pdf-parse` is unmaintained, no TypeScript types, CJS-only. `unpdf` is ESM-native, TypeScript-first, actively maintained by UnJS. |
| PDF extraction | `unpdf` | `pdf.js-extract` ^0.2.1 | Last published 3 years ago. Provides text position coordinates (useful) but unmaintained. |
| PDF extraction | `unpdf` | `pdf2json` | Heavier, designed for layout reconstruction which we do not need. |
| Accordion UI | `@radix-ui/react-accordion` | Custom `useState` toggle (current sidebar pattern) | Sidebar already uses manual toggle. For multi-level chapter TOC (19 chapters x ~5-10 sections each), need proper keyboard navigation, aria-expanded, focus management. Radix handles this. |
| Scroll spy | Native `IntersectionObserver` | `react-intersection-observer` ^10.0.2 | Adding a dependency for one hook is overkill. The hook is ~35 lines. The project already has 4 custom hooks. |
| Content rendering | Custom `<SectionContent>` | `react-markdown` + rehype plugins | Content is plain text, not Markdown. Adding a Markdown pipeline for non-Markdown content is the wrong abstraction. |
| Animation | Tailwind CSS + `tailwindcss-animate` | `framer-motion` | Already have `tailwindcss-animate` which provides `data-[state=open]` transitions. Framer Motion adds ~30KB for accordion open/close animations that CSS handles fine. |
| TOC generation | Data-driven from JSON | `tocbot` / remark-toc | TOC libraries parse DOM headings. COP sections are structured data with explicit numbers. Data-driven is more reliable. |

---

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| Radix Accordion/Collapsible/ScrollArea | HIGH | Already using 12 Radix primitives. Same installation pattern. shadcn/ui docs confirm these components exist. Versions verified via npm. |
| unpdf for HTG extraction | HIGH | Version 1.4.0 verified on npm. API documented on GitHub (extractText, extractImages). Used with sharp for image processing -- sharp already in project. |
| No react-markdown needed | HIGH | Examined sections_hierarchy.json content directly. It is plain text with newlines, not Markdown. Custom renderer is the correct approach. |
| No react-intersection-observer needed | HIGH | IntersectionObserver API is standard browser API. Custom hook pattern matches existing project conventions (useOffline, useFavourites, useSearch). |
| Database schema additions | MEDIUM | Schema design is based on the data shapes in sections_hierarchy.json and images_manifest.json. Final table structure may adjust during implementation based on query patterns. |
| Deep linking via hash | MEDIUM | Next.js App Router supports hash in Link href natively. Known quirk: initial page load with hash may not scroll correctly without the `requestAnimationFrame` workaround. Verified in Next.js discussions. |
| HTG PDF text quality | LOW | The HTG PDFs are press-quality artwork files. Text extraction quality is unknown until tested. Penetrations PDF (352MB) may be primarily images with minimal extractable text. The extraction script should handle this gracefully. |

---

## Sources

**Package Versions (verified February 2026):**
- [unpdf on npm](https://www.npmjs.com/package/unpdf) - v1.4.0, PDF.js v5.4
- [unpdf on GitHub](https://github.com/unjs/unpdf) - extractText, extractImages API
- [@radix-ui/react-accordion on npm](https://www.npmjs.com/package/@radix-ui/react-accordion) - v1.2.12
- [@radix-ui/react-collapsible on npm](https://www.npmjs.com/package/@radix-ui/react-collapsible) - v1.1.12
- [@radix-ui/react-scroll-area on npm](https://www.npmjs.com/package/@radix-ui/react-scroll-area) - v1.2.10
- [sharp on npm](https://www.npmjs.com/package/sharp) - v0.34.5

**UI Component Documentation:**
- [shadcn/ui Accordion](https://ui.shadcn.com/docs/components/radix/accordion)
- [shadcn/ui Collapsible](https://ui.shadcn.com/docs/components/radix/collapsible)
- [Radix Accordion Primitives](https://www.radix-ui.com/primitives/docs/components/accordion)
- [Radix Collapsible Primitives](https://www.radix-ui.com/primitives/docs/components/collapsible)

**PDF Extraction Comparison:**
- [7 PDF Parsing Libraries for Node.js (Strapi, 2025)](https://strapi.io/blog/7-best-javascript-pdf-parsing-libraries-nodejs-2025)
- [pdf-parse on npm](https://www.npmjs.com/package/pdf-parse) - v2.4.5 (unmaintained reference)

**Next.js Deep Linking:**
- [Next.js Link Component](https://nextjs.org/docs/app/api-reference/components/link) - hash fragment support
- [Handling Hashes in Next.js](https://medium.com/@dodanieloluwadare/handling-hashes-in-react-next-js-applications-21aac1ed9a1b)
- [Next.js Hash Fragment Discussion](https://github.com/vercel/next.js/discussions/82649)

**Scroll Spy Pattern:**
- [Scrollspy Demystified (Maxime Heckel)](https://blog.maximeheckel.com/posts/scrollspy-demystified/)
- [DIY ScrollSpy with IntersectionObserver](https://blog.devgenius.io/diy-scrollspy-4f1c270cafaf)

---

*Last updated: 2026-02-08*
