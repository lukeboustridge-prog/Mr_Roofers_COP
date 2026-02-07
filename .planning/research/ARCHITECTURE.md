# Architecture: COP Reader Integration (v1.2)

**Project:** Master Roofers COP v1.2 (Digital COP)
**Dimension:** Architecture -- data model, routing, rendering, integration
**Researched:** 2026-02-08
**Confidence:** HIGH (based on direct codebase inspection of all relevant files)

---

## Executive Summary

The v1.2 Digital COP adds a chapter-based reader that mirrors the MRM COP PDF's 19-chapter structure. The core architectural question is: **where does the full COP text live -- database, static JSON, or hybrid?**

**Recommendation: Hybrid approach.** Import `sections_hierarchy.json` structure into a new `cop_sections` database table for queryable navigation (TOC, breadcrumbs, search, section-to-detail linking), but serve section content text from pre-built per-chapter static JSON files for fast CDN-cached delivery. This avoids the 3.8MB monolith while enabling relational queries for cross-referencing with details, images, HTG content, and case law.

---

## 1. Data Model

### 1.1 The Core Decision: DB vs JSON vs Hybrid

The `sections_hierarchy.json` file is 3.8MB containing all 19 chapters with nested subsections and full text content for every section. Three approaches were evaluated:

**Option A: Full DB import** -- Every section becomes a row with content stored as a text column.

| Pro | Con |
|-----|-----|
| Full SQL queries (search, join, filter) | 624-page text corpus in PostgreSQL = heavy reads |
| Section-to-detail linking via FK | Content updates require re-running migration pipeline |
| Existing Drizzle patterns apply | Large text columns degrade query perf on section rendering |

**Option B: Serve from static JSON** -- Keep `sections_hierarchy.json` as-is, load at runtime.

| Pro | Con |
|-----|-----|
| Zero migration effort | 3.8MB single file -- massive initial load, kills mobile perf |
| No DB schema changes | Cannot query sections in SQL (no search, no joins to details) |
| Simple deployment | No relational links to details, images, case law |

**Option C: Hybrid (RECOMMENDED)** -- Import structure metadata (number, title, parent, depth, pdf_pages) into DB. Split full-text content into per-chapter JSON files served as static assets from `/public/cop/`.

| Pro | Con |
|-----|-----|
| SQL for navigation tree, search, linking | Two data stores (but content only changes quarterly) |
| Fast content delivery (per-chapter ~200KB avg) | Build step to split JSON (one-time script) |
| Images/details/HTG link via section number FK | -- |
| CDN-cacheable, offline-cacheable content files | -- |
| Content updates: re-run import script + split | -- |

### 1.2 New Table: `cop_sections`

Stores the COP hierarchy structure (no content text -- that stays in JSON files):

```typescript
export const copSections = pgTable('cop_sections', {
  id: text('id').primaryKey(),                      // e.g., 'cop-8-5-4'
  number: text('number').notNull().unique(),         // e.g., '8.5.4' (the JSON key)
  title: text('title').notNull(),                    // e.g., 'Change of Pitch'
  chapterNumber: integer('chapter_number').notNull(), // Top-level chapter (8)
  parentNumber: text('parent_number'),               // Parent section ('8.5'), null for chapters
  depth: integer('depth').notNull(),                  // 0=chapter, 1=section, 2=subsection, 3=sub-sub
  sortOrder: integer('sort_order').notNull(),         // Sequential integer for rendering order
  pdfPages: jsonb('pdf_pages').$type<number[]>(),    // [45, 46, 47] from JSON
  hasContent: boolean('has_content').default(true),   // false for container-only nodes
  imageCount: integer('image_count').default(0),      // Pre-computed from images_manifest
  detailCount: integer('detail_count').default(0),    // Pre-computed linked detail count
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  numberIdx: index('idx_cop_sections_number').on(table.number),
  chapterIdx: index('idx_cop_sections_chapter').on(table.chapterNumber),
  parentIdx: index('idx_cop_sections_parent').on(table.parentNumber),
}));
```

**Why no `content` column?** The full text for all 19 chapters totals ~3.8MB. Storing it in PostgreSQL would work but creates unnecessarily heavy queries for every section page render. Section content is display-only (not filtered or joined), so it belongs in a CDN-cached static file, not a database column.

**Estimated rows:** 800-1200 sections across 19 chapters. Chapter 3 (Structure) and Chapter 8 (External Moisture - Flashings) are the deepest with 4 levels of nesting. Based on the `sections_hierarchy.json` structure, most sections have at most 3 levels of depth.

