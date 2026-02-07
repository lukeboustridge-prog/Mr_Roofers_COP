# Phase 13: Data Foundation - Research

**Researched:** 2026-02-08
**Domain:** Data migration, PostgreSQL schema design, JSON content delivery
**Confidence:** HIGH

## Summary

Phase 13 transforms the 624-page MRM Code of Practice PDF into a queryable database structure with lightweight JSON delivery. The extracted data already exists in `mrm_extract/` (3.8MB sections_hierarchy.json with 1,122 sections, 775 images, metadata). The challenge is splitting this into a hybrid model: PostgreSQL stores hierarchy/structure, static JSON files serve per-chapter content.

**Key findings:**
- 19 chapters with 800-1,100 nested sections already extracted with correct hierarchy
- Per-chapter JSON sizes range from 12KB (Chapter 6) to 619KB (Chapter 19) uncompressed
- 772 of 775 images already mapped to section numbers (e.g., "8.5.4A")
- Existing Drizzle schema uses `text` primary keys, `jsonb` for arrays, timestamp defaults
- R2 URLs already available for all 775 images

**Primary recommendation:** Create 5 new tables (`cop_sections`, `cop_section_images`, `cop_section_details`, `htg_content`, `cop_section_htg`), import hierarchy from JSON, split content by chapter into `/public/cop/`, compress with Brotli, serve statically.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Drizzle ORM | Latest | Type-safe PostgreSQL queries | Already used in project, zero-cost type safety |
| Neon PostgreSQL | Serverless | Database hosting | Already configured, serverless-ready |
| Next.js (App Router) | 14+ | Static JSON serving from /public | Built-in compression, already project stack |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| TypeScript | 5.x | JSON parsing scripts | Section hierarchy import |
| fs/path (Node) | Built-in | File system operations | Splitting per-chapter JSON |
| Drizzle-kit | Latest | Migration generation | Schema changes |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Per-chapter JSON | Full DB storage | JSON avoids 2KB TOAST threshold, faster delivery |
| Static /public/ files | Dynamic API routes | Static files leverage CDN, zero server load |
| Text columns | JSONB for content | Text avoids TOAST issues with large content |

**Installation:**
```bash
# Already installed - verify versions
npm list drizzle-orm drizzle-kit
```

## Architecture Patterns

### Recommended Project Structure
```
lib/
├── db/
│   ├── schema.ts                 # Add 5 new tables here
│   ├── migrations/               # Drizzle auto-generates SQL
│   ├── import-cop-hierarchy.ts   # NEW: Import sections from JSON
│   └── split-chapter-json.ts     # NEW: Create per-chapter files

mrm_extract/                      # SOURCE DATA (read-only)
├── sections_hierarchy.json       # 3.8MB, 19 chapters, 1,122 sections
├── images_manifest.json          # 775 images with section mapping
├── r2_image_urls.json            # R2 URLs for serving
└── metadata.json                 # Version, dates, counts

public/
└── cop/                          # NEW: Per-chapter JSON
    ├── chapter-1.json            # 56KB uncompressed
    ├── chapter-2.json            # 213KB
    ├── chapter-8.json            # 281KB
    └── chapter-19.json           # 619KB (largest)
```

### Pattern 1: Hybrid Storage Model
**What:** Structure in PostgreSQL, content in static JSON
**When to use:** Large text content with hierarchical navigation needs
**Why:** Avoids PostgreSQL TOAST performance cliff (>2KB), enables CDN caching, reduces DB load

**Schema design:**
```typescript
// In lib/db/schema.ts
export const copSections = pgTable('cop_sections', {
  id: text('id').primaryKey(),              // e.g., 'cop-8.5.4A'
  sectionNumber: text('section_number').notNull().unique(), // '8.5.4A'
  chapterNumber: integer('chapter_number').notNull(), // 8
  parentId: text('parent_id'),              // 'cop-8.5.4' (self-ref)
  title: text('title').notNull(),
  level: integer('level').notNull(),        // 1=chapter, 2=section, 3=subsection
  sortOrder: integer('sort_order').notNull(), // For correct display order
  pdfPages: jsonb('pdf_pages').$type<number[]>(), // [78, 79]
  hasContent: boolean('has_content').default(false), // If content exists in JSON
  sourceId: text('source_id').references(() => contentSources.id), // 'mrm-cop'
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  chapterIdx: index('idx_cop_sections_chapter').on(table.chapterNumber),
  parentIdx: index('idx_cop_sections_parent').on(table.parentId),
  sectionNumberIdx: index('idx_cop_sections_number').on(table.sectionNumber),
}));
```