### 1.3 New Table: `cop_section_images`

Maps the 775 MRM technical images to their COP sections. Data source: `images_manifest.json` (contains `section` field with section numbers like "8.5.4") combined with `r2_image_urls.json` (contains R2 public URLs).

```typescript
export const copSectionImages = pgTable('cop_section_images', {
  sectionNumber: text('section_number').notNull(),   // '8.5.4' or '8.5.4A' (includes labeled variants)
  imageFilename: text('image_filename').notNull(),    // 'section-detail-1234.png'
  imageUrl: text('image_url').notNull(),              // Full R2 public URL
  sortOrder: integer('sort_order').default(0),        // Within-section ordering
  caption: text('caption'),                           // From manifest (often empty)
  sourcePage: integer('source_page'),                 // PDF page number
}, (table) => ({
  pk: primaryKey({ columns: [table.sectionNumber, table.imageFilename] }),
  sectionIdx: index('idx_cop_section_images_section').on(table.sectionNumber),
}));
```

**Important detail from manifest analysis:** Some images have section numbers like "8.2A", "8.4K", "8.5.2C" (letter suffixes). These are labeled sub-figures within a section. The `sectionNumber` column must accommodate these variants. When rendering section 8.2, query with `sectionNumber LIKE '8.2%'` or use a GIN index on a prefix pattern.

**Orphaned images:** 3 images in the manifest have `"section": null`. These are excluded from the section-image mapping but remain accessible via their R2 URLs.

### 1.4 New Table: `cop_section_details`

Connects COP sections to existing `details` table rows. This enables the supplementary panels ("Related Details" panel showing F07 Valley Flashing when viewing section 8.5.2):

```typescript
export const copSectionDetails = pgTable('cop_section_details', {
  sectionNumber: text('section_number').notNull(),
  detailId: text('detail_id').references(() => details.id).notNull(),
  linkType: text('link_type').notNull(),   // 'describes' | 'references' | 'illustrates'
}, (table) => ({
  pk: primaryKey({ columns: [table.sectionNumber, table.detailId] }),
  sectionIdx: index('idx_cop_section_details_section').on(table.sectionNumber),
  detailIdx: index('idx_cop_section_details_detail').on(table.detailId),
}));
```

**Population strategy:** The `details` table has 251 MRM details that were originally extracted from specific COP PDF sections. The import script should use the detail descriptions and existing `standardsRefs` to map details back to their source sections. Some will require manual mapping via the admin interface.

### 1.5 HTG Content Storage

HTG (How To Guide) PDFs are a new content type. Three guides are planned: Flashings, Penetrations, Cladding. These are RANZ-authored supplementary material (not MRM authoritative content) and must maintain visual distinction per the v1.1 authority model.

```typescript
export const htgContent = pgTable('htg_content', {
  id: text('id').primaryKey(),                       // e.g., 'htg-flashings-01'
  guideSlug: text('guide_slug').notNull(),            // 'flashings' | 'penetrations' | 'cladding'
  title: text('title').notNull(),
  content: text('content').notNull(),                 // Rendered HTML from PDF extraction
  sortOrder: integer('sort_order').default(0),
  pdfSourcePage: integer('pdf_source_page'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const copSectionHtg = pgTable('cop_section_htg', {
  sectionNumber: text('section_number').notNull(),
  htgContentId: text('htg_content_id').references(() => htgContent.id).notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.sectionNumber, table.htgContentId] }),
  sectionIdx: index('idx_cop_section_htg_section').on(table.sectionNumber),
}));
```

**Why separate from `cop_sections`?** HTG content is supplementary (grey border, "RANZ Guide" badge). It should never be inlined into MRM section text. The junction table `cop_section_htg` enables one HTG entry to link to multiple COP sections and vice versa.

### 1.6 Schema Addition Summary

| New Table | Purpose | Estimated Rows |
|-----------|---------|----------------|
| `cop_sections` | COP structure tree (chapters through sub-subsections) | 800-1200 |
| `cop_section_images` | Section-to-image mapping from manifest | ~775 |
| `cop_section_details` | Section-to-detail cross-references | 400-600 |
| `htg_content` | Extracted HTG guide content blocks | 50-100 |
| `cop_section_htg` | Section-to-HTG linking | 50-100 |

**Total: 5 new tables. Zero changes to existing 15 tables.**

---

## 2. Content Delivery: Per-Chapter JSON

### 2.1 File Structure

Split `sections_hierarchy.json` (3.8MB) into 19 static JSON files:

```
public/cop/
  chapter-1.json     # Introduction
  chapter-2.json     # Glossary
  chapter-3.json     # Structure
  chapter-4.json     # Durability
  chapter-5.json     # Roof Drainage
  chapter-6.json     # External Moisture (Underlays)
  chapter-7.json     # External Moisture (Penetrations/Flashings Principles)
  chapter-8.json     # External Moisture (Flashings) -- largest, ~500KB
  chapter-9.json     # External Moisture (Cladding)
  chapter-10.json    # Internal Moisture
  chapter-11.json    # Roof Ventilation
  chapter-12.json    # Thermal Insulation
  chapter-13.json    # Transport
  chapter-14.json    # Maintenance
  chapter-15.json    # Curved Roofing
  chapter-16.json    # Materials
  chapter-17.json    # Testing
  chapter-18.json    # Sustainability
  chapter-19.json    # Revision History
```

### 2.2 Per-Chapter JSON Schema

Each file preserves the nested structure from `sections_hierarchy.json` but contains only one chapter:

```typescript
interface ChapterJSON {
  number: string;          // "8"
  title: string;           // "External Moisture"
  content: string;         // Full chapter-level text
  pdf_pages: number[];     // PDF page range
  subsections: {
    [key: string]: {       // "8.1", "8.2", etc.
      number: string;
      title: string;
      content: string;
      pdf_pages: number[];
      subsections: {
        [key: string]: SectionNode;  // Recursive nesting
      };
    };
  };
}
```

### 2.3 Content Lookup at Runtime

A section page for `/cop/8.5.4` fetches `chapter-8.json` and traverses:
```typescript
const chapter = await fetch('/cop/chapter-8.json').then(r => r.json());
const section = chapter.subsections['8.5']?.subsections['8.5.4'];
// section.content contains the full text to render
```

This fetch is CDN-cached (static file in `/public/`), costs zero DB queries for content, and can be pre-cached by the service worker for offline access.

---

## 3. Routing Strategy

### 3.1 URL Structure Decision

Three options evaluated:

| Option | Example | Verdict |
|--------|---------|---------|
| Slash-separated | `/cop/8/5/4` | Rejected: each segment not independently meaningful; requires catch-all `[...section]` with ambiguous depth |
| Dot-notation (RECOMMENDED) | `/cop/8.5.4` | Clean single param; mirrors how roofers already cite sections ("section 8.5.4"); easy to parse |
| Query param | `/cop/8?s=5.4` | Rejected: awkward for deep links; breaks browser history for section navigation |

**Recommendation: Dot-notation** (`/cop/8.5.4`) with chapter-only fallback (`/cop/8`).

### 3.2 Route File Structure

```
app/(dashboard)/
  cop/
    page.tsx                    # COP Home: 19-chapter card grid
    layout.tsx                  # COP-specific layout (adds chapter sidebar on desktop)
    [sectionNumber]/
      page.tsx                  # Universal section reader
```

The `[sectionNumber]` dynamic segment handles all depths:
- `/cop/8` -- Chapter 8 overview: chapter intro text + list of sections
- `/cop/8.5` -- Section 8.5: section text + list of subsections
- `/cop/8.5.4` -- Subsection 8.5.4: full content + images + supplementary panels

The page component parses the section number, determines depth, queries `cop_sections` for metadata, fetches per-chapter JSON for content, and renders accordingly.

### 3.3 Route Coexistence

The COP reader is a new peer route under `(dashboard)`. No existing routes are modified or removed:

```
app/(dashboard)/
  page.tsx              # Home -- existing, unchanged
  cop/                  # NEW
    page.tsx
    layout.tsx
    [sectionNumber]/
      page.tsx
  planner/              # PRESERVED (de-emphasised in nav, fully functional)
    [substrate]/
      [category]/
        [detailId]/
  fixer/                # PRESERVED as-is
  topics/               # PRESERVED
  search/               # PRESERVED (section search updated to redirect to /cop/)
  failures/             # PRESERVED
  favourites/           # PRESERVED
  checklists/           # PRESERVED
  settings/             # PRESERVED
```

---

## 4. COP Reader Layout

### 4.1 Desktop: Contextual Chapter Sidebar