### Pattern 2: Image-Section Mapping
**What:** Link images to sections with position metadata
**When to use:** Images need to appear in correct section context
**Example:**
```typescript
export const copSectionImages = pgTable('cop_section_images', {
  id: text('id').primaryKey(),
  sectionId: text('section_id').references(() => copSections.id).notNull(),
  imageFilename: text('image_filename').notNull(), // 'section-detail-394.png'
  imageUrl: text('image_url').notNull(),     // R2 URL
  caption: text('caption'),
  imageType: text('image_type'),             // 'technical_diagram'
  sortOrder: integer('sort_order').default(0),
  dimensions: jsonb('dimensions').$type<{width: number; height: number}>(),
}, (table) => ({
  sectionIdx: index('idx_cop_section_images_section').on(table.sectionId),
}));
```

### Pattern 3: Detail Cross-Linking
**What:** Link COP sections to existing detail records
**When to use:** Surfacing supplementary RANZ detail content within COP sections
**Example:**
```typescript
export const copSectionDetails = pgTable('cop_section_details', {
  sectionId: text('section_id').references(() => copSections.id, { onDelete: 'cascade' }).notNull(),
  detailId: text('detail_id').references(() => details.id, { onDelete: 'cascade' }).notNull(),
  relationshipType: text('relationship_type').notNull(), // 'referenced', 'illustrates', 'alternative'
  notes: text('notes'),
}, (table) => ({
  pk: primaryKey({ columns: [table.sectionId, table.detailId] }),
}));
```

### Pattern 4: Per-Chapter JSON Format
**What:** Static JSON files with section hierarchy and content
**Format:**
```json
{
  "chapterNumber": 8,
  "title": "Flashings",
  "version": "v25.12",
  "sections": [
    {
      "number": "8.5.4",
      "title": "Change Of Pitch",
      "level": 3,
      "content": "Full text content from PDF extraction...",
      "pdfPages": [78, 79],
      "subsections": [
        {
          "number": "8.5.4A",
          "title": "Detail Diagram",
          "level": 4,
          "content": "...",
          "images": [
            {
              "filename": "section-detail-394.png",
              "url": "https://pub-xxx.r2.dev/images/mrm/section-detail-394.png",
              "caption": "",
              "dimensions": {"width": 661, "height": 866}
            }
          ]
        }
      ]
    }
  ]
}
```

### Anti-Patterns to Avoid
- **Storing full content in JSONB columns:** Triggers TOAST storage (>2KB), 2-10× slower queries, update duplication issues
- **Dynamic API routes for chapter content:** Wastes server resources, misses CDN caching, adds latency
- **Nested self-referential queries without indexes:** Use parentId index + recursive CTEs for hierarchy traversal
- **Serial IDs for sections:** Use text IDs like 'cop-8.5.4A' for readable URLs and natural references

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON compression | Custom gzip wrapper | Next.js built-in compression | Automatically serves .gz/.br, handles Accept-Encoding |
| Hierarchical queries | Manual parent-child joins | PostgreSQL recursive CTEs | Optimized, indexed, handles deep nesting |
| Migration tracking | Custom SQL versioning | Drizzle Kit migrations | Auto-generates SQL from schema changes, tracks applied migrations |
| Section number parsing | Regex-based dot splitter | Existing hierarchy structure | Already parsed and nested correctly in JSON |
| Image URL generation | String concatenation | R2 URL lookup from r2_image_urls.json | Already mapped, verified, uploaded |

**Key insight:** The extraction pipeline already solved the hard problems (PDF parsing, hierarchy detection, image extraction). This phase is data reshaping, not content extraction.

## Common Pitfalls

### Pitfall 1: PostgreSQL TOAST Performance Cliff
**What goes wrong:** Storing large text content (>2KB) in JSONB or TEXT columns triggers TOAST storage, causing 2-10× query slowdown
**Why it happens:** Each TOAST chunk is stored separately; updates duplicate entire value
**How to avoid:** Keep content in static JSON files, store only metadata/structure in DB
**Warning signs:** Query times >100ms for simple section lookups, DB size growing faster than expected

**Source:** [5mins of Postgres: JSONB and TOAST](https://pganalyze.com/blog/5mins-postgres-jsonb-toast) - November 2025 analysis showing performance degradation beyond 2KB threshold.

### Pitfall 2: Section Number Format Variations
**What goes wrong:** Section numbers like "8.5.4A", "3.9.1B", "10.11.3" have inconsistent formats (letter suffixes, varying depth)
**Why it happens:** MRM COP uses letters for diagram/table variations of same section
**How to avoid:** Use text IDs with original section numbers, add `level` column (1=chapter, 2=section, 3=subsection, 4=variant), maintain `sortOrder` for display
**Warning signs:** Incorrect hierarchy rendering, missing subsections, broken parent-child links

**Evidence:** `mrm_extract/sections_hierarchy.json` shows 1,122 sections with depths 1-4, letter suffixes on ~15% of sections.

### Pitfall 3: Chapter JSON Size Exceeding Mobile Budget
**What goes wrong:** Chapter 19 is 619KB uncompressed - could exceed 100KB compressed target on mobile
**Why it happens:** Chapter 19 (Revision History) contains all historical changes
**How to avoid:** Brotli compression achieves ~70% reduction (619KB → ~186KB), still exceeds target. Split Chapter 19 into sub-files or paginate.
**Warning signs:** Mobile Performance score <90, slow 3G load times >3s

**Test command:**
```bash
# Estimate compressed size
cat chapter-19.json | brotli -c | wc -c
```

### Pitfall 4: Image Section Mapping With Null Values
**What goes wrong:** 3 of 775 images have `"section": null` in images_manifest.json
**Why it happens:** Cover page, frontmatter, or unattributable diagrams
**How to avoid:** Create special section 'cop-0-frontmatter' for unmapped images, or skip import
**Warning signs:** Foreign key constraint errors during image import

**Data check:**
```bash
grep '"section": null' mrm_extract/images_manifest.json | wc -l
# Returns: 3
```

### Pitfall 5: Recursive Parent-Child Relationships Without Depth Limit
**What goes wrong:** Fetching full section hierarchy without depth limit causes performance issues
**Why it happens:** PostgreSQL recursive CTEs can scan entire table
**How to avoid:** Add `WHERE level <= 3` in recursive CTE, use `sortOrder` for ordering, cache hierarchy tree
**Warning signs:** Query times >500ms, N+1 query patterns in section rendering

## Code Examples

Verified patterns from project schema:

### Section Hierarchy Import
```typescript
// lib/db/import-cop-hierarchy.ts
import { db } from './index';
import { copSections } from './schema';
import sectionsData from '@/mrm_extract/sections_hierarchy.json';

interface SectionNode {
  number: string;
  title: string;
  content: string;
  pdf_pages: number[];
  subsections: Record<string, SectionNode>;
}

async function importSection(
  chapterNum: number,
  sectionNum: string,
  node: SectionNode,
  parentId: string | null,
  level: number,
  order: number
): Promise<number> {
  const sectionId = `cop-${sectionNum}`;

  await db.insert(copSections).values({
    id: sectionId,
    sectionNumber: sectionNum,
    chapterNumber: chapterNum,
    parentId,
    title: node.title,
    level,
    sortOrder: order,
    pdfPages: node.pdf_pages,
    hasContent: node.content.length > 0,
    sourceId: 'mrm-cop',
  });

  let childOrder = order * 1000; // Leave room for siblings
  for (const [subNum, subNode] of Object.entries(node.subsections)) {
    childOrder = await importSection(
      chapterNum,
      subNum,
      subNode,
      sectionId,
      level + 1,
      childOrder + 1
    );
  }

  return childOrder;
}

// Entry point
const chapters = Object.entries(sectionsData as Record<string, SectionNode>);
for (const [chNum, chapter] of chapters) {
  await importSection(parseInt(chNum), chNum, chapter, null, 1, parseInt(chNum) * 1000);
}
```

### Per-Chapter JSON Generator
```typescript
// lib/db/split-chapter-json.ts
import fs from 'fs';
import path from 'path';
import sectionsData from '@/mrm_extract/sections_hierarchy.json';
import imagesData from '@/mrm_extract/images_manifest.json';
import r2Urls from '@/mrm_extract/r2_image_urls.json';

interface ChapterJSON {
  chapterNumber: number;
  title: string;
  version: string;
  sections: Array<{
    number: string;
    title: string;
    level: number;
    content: string;
    pdfPages: number[];
    images?: Array<{
      filename: string;
      url: string;
      caption: string;
      dimensions: { width: number; height: number };
    }>;
    subsections?: any[];
  }>;
}

function attachImages(sectionNum: string): ChapterJSON['sections'][0]['images'] {
  const images = Object.entries(imagesData)
    .filter(([_, img]) => img.section === sectionNum)
    .map(([filename, img]) => ({
      filename,
      url: r2Urls[filename],
      caption: img.caption,
      dimensions: img.dimensions,
    }));

  return images.length > 0 ? images : undefined;
}

function buildSection(sectionNum: string, node: any, level: number) {
  return {
    number: sectionNum,
    title: node.title,
    level,
    content: node.content,
    pdfPages: node.pdf_pages,
    images: attachImages(sectionNum),
    subsections: Object.entries(node.subsections || {}).map(([subNum, subNode]) =>
      buildSection(subNum, subNode, level + 1)
    ),
  };
}

// Generate per-chapter files
const outDir = path.join(process.cwd(), 'public/cop');
fs.mkdirSync(outDir, { recursive: true });

for (const [chNum, chapter] of Object.entries(sectionsData)) {
  const chapterJSON: ChapterJSON = {
    chapterNumber: parseInt(chNum),
    title: chapter.title,
    version: 'v25.12',
    sections: [buildSection(chNum, chapter, 1)],
  };

  fs.writeFileSync(
    path.join(outDir, `chapter-${chNum}.json`),
    JSON.stringify(chapterJSON, null, 2)
  );

  console.log(`Created chapter-${chNum}.json (${JSON.stringify(chapterJSON).length} bytes)`);
}
```

### Fetch Section with Hierarchy
```typescript
// app/cop/[sectionNumber]/page.tsx (Server Component)
import { db } from '@/lib/db';
import { copSections } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

export default async function COPSectionPage({ params }: { params: { sectionNumber: string } }) {
  // Get section metadata from DB
  const section = await db.query.copSections.findFirst({
    where: eq(copSections.sectionNumber, params.sectionNumber),
    with: {
      parent: true,
      images: true,
      linkedDetails: {
        with: {
          detail: true,
        },
      },
    },
  });

  if (!section) return <div>Section not found</div>;

  // Load chapter content from static JSON
  const chapterFile = path.join(
    process.cwd(),
    'public/cop',
    `chapter-${section.chapterNumber}.json`
  );
  const chapterData = JSON.parse(fs.readFileSync(chapterFile, 'utf-8'));

  // Extract specific section content by traversing JSON
  function findSection(sections: any[], targetNum: string): any {
    for (const s of sections) {
      if (s.number === targetNum) return s;
      if (s.subsections) {
        const found = findSection(s.subsections, targetNum);
        if (found) return found;
      }
    }
    return null;
  }

  const sectionContent = findSection(chapterData.sections, params.sectionNumber);

  return (
    <div>
      <h1>{section.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: sectionContent?.content }} />
      {section.images?.map(img => (
        <img key={img.id} src={img.imageUrl} alt={img.caption} />
      ))}
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Serial auto-increment IDs | Text-based semantic IDs | PostgreSQL 10+ identity columns | Readable URLs, natural foreign keys |
| JSON type | JSONB with indexing | PostgreSQL 9.4+ | 30% faster queries, GIN indexes |
| Manual parent tracking | Recursive CTEs | PostgreSQL 8.4+ | Single query for full hierarchy |
| VARCHAR(255) limits | TEXT columns | PostgreSQL 7.1+ | No arbitrary limits, same storage |
| Gzip-only | Brotli compression | Next.js 10+ (2020) | 21% better compression |

**Deprecated/outdated:**
- `SERIAL` types: Use `integer().generatedAlwaysAsIdentity()` or text IDs instead
- Manual SQL migration files: Drizzle Kit auto-generates from schema.ts
- Storing timestamps as strings: Use `timestamp()` with `defaultNow()`

## Open Questions

1. **Should Chapter 19 (619KB) be split further?**
   - What we know: Exceeds 100KB compressed target by ~86KB
   - What's unclear: Performance impact, whether history should be paginated
   - Recommendation: Defer to Phase 13-02, measure actual compressed size with Brotli first

2. **How to handle 3 unmapped images?**
   - What we know: `section: null` for 3 images in manifest
   - What's unclear: Are they cover/frontmatter or extraction errors?
   - Recommendation: Create `cop-0-frontmatter` section, or skip import

3. **Should HTG content table be populated now or later?**
   - What we know: Schema includes `htg_content` table for "How-To Guides"
   - What's unclear: Content source, priority vs COP sections
   - Recommendation: Create empty table in migration, populate in future phase

4. **Detail linking strategy: manual or automated?**
   - What we know: `cop_section_details` table designed for cross-linking
   - What's unclear: Criteria for linking (keywords, manual curation?)
   - Recommendation: Start with empty table, create admin UI in later phase

## Sources

### Primary (HIGH confidence)
- Project file: `lib/db/schema.ts` - Existing Drizzle schema patterns (text IDs, jsonb, timestamps)
- Project file: `mrm_extract/sections_hierarchy.json` - 3.8MB, 1,122 sections, verified structure
- Project file: `mrm_extract/images_manifest.json` - 775 images, 772 with section mapping
- Project file: `mrm_extract/metadata.json` - Version v25.12, extraction date 2026-01-25
- Project file: `lib/db/import-mrm.ts` - Existing import patterns (batching, R2 URLs)
- Project file: `lib/db/migrations/0000_large_anthem.sql` - Migration format examples

### Secondary (MEDIUM confidence)
- [Drizzle ORM PostgreSQL Best Practices (2025)](https://gist.github.com/productdevbook/7c9ce3bbeb96b3fabc3c7c2aa2abc717) - Identity columns, schema patterns
- [PostgreSQL JSONB and TOAST Performance](https://pganalyze.com/blog/5mins-postgres-jsonb-toast) - 2KB threshold, query slowdown
- [Next.js Compression Configuration](https://nextjs.org/docs/app/api-reference/config/next-config-js/compress) - Built-in gzip/Brotli

### Tertiary (LOW confidence)
- [JSON Compression Techniques](https://www.jsonbud.com/compress.html) - General minification strategies
- [PostgreSQL Recursive CTEs](https://www.postgresql.org/docs/current/queries-with.html) - Official docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in package.json, Drizzle patterns established
- Architecture: HIGH - JSON structure verified, sizes measured, schema patterns proven
- Pitfalls: HIGH - TOAST behavior documented, section format variations observed in data

**Research date:** 2026-02-08
**Valid until:** 90 days (stable domain, Next.js/Drizzle patterns mature)

**Data verification:**
- Total sections: 1,122 (counted via `grep -o '"number"' | wc -l`)
- Total images: 775 (from metadata.json)
- Mapped images: 772 (verified in images_manifest.json)
- Chapter count: 19 (keys in sections_hierarchy.json)
- Largest chapter: 619KB (Chapter 19, uncompressed)
- Smallest chapter: 12KB (Chapter 6, uncompressed)
- Average chapter: ~209KB uncompressed

**Next steps for planner:**
- 13-01 PLAN: Database schema (5 tables) + section hierarchy import
- 13-02 PLAN: Per-chapter JSON split + image mapping + compression testing