When inside `/cop/*`, the reader uses a dedicated layout (`app/(dashboard)/cop/layout.tsx`) that adds a chapter-section tree sidebar alongside the main content area:

```
+------------------------------------------------------------------+
| Header (existing)                                                 |
+----------+-------------------------------------------------------+
| Main     | Chapter    | Section Content                          |
| Sidebar  | Sidebar    |                                          |
| (existing| (NEW -     | [Breadcrumb: COP > 8. External > 8.5 >] |
|  64w)    | contextual | [Title: 8.5.4 Change of Pitch]          |
|          | tree)      | [Content text with inline images]       |
|          |            | [Subsection list]                        |
|          | Ch 1 Intro | [Supplementary panels (collapsible)]     |
|          | Ch 2 Gloss |   [RANZ 3D Model: F12]                   |
|          | ...        |   [HTG: Flashings Guide]                 |
|          | Ch 8 Ext M |   [Case Law: 2 determinations]           |
|          |   8.1      |   [Related Details: F12, F13]            |
|          |   8.2      |                                          |
|          |   8.3      |                                          |
|          |   8.4      |                                          |
|          | > 8.5      |                                          |
|          |   8.5.1    |                                          |
|          |   8.5.2    |                                          |
|          |   8.5.3    |                                          |
|          | * 8.5.4 <- |                                          |
|          |   8.5.5    |                                          |
|          | Ch 9 ...   |                                          |
+----------+------------+------------------------------------------+
```

The chapter sidebar:
- Shows all 19 chapters as collapsible headings
- Auto-expands the current chapter
- Highlights the current section
- Shows section numbers with titles (e.g., "8.5.4 Change of Pitch")
- Scrolls to keep current section visible

**Implementation:** The `cop/layout.tsx` nests inside the existing `(dashboard)/layout.tsx`. It does NOT replace the main sidebar; it adds a second contextual sidebar to the right of the main one.

### 4.2 Mobile: Chapter Drawer

On mobile, the chapter sidebar becomes a slide-out drawer triggered by a floating "Chapters" button:

```
+----------------------------------+
| Header                           |
|                                  |
| [Breadcrumb: 8 > 8.5 > 8.5.4]  |
| 8.5.4 Change of Pitch           |
|                                  |
| [Section content text]           |
| [Inline image from R2]           |
| [More content text]              |
|                                  |
| v Supplementary Content          |
|   [RANZ 3D Model panel]         |
|   [HTG Guide panel]             |
|                                  |
+----------------------------------+
| Home | COP | Search | Fixer | .. |
+----------------------------------+
         ^
     [Chapters]  <- Floating button
         |
    opens drawer with chapter tree
```

### 4.3 Navigation UI Changes

**Sidebar.tsx modifications:**

```typescript
// Current primary nav
const mainNavItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/planner', label: 'Planner', icon: Clipboard },       // demoted
  { href: '/fixer', label: 'Fixer', icon: Wrench },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/favourites', label: 'Favourites', icon: Star },
];

// Updated primary nav
const mainNavItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/cop', label: 'COP Reader', icon: BookOpen },         // NEW, primary position
  { href: '/search', label: 'Search', icon: Search },
  { href: '/favourites', label: 'Favourites', icon: Star },
];

// "Browse" or "Tools" section
const browseNavItems = [
  { href: '/planner', label: 'Detail Planner', icon: Clipboard },  // moved here
  { href: '/topics', label: 'Topics', icon: Layers },
  { href: '/fixer', label: 'Fixer', icon: Wrench },
];
```

**MobileNav.tsx modifications:**

```typescript
// Current bottom nav
const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/fixer', label: 'Fixer', icon: Wrench },
  { href: '/favourites', label: 'Saved', icon: Star },
];

// Updated bottom nav
const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/cop', label: 'COP', icon: BookOpen },      // replaces Fixer position
  { href: '/search', label: 'Search', icon: Search },
  { href: '/fixer', label: 'Fixer', icon: Wrench },
];
// Saved/Favourites moves into the Menu sheet (already has it in secondary nav)
```

---

## 5. Rendering Strategy

### 5.1 Section Page: Server Component

Each section page is a **Server Component** with this data flow:

```
Server Component (page.tsx)
  |
  +-- 1. Query cop_sections WHERE number = '8.5.4'
  |       -> { id, title, chapterNumber: 8, parentNumber: '8.5', depth: 2, pdfPages }
  |
  +-- 2. Query cop_sections WHERE parentNumber = '8.5.4'
  |       -> Child sections for subsection navigation list
  |
  +-- 3. Build breadcrumb: walk up parentNumber chain
  |       -> [{ number: '8', title: 'External Moisture' },
  |           { number: '8.5', title: 'Flashing Types' }]
  |
  +-- 4. Fetch /public/cop/chapter-8.json (static file, CDN-cached)
  |       Extract content for key path: subsections['8.5'].subsections['8.5.4'].content
  |
  +-- 5. Query cop_section_images WHERE sectionNumber LIKE '8.5.4%'
  |       -> [{ imageUrl, caption, sortOrder, sourcePage }]
  |
  +-- 6. Query cop_section_details WHERE sectionNumber = '8.5.4'
  |       JOIN details, contentSources, detailLinks
  |       -> Linked detail summaries with 3D model / step availability
  |
  +-- 7. Query cop_section_htg WHERE sectionNumber = '8.5.4'
  |       JOIN htg_content
  |       -> HTG guide excerpts for supplementary panel
  |
  +-- 8. Query failure_cases linked to section's details
  |       -> Case law summaries for supplementary panel
  |
  v
  Render: SectionContent + InlineImages + SubsectionList + SupplementaryPanels
```

### 5.2 Content Rendering Component

The `SectionContent` component renders the raw text from the chapter JSON as rich HTML. The COP text contains:
- Multi-paragraph prose
- Numbered/bulleted lists
- Reference citations (e.g., "see 8.5.4A")
- Table data (some sections contain specification tables)

**Rendering approach:** The content text from the JSON is plain text with section/page markers (e.g., lines containing "This is a controlled document..."). A content processing function should:
1. Strip boilerplate footer lines ("This is a controlled document...")
2. Detect and convert inline section references to clickable links (`/cop/{number}`)
3. Insert `<Image>` components at appropriate positions based on image section numbers
4. Detect table-like content (from `tables.json`) and render as HTML tables

### 5.3 Supplementary Panels (Client Component)

Supplementary panels are collapsible sections rendered as a **Client Component** (needs interactivity for accordion state):

```typescript
interface SupplementaryPanelsProps {
  sectionNumber: string;
  linkedDetails: Array<{
    id: string; code: string; name: string;
    sourceId: string; sourceName: string;
    modelUrl: string | null;
    hasSteps: boolean;
  }>;
  htgContent: Array<{
    id: string; title: string; content: string;
    guideSlug: string;
  }>;
  failureCases: Array<{
    id: string; caseId: string; summary: string;
    outcome: string;
  }>;
}
```

Each panel type:
- **RANZ 3D Model:** Shows if any linked detail has `modelUrl`. Uses existing `Model3DViewer` via `next/dynamic` (already lazy-loaded pattern in codebase).
- **HTG Guide:** Renders HTG content text with grey border + "RANZ Guide" badge (authority model).
- **Case Law:** Shows `CautionaryTag` badges linking to `/failures/{caseId}` (existing component).
- **Related Details:** Cards linking to `/planner/{substrate}/{category}/{detailId}` (existing navigation).

### 5.4 Image Rendering

Images from `cop_section_images` are rendered inline within section content:

```typescript
// InlineImage component
<figure className="my-4">
  <Image
    src={imageUrl}          // R2 public URL
    alt={caption || `${sectionNumber} diagram`}
    width={dimensions.width}
    height={dimensions.height}
    loading="lazy"
    className="rounded-lg border"
  />
  {caption && (
    <figcaption className="mt-2 text-sm text-slate-500 text-center">
      {caption}
    </figcaption>
  )}
</figure>
```

**Placement logic:** Images with section number "8.5.4A" appear after the main content of section 8.5.4. Images labeled "8.5.4B", "8.5.4C" etc. appear in order. The letter suffix represents figure labels within the section.

---

## 6. Integration Points

### 6.1 Components Reused Without Modification

| Component | Current Use | COP Reader Use |
|-----------|-------------|----------------|
| `Model3DViewer` | Detail page 3D viewer | Supplementary panel (linked detail's 3D model) |
| `DynamicWarning` | Detail page warnings | Section warnings panel |
| `CautionaryTag` | Detail page failure badges | Case law badges in section view |
| `FailureBadge` | Detail card failure count | Section cards with failure count |
| `Breadcrumbs` | All pages | COP section breadcrumb chain |
| `Badge` | Various | Chapter/section metadata display |
| `Card` | Various | Chapter cards on COP home page |
| All `ui/` shadcn components | Various | Accordion, Tabs, Sheet for panels and nav |

### 6.2 Components Modified

| Component | Change Required |
|-----------|----------------|
| `Sidebar.tsx` | Add "COP Reader" as primary nav item; demote "Planner" to secondary section |
| `MobileNav.tsx` | Add "COP" to bottom nav; move "Saved" to Menu sheet |
| `Header.tsx` | Minor: possibly show current section number when in reader mode |

### 6.3 New Components

| Component | Purpose |
|-----------|---------|
| `components/cop/ChapterGrid.tsx` | 19-chapter card grid for `/cop` home page |
| `components/cop/SectionContent.tsx` | Rich text renderer (strips boilerplate, linkifies section refs, inserts images) |
| `components/cop/SectionSidebar.tsx` | Chapter tree sidebar navigator (desktop) |
| `components/cop/SectionBreadcrumb.tsx` | Section number breadcrumb (COP > 8 > 8.5 > 8.5.4) |
| `components/cop/SupplementaryPanels.tsx` | Collapsible accordion panels for 3D/HTG/case law/details |
| `components/cop/ChapterDrawer.tsx` | Mobile chapter navigation drawer |
| `components/cop/InlineImage.tsx` | Section diagram image with caption and lazy loading |
| `components/cop/SubsectionList.tsx` | Clickable list of child sections |
| `components/cop/SectionSearch.tsx` | Quick section number jump (type "8.5.4", navigate) |

### 6.4 Existing Code Updated

| File | Change |
|------|--------|
| `lib/search-helpers.ts` | `getSectionNavigationUrl()` returns `/cop/{sectionNumber}` instead of `/search?q=...` |
| `app/api/search/route.ts` | Add COP section title search results (query `cop_sections.title` with ilike) |
| `app/(dashboard)/page.tsx` | Home page features COP Reader card prominently |
| `stores/app-store.ts` | No change needed (COP reader is stateless, no Zustand) |

### 6.5 New Query Files

| File | Functions |
|------|-----------|
| `lib/db/queries/cop-sections.ts` | `getChapters()`, `getSectionByNumber(number)`, `getSectionChildren(parentNumber)`, `getSectionBreadcrumb(number)`, `searchSections(query)` |
| `lib/db/queries/cop-images.ts` | `getImagesForSection(number)` |
| `lib/db/queries/htg.ts` | `getHtgForSection(number)`, `getHtgByGuide(slug)` |

---

## 7. Data Import Pipeline

### 7.1 New Import Scripts

```
scripts/
  import-cop-sections.ts          # sections_hierarchy.json -> cop_sections table
  split-cop-chapters.ts           # sections_hierarchy.json -> public/cop/chapter-{N}.json
  import-cop-images.ts            # images_manifest.json + r2_image_urls.json -> cop_section_images
  link-cop-section-details.ts     # Match sections to details via descriptions/standardsRefs
  extract-htg-content.ts          # HTG PDFs -> htg_content + cop_section_htg (future)
```

### 7.2 Import Dependencies and Order

```
Step 1: import-cop-sections.ts        (reads sections_hierarchy.json)
Step 2: split-cop-chapters.ts         (reads sections_hierarchy.json, writes files)
   [1 and 2 are independent, can run in parallel]
Step 3: import-cop-images.ts          (requires: cop_sections populated)
Step 4: link-cop-section-details.ts   (requires: cop_sections + details populated)
Step 5: extract-htg-content.ts        (requires: cop_sections populated, HTG PDFs available)
```

### 7.3 Import Script Logic: `import-cop-sections.ts`

```
1. Read sections_hierarchy.json
2. Walk the nested structure recursively
3. For each node, extract: number, title, pdf_pages
4. Compute: chapterNumber (first segment), parentNumber, depth, sortOrder
5. Insert into cop_sections table
6. Count images per section from images_manifest.json
7. Update imageCount column
```

### 7.4 Package.json Script Additions

```json
{
  "db:import-cop-sections": "npx tsx scripts/import-cop-sections.ts",
  "db:split-cop-chapters": "npx tsx scripts/split-cop-chapters.ts",
  "db:import-cop-images": "npx tsx scripts/import-cop-images.ts",
  "db:link-cop-sections": "npx tsx scripts/link-cop-section-details.ts",
  "db:import-htg": "npx tsx scripts/extract-htg-content.ts"
}
```

---

## 8. Anti-Patterns to Avoid

### 8.1 Do Not Load sections_hierarchy.json as a Single File

The 3.8MB JSON (37,000+ tokens) would block initial render and consume excessive memory on mobile devices. Always split by chapter and load only the needed chapter file.

### 8.2 Do Not Create a Separate Route Group for COP

The COP reader must live within `(dashboard)` to inherit:
- Clerk auth check from `(dashboard)/layout.tsx`
- `StoreProvider` wrapper
- Header, main sidebar, mobile nav
- Skip links and accessibility infrastructure

Creating `(cop)` as a separate group would duplicate all of this.

### 8.3 Do Not Nest COP Under Planner

`/planner/cop/8.5.4` is architecturally wrong. The COP is the authoritative source document; the Planner organises extracted details. They are peers, not parent-child. The COP reader is at `/cop/*` alongside `/planner/*`.

### 8.4 Do Not Duplicate Content in DB and JSON

The hybrid approach means: **structure in DB, content text in JSON.** Never store the same content in both places. The `cop_sections` table explicitly has NO `content` column.

### 8.5 Do Not Mix HTG with MRM Content

HTG guides are RANZ supplementary content. They must always render inside a supplementary panel with grey border and "RANZ Guide" badge. Never inline HTG text into the MRM section body. This preserves the authority model from v1.1.

### 8.6 Do Not Break Section Number Deep Links

Once `/cop/8.5.4` is established, section numbers must remain stable across COP quarterly updates. The section numbering comes from MRM and does not change frequently. If MRM renumbers a section, implement a redirect from old number to new number.

---

## 9. Suggested Build Order

### Phase 1: Data Foundation
1. Create `cop_sections` table schema + Drizzle migration
2. Write `import-cop-sections.ts` script (parse hierarchy JSON, populate table)
3. Write `split-cop-chapters.ts` script (produce per-chapter JSON files in `/public/cop/`)
4. Run imports, verify section count and hierarchy integrity
5. Create `cop_section_images` table schema + migration
6. Write `import-cop-images.ts` script (combine manifest + R2 URLs)
7. Run image import, verify 775 images mapped

**Dependency:** Everything else depends on this data existing.

### Phase 2: Basic Reader
8. Create `/cop` route with `ChapterGrid.tsx` (19-chapter card page)
9. Create `[sectionNumber]/page.tsx` Server Component
10. Create `SectionContent.tsx` (rich text rendering from chapter JSON)
11. Create `InlineImage.tsx` (section diagram with lazy loading)
12. Create `SectionBreadcrumb.tsx`
13. Create `SubsectionList.tsx` (clickable child sections)

**Dependency:** Needs Phase 1 data. Gets the core reading experience working.

### Phase 3: Navigation Chrome
14. Create `SectionSidebar.tsx` (chapter tree navigator, desktop)
15. Create `ChapterDrawer.tsx` (mobile drawer)
16. Create `cop/layout.tsx` that adds contextual sidebar
17. Modify `Sidebar.tsx` (add COP Reader, demote Planner)
18. Modify `MobileNav.tsx` (add COP to bottom nav)

**Dependency:** Needs Phase 2 pages to exist. Navigation wraps a working reader.

### Phase 4: Supplementary Panels
19. Create `cop_section_details` table + migration
20. Write `link-cop-section-details.ts` script
21. Create `SupplementaryPanels.tsx` (collapsible accordion)
22. Wire up linked details, 3D models (reuse `Model3DViewer`), case law badges

**Dependency:** Needs section-detail linking data. This is the differentiator -- roofers see 3D models and case law inline while reading the COP.

### Phase 5: HTG Content
23. Extract HTG PDFs (Flashings, Penetrations, Cladding) -- separate pipeline
24. Create `htg_content` + `cop_section_htg` tables + migration
25. Write HTG import script
26. Add HTG panels to `SupplementaryPanels.tsx`

**Dependency:** HTG extraction is independent work that should not block Phases 1-4.

### Phase 6: Search and Polish
27. Update `getSectionNavigationUrl` to return `/cop/{number}` (one-line change)
28. Add COP section search results to search API (query `cop_sections.title`)
29. Update home page to feature COP Reader prominently
30. Add section deep-link sharing (copy URL button)
31. Verify offline/PWA support (add chapter JSON files to service worker precache)
32. Cross-browser testing, mobile performance validation

**Dependency:** Everything is built; this phase polishes and connects.

---

## 10. Migration Risk Assessment

### 10.1 Zero Breaking Changes to Existing Features

All new routes are additive (`/cop/*`). No existing routes are removed or modified. The Planner (`/planner/*`), Fixer (`/fixer/*`), Topics (`/topics/*`), Search (`/search/*`), and Failures (`/failures/*`) routes continue to work identically.

### 10.2 Navigation Change is Cosmetic Only

The sidebar and mobile nav changes reorder items (COP Reader becomes primary, Planner becomes secondary). No functionality is removed; users who prefer Planner navigation can still access it via the sidebar.

### 10.3 Single Existing Behavior Change

`getSectionNavigationUrl()` currently redirects section number searches to `/search?q={number}&source=mrm-cop`. After v1.2, it redirects to `/cop/{number}`. This is an improvement -- users searching "8.5.4" land on the actual section instead of a search results page.

### 10.4 Data Independence

The 5 new tables have no foreign keys to existing tables except `cop_section_details.detailId -> details.id`. If the COP reader feature were removed, all new tables could be dropped with zero impact on existing features.

---

## 11. Performance Considerations

### 11.1 Static File Sizes

| Chapter | Content | Est. Size |
|---------|---------|-----------|
| 1 (Introduction) | Light text | ~50KB |
| 2 (Glossary) | Definitions | ~40KB |
| 3 (Structure) | Deep technical, many subsections | ~400KB |
| 8 (Flashings) | Largest chapter, most sections | ~500KB |
| 14 (Maintenance) | Substantial text | ~300KB |
| Average | -- | ~200KB |
| **Total** | 19 chapters | ~3.8MB (matches original) |

Each page loads only one chapter file. CDN-cached after first load.

### 11.2 Database Query Load Per Page

Each section page makes 5-7 queries, all hitting indexed columns:

1. `cop_sections` by `number` (unique index) -- <1ms
2. `cop_sections` by `parentNumber` (index) -- <1ms
3. Breadcrumb: 2-3 lookups up parent chain -- <2ms
4. `cop_section_images` by `sectionNumber` (index) -- <1ms
5. `cop_section_details` join details (both indexed) -- <5ms
6. `cop_section_htg` join htg_content (both indexed) -- <1ms
7. Optional: failure cases for linked details -- <5ms

**Total estimated: <15ms** for all DB queries on a section page.

### 11.3 Offline / PWA Support

Per-chapter JSON files in `/public/cop/` can be added to the service worker precache manifest. With all 19 files cached (~3.8MB total), the entire COP is available offline. This matches the existing PWA pattern in the codebase.

### 11.4 Image Loading

Sections with many images (e.g., Chapter 8 has 40+ section images) must use:
- `loading="lazy"` on all images
- `next/image` with width/height from manifest dimensions (prevents CLS)
- Only images for the current section are queried (not the entire chapter)

---

## Sources

All findings based on direct inspection of the codebase at `C:\Users\LukeBoustridge\Projects\RANZ\Master Roofers Code of Practice`:

| File | What It Told Us |
|------|-----------------|
| `mrm_extract/sections_hierarchy.json` | 3.8MB, 19 top-level chapters (keys "1" through "19"), nested subsections with `number`, `title`, `content`, `pdf_pages`, `subsections` |
| `mrm_extract/images_manifest.json` | 775 images with `section` field mapping to section numbers (including suffixed variants like "8.5.4A"), R2-ready |
| `mrm_extract/r2_image_urls.json` | R2 public URLs for all detail-specific images |
| `mrm_extract/metadata.json` | 624 PDF pages, 251 details, 775 images, v25.12 |
| `lib/db/schema.ts` | 15 existing tables (Drizzle ORM) including `details`, `detailLinks`, `contentSources` |
| `app/(dashboard)/layout.tsx` | Dashboard shell: Header + Sidebar + MobileNav + StoreProvider |
| `components/layout/Sidebar.tsx` | Current nav: Home, Planner, Fixer, Search, Favourites + Substrates accordion + Case Law, Settings |
| `components/layout/MobileNav.tsx` | Current mobile nav: Home, Search, Fixer, Saved + Menu sheet |
| `lib/search-helpers.ts` | Existing section number detection regex + `getSectionNavigationUrl` (currently redirects to search) |
| `.planning/PROJECT.md` | v1.2 scope: COP Reader with 19 chapters, section deep-linking, supplementary panels, HTG extraction |
| `.planning/STATE.md` | Current state: defining requirements for v1.2, no phases started |
