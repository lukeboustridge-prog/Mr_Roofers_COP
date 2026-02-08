# Phase 17: HTG Content Pipeline - Research

**Researched:** 2026-02-08
**Domain:** PDF text extraction, content mapping, build-time scripting
**Confidence:** MEDIUM

## Summary

This research investigated how to extract structured content from RANZ HTG (How-To Guide) PDFs and map them to COP sections for display in supplementary panels. The three HTG PDFs (Flashings, Penetrations, Cladding) range from 3.1MB to 352MB, with the Penetrations PDF being exceptionally large due to press-quality imagery. Phase 16 already implemented the complete supplementary panel infrastructure — HTG guides are fully wired from database to UI. Phase 17 ONLY needs to populate the htg_content table and create mappings in cop_section_htg.

**Key findings:**
- Phase 16 infrastructure is 100% complete — SupplementaryPanel component, getSupplementaryContent query, SectionRenderer integration all exist and are functional
- HTG PDFs exist in HTG_content/ directory: Flashings (3.1MB), Penetrations (352MB press-quality), Cladding (97MB + 2 smaller files split across Cover/2pp/32pp sections)
- unpdf is the modern standard for PDF text extraction in TypeScript (replaces unmaintained pdf-parse, handles both text and OCR)
- Project already uses tsx for build-time TypeScript execution (db:import-cop-hierarchy, db:seed-sources scripts)
- Mapping HTG guides to COP sections will be primarily MANUAL curation (chapter number + topic keywords can suggest candidates, but expert review required)
- 352MB Penetrations PDF may be mostly imagery (press-quality) — extraction quality unknown until attempted

**Primary recommendation:** Use unpdf for PDF text extraction with page-level granularity, create db:import-htg-content script following existing import-cop-hierarchy.ts pattern, extract HTG guides as individual htg_content records with page references, create manual mapping script (db:map-htg-to-cop) with suggested mappings based on chapter number and keywords, defer bulk mapping to post-MVP manual curation.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| unpdf | Latest | PDF text extraction | Modern replacement for pdf-parse, TypeScript-first, handles text + OCR, works across JS runtimes |
| tsx | Latest | TypeScript execution | Already in project (via npx tsx), zero-config TS runner for scripts |
| Drizzle ORM | 0.45.1 | Database operations | Project standard, type-safe batch inserts |
| Node.js fs/path | Native | File system access | Read PDFs from HTG_content/ directory |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| dotenv | ^17.2.3 | Environment variables | Load DATABASE_URL in standalone scripts (existing pattern) |
| esbuild | Via unpdf | Fast compilation | unpdf uses esbuild internally for performance |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| unpdf | pdf-parse | pdf-parse is unmaintained (last update 2019), no TypeScript types, unpdf is modern successor with same API |
| unpdf | pdf.js-extract | pdf.js-extract returns coordinate data (overkill), unpdf focuses on text extraction (simpler for this use case) |
| Automatic mapping | Manual curation | Phase 13-02 documented ZERO automatic detail code matches — COP narrative doesn't use explicit codes, HTG mapping needs expert knowledge |
| Full PDF parsing | Page-level extraction | HTG guides are multi-page sections — page-level extraction allows future granular linking (e.g., "HTG Flashings p.12-15") |

**Installation:**
```bash
npm install unpdf
```

## Architecture Patterns

### Recommended Script Structure
```
lib/db/
├── import-htg-content.ts       # NEW: Extract HTG PDFs → htg_content table
├── map-htg-to-cop.ts           # NEW: Manual curation helper with suggested mappings
├── import-cop-hierarchy.ts     # EXISTING: Pattern to follow (batch inserts, idempotent)
└── seed-sources.ts             # EXISTING: Pattern to follow (dotenv, db connection)
```

### Pattern 1: PDF Extraction with unpdf
**What:** Extract text from HTG PDFs page-by-page, store as htg_content records
**When to use:** Build-time data import (npm run db:import-htg-content)
**Example:**
```typescript
// lib/db/import-htg-content.ts
import { config } from 'dotenv';
config({ path: '.env.local' });

import { db } from './index';
import { htgContent } from './schema';
import { extractText } from 'unpdf';
import * as fs from 'fs';
import * as path from 'path';

const HTG_PDFS = [
  {
    file: 'HTG_content/Artwork/Flashings Guide Artwork 2020/wetransfer-acc95a/RANZ Metal Roof Flashings - Web Quality 20200703republish.pdf',
    sourceDocument: 'flashings',
    guideName: 'RANZ Metal Roof Flashings Guide',
  },
  {
    file: 'HTG_content/Artwork/Penetrations Artwork/RANZ Metal Roof Penetrations - Press Quality 2020republish.pdf',
    sourceDocument: 'penetrations',
    guideName: 'RANZ Metal Roof Penetrations Guide',
  },
  {
    file: 'HTG_content/Artwork/Cladding guide artwork/174548 Metal Wall Cladding.4 x 32pp.1A.PDF',
    sourceDocument: 'cladding',
    guideName: 'RANZ Metal Wall Cladding Guide',
  },
];

async function importHtgContent() {
  console.log('Starting HTG content extraction...\n');

  // Clear existing HTG content (idempotent)
  await db.delete(htgContent);
  console.log('Cleared existing HTG content\n');

  for (const pdf of HTG_PDFS) {
    console.log(`Processing ${pdf.guideName}...`);
    const pdfPath = path.join(process.cwd(), pdf.file);

    if (!fs.existsSync(pdfPath)) {
      console.warn(`  ⚠️  PDF not found: ${pdfPath}`);
      continue;
    }

    try {
      // Extract text from PDF
      const pdfBuffer = fs.readFileSync(pdfPath);
      const { text, pages } = await extractText(pdfBuffer, { mergePages: false });

      console.log(`  Extracted ${pages} pages`);

      // Store each page as separate record (allows granular linking)
      const records = pages.map((pageText: string, idx: number) => ({
        id: `${pdf.sourceDocument}-p${idx + 1}`,
        sourceDocument: pdf.sourceDocument,
        guideName: `${pdf.guideName} - Page ${idx + 1}`,
        content: pageText,
        images: null,
        pdfPage: idx + 1,
      }));

      // Batch insert
      await db.insert(htgContent).values(records);
      console.log(`  ✅ Inserted ${records.length} pages\n`);
    } catch (error) {
      console.error(`  ❌ Extraction failed:`, error);
    }
  }

  console.log('HTG content import complete!');
  process.exit(0);
}

importHtgContent().catch((err) => {
  console.error('Import failed:', err);
  process.exit(1);
});
```

**Rationale:** Page-level extraction allows future granular linking (e.g., "HTG Flashings p.12-15 for ridge flashing"), idempotent script can be re-run, batch inserts minimize database round-trips.

### Pattern 2: Suggested Mappings with Manual Curation
**What:** Script that suggests HTG→COP mappings based on chapter number + keywords, outputs CSV for manual review
**When to use:** After HTG content extracted, before production deployment
**Example:**
```typescript
// lib/db/map-htg-to-cop.ts
import { config } from 'dotenv';
config({ path: '.env.local' });

import { db } from './index';
import { htgContent, copSections, copSectionHtg } from './schema';
import { eq, like, and } from 'drizzle-orm';

const MAPPING_RULES = [
  {
    sourceDocument: 'flashings',
    copChapter: 8,
    keywords: ['flashing', 'ridge', 'valley', 'apron', 'soaker'],
  },
  {
    sourceDocument: 'penetrations',
    copChapter: 9,
    keywords: ['penetration', 'pipe', 'vent', 'chimney', 'skylight'],
  },
  {
    sourceDocument: 'cladding',
    copChapter: 6,
    keywords: ['cladding', 'wall', 'fixing', 'fastener'],
  },
];

async function suggestMappings() {
  console.log('Generating suggested HTG→COP mappings...\n');

  for (const rule of MAPPING_RULES) {
    console.log(`\n${rule.sourceDocument.toUpperCase()} → Chapter ${rule.copChapter}`);
    console.log('─'.repeat(60));

    // Get HTG pages for this document
    const htgPages = await db
      .select()
      .from(htgContent)
      .where(eq(htgContent.sourceDocument, rule.sourceDocument));

    // Get COP sections in target chapter
    const copSectionsData = await db
      .select()
      .from(copSections)
      .where(eq(copSections.chapterNumber, rule.copChapter));

    // Simple keyword matching (manual review required)
    for (const htgPage of htgPages) {
      for (const section of copSectionsData) {
        const matchedKeywords = rule.keywords.filter(
          (kw) =>
            htgPage.content?.toLowerCase().includes(kw) &&
            (section.title.toLowerCase().includes(kw) ||
              section.content?.toLowerCase().includes(kw))
        );

        if (matchedKeywords.length > 0) {
          console.log(
            `  SUGGEST: ${htgPage.id} → ${section.sectionNumber} (${matchedKeywords.join(', ')})`
          );
          // Output to CSV or database for manual review
        }
      }
    }
  }

  console.log('\n\n⚠️  MANUAL REVIEW REQUIRED');
  console.log('These are SUGGESTED mappings only.');
  console.log('Expert curation needed to validate relevance and accuracy.');
  process.exit(0);
}

suggestMappings().catch((err) => {
  console.error('Mapping suggestion failed:', err);
  process.exit(1);
});
```

**Rationale:** Automated suggestions reduce manual workload, but Phase 13-02 findings show automatic linking is unreliable — expert review is essential. Script outputs suggested mappings, curator inserts valid ones into cop_section_htg table.

### Pattern 3: Batch Insert with Idempotency
**What:** Clear existing data before inserting (allows script re-runs during development)
**When to use:** All import scripts
**Example:**
```typescript
// Idempotent pattern (from import-cop-hierarchy.ts)
await db.delete(htgContent); // Clear existing
await db.insert(htgContent).values(records); // Insert new
```

**Rationale:** Allows script to be run multiple times during development without creating duplicates, matches existing import-cop-hierarchy.ts pattern.

### Anti-Patterns to Avoid
- **Automatic mapping without review:** Phase 13-02 documented ZERO automatic detail links — HTG mapping needs same level of expert curation
- **Loading entire 352MB PDF into memory:** Stream or page-by-page extraction prevents memory issues with Penetrations PDF
- **Storing full PDF content in single record:** Page-level extraction allows granular linking and faster queries
- **Hardcoded file paths:** Use path.join(process.cwd(), ...) for cross-platform compatibility
- **No error handling for missing files:** HTG_content directory may not exist in all environments (dev vs production)

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PDF text extraction | Custom PDF parser | unpdf | Handles text + OCR, cross-runtime, TypeScript-first, actively maintained |
| TypeScript script execution | ts-node or custom build | tsx (npx tsx script.ts) | Already in project, zero-config, faster than ts-node (uses esbuild) |
| Batch database inserts | Loop with individual inserts | Drizzle .insert().values([...]) | Single query, faster, prevents connection pool exhaustion |
| Manual mapping UI | Custom admin interface | CSV export + manual review | MVP can use simple script output, admin UI is Phase 18+ scope |
| Environment variable loading | Hardcoded DATABASE_URL | dotenv with .env.local | Existing pattern in seed-sources.ts, secure, works locally + production |

**Key insight:** unpdf is the modern standard for PDF extraction in TypeScript (replaces pdf-parse). Project already has all patterns needed (import scripts, batch inserts, idempotency) — Phase 17 is primarily content extraction and manual curation workflow.

## Common Pitfalls

### Pitfall 1: 352MB Penetrations PDF Causes Memory Issues
**What goes wrong:** Loading entire Penetrations PDF into memory crashes Node.js process
**Why it happens:** Press-quality PDF contains high-resolution images, not optimized for text extraction
**How to avoid:** Use unpdf with page-by-page extraction (mergePages: false), process one page at a time
**Warning signs:** "JavaScript heap out of memory" error during extraction
**Verification:** Monitor memory usage during extraction — should stay under 512MB per PDF

### Pitfall 2: Assuming Automatic Mapping Will Work
**What goes wrong:** Developer builds automatic mapping logic, expects high-quality links
**Why it happens:** Didn't review Phase 13-02 findings (ZERO automatic detail code matches)
**How to avoid:** Accept that cop_section_htg mappings require manual expert curation. Build suggestion scripts, not automatic insertion.
**Warning signs:** Many irrelevant HTG guides appearing in COP sections
**Verification:** Manual spot-check of 10 HTG→COP links — all should be clearly relevant

### Pitfall 3: HTG Content Not Structured
**What goes wrong:** Extracted HTG content is unstructured blob of text, hard to display meaningfully
**Why it happens:** PDFs don't have semantic structure (headings, sections) — just text + layout
**How to avoid:** Accept that HTG content will be plain text initially. Display in SupplementaryPanel with page reference. Structured parsing (headings, images) is future enhancement.
**Warning signs:** HTG panels show wall of text with no formatting
**Verification:** This is expected behavior for MVP — structured extraction is Phase 18+ scope

### Pitfall 4: Cladding PDF Split Across Multiple Files
**What goes wrong:** Only processing "4 x 32pp" file, missing Cover and 2pp sections
**Why it happens:** Cladding guide is split into 3 PDFs (Cover.1A, 2pp.1A, 4x32pp.1A)
**How to avoid:** Import script must process all 3 Cladding PDF files, concatenate into single sourceDocument: 'cladding'
**Warning signs:** Cladding HTG guide missing introductory content
**Verification:** Check htg_content table — cladding sourceDocument should have ~130 pages (2 + 128 from 4x32pp + cover)

### Pitfall 5: No De-duplication of HTG Records
**What goes wrong:** Re-running import script creates duplicate HTG records with different IDs
**Why it happens:** Script doesn't clear existing htg_content before inserting
**How to avoid:** Follow idempotent pattern from import-cop-hierarchy.ts — delete existing records before insert
**Warning signs:** htg_content table grows every time script runs
**Verification:** Run script twice — row count should be same after first and second run

### Pitfall 6: Phase 16 Infrastructure Assumed Missing
**What goes wrong:** Developer starts building SupplementaryPanel component or getSupplementaryContent query
**Why it happens:** Didn't review Phase 16 completion status
**How to avoid:** Verify Phase 16 infrastructure exists (components/cop/SupplementaryPanel.tsx, lib/db/queries/supplementary.ts) — Phase 17 ONLY populates data
**Warning signs:** Creating duplicate components with similar names
**Verification:** Check Phase 16-VERIFICATION.md — all acceptance criteria marked complete

## Code Examples

Verified patterns from existing codebase:

### Existing Import Script Pattern (import-cop-hierarchy.ts)
```typescript
// Source: lib/db/import-cop-hierarchy.ts
import { config } from 'dotenv';
config({ path: '.env.local' }); // Load DATABASE_URL

import { db } from './index';
import { copSections } from './schema';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log('Starting import...');

  // Read source data
  const jsonPath = path.join(process.cwd(), 'mrm_extract', 'sections_hierarchy.json');
  const jsonData = fs.readFileSync(jsonPath, 'utf-8');
  const sectionsData = JSON.parse(jsonData);

  // Collect records to insert
  const sectionsToInsert = [];
  // ... populate sectionsToInsert array

  // Clear existing (idempotent)
  await db.delete(copSections);

  // Batch insert
  const batchSize = 100;
  for (let i = 0; i < sectionsToInsert.length; i += batchSize) {
    const batch = sectionsToInsert.slice(i, i + batchSize);
    await db.insert(copSections).values(batch);
    console.log(`Inserted batch ${i / batchSize + 1}`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('Import failed:', err);
  process.exit(1);
});
```

### HTG Schema (Already Exists)
```typescript
// Source: lib/db/schema.ts
export const htgContent = pgTable('htg_content', {
  id: text('id').primaryKey(),                    // e.g., 'flashings-p1', 'penetrations-p42'
  sourceDocument: text('source_document').notNull(), // 'flashings', 'penetrations', 'cladding'
  guideName: text('guide_name').notNull(),        // 'RANZ Metal Roof Flashings Guide - Page 1'
  content: text('content'),                       // Extracted text content
  images: jsonb('images').$type<string[]>(),      // Future: image URLs (not in MVP)
  pdfPage: integer('pdf_page'),                   // Original PDF page number
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  sourceIdx: index('idx_htg_content_source').on(table.sourceDocument),
}));

export const copSectionHtg = pgTable('cop_section_htg', {
  sectionId: text('section_id').references(() => copSections.id, { onDelete: 'cascade' }).notNull(),
  htgId: text('htg_id').references(() => htgContent.id, { onDelete: 'cascade' }).notNull(),
  relevance: text('relevance'),    // 'primary', 'supplementary', 'reference'
  notes: text('notes'),            // Curator notes (why this link exists)
}, (table) => ({
  pk: primaryKey({ columns: [table.sectionId, table.htgId] }),
}));
```

### Phase 16 SupplementaryPanel (Already Exists)
```typescript
// Source: components/cop/SupplementaryPanel.tsx
'use client';

import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export function SupplementaryPanel({ title, children }: SupplementaryPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <SupplementaryContent className="p-0 mt-6">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger>
          <span className="text-sm font-medium">{title}</span>
        </CollapsibleTrigger>
        <CollapsibleContent className="px-4 pb-4">
          {children}
        </CollapsibleContent>
      </Collapsible>
    </SupplementaryContent>
  );
}
```

### Phase 16 SectionRenderer with HTG Support (Already Exists)
```typescript
// Source: components/cop/SectionRenderer.tsx (lines 98-109)
{supplements?.htgGuides && supplements.htgGuides.length > 0 && (
  <SupplementaryPanel title="Related HTG Guides">
    <div className="space-y-2">
      {supplements.htgGuides.map((guide) => (
        <div key={guide.id} className="p-3 bg-white rounded border border-slate-200">
          <p className="text-sm font-medium text-slate-900">{guide.guideName}</p>
          <p className="text-xs text-slate-500 mt-1">
            Source: {guide.sourceDocument} | Relevance: {guide.relevance || 'N/A'}
          </p>
        </div>
      ))}
    </div>
  </SupplementaryPanel>
)}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| pdf-parse (unmaintained) | unpdf | 2024-2025 | Modern TypeScript support, OCR fallback, cross-runtime compatibility |
| ts-node for scripts | tsx | 2023+ | Faster (uses esbuild), zero-config, better ESM support |
| Manual PDF reading → manual data entry | Automated extraction + manual curation | Phase 17 | HTG content extracted programmatically, curator validates mappings |
| Separate admin UI for mapping | CSV/script-based curation | MVP approach | Faster to market, admin UI deferred to Phase 18+ |

**Deprecated/outdated:**
- pdf-parse: Last updated 2019, no TypeScript types, unmaintained
- pdf2json: Heavyweight (returns full document structure), overkill for text extraction
- ts-node: Slower than tsx (uses TypeScript compiler instead of esbuild)

## Open Questions

Things that couldn't be fully resolved:

1. **HTG PDF Content Quality**
   - What we know: Penetrations PDF is 352MB (press-quality), may be mostly imagery
   - What's unclear: Will text extraction work well on press-quality PDFs? Are guides scanned images or digital text?
   - Recommendation: Extract Flashings PDF first (3.1MB, likely good text). If successful, attempt Penetrations with OCR fallback. Document extraction quality in import script output.

2. **HTG Guide Structure**
   - What we know: PDFs contain installation guides for metal roofing components
   - What's unclear: Are guides organized by component (e.g., "Ridge Flashings Guide", "Valley Flashings Guide") or by chapter? Do they have table of contents?
   - Recommendation: Manual inspection of first 10 pages of each PDF required. Update import script to extract TOC if present. Otherwise, page-level extraction is sufficient for MVP.

3. **Mapping Granularity**
   - What we know: htgContent schema supports page-level records (pdfPage field exists)
   - What's unclear: Should each page be separate htg_content record, or group pages into "guides" (e.g., pages 12-15 = "Ridge Flashing Guide")?
   - Recommendation: Start with page-level extraction (simpler). If manual curation reveals clear guide boundaries, update schema with guideStartPage/guideEndPage fields in future phase.

4. **Image Extraction**
   - What we know: htgContent.images field exists (jsonb array of image URLs)
   - What's unclear: Should Phase 17 extract images from PDFs, or defer to future phase?
   - Recommendation: Defer image extraction to Phase 18+. unpdf can extract images, but requires Cloudflare R2 upload pipeline. Text-only MVP is sufficient.

5. **Curation Workflow**
   - What we know: cop_section_htg mappings require manual expert review (per Phase 13-02 findings)
   - What's unclear: Who performs curation? Ben Clisby (Technical Director)? Is there a timeline for mapping completion?
   - Recommendation: Build import-htg-content script immediately. Build map-htg-to-cop suggestion script for Phase 17 completion. Actual mapping curation can occur post-deployment (htg_content table populated, cop_section_htg empty initially).

6. **Multi-file Cladding Guide Handling**
   - What we know: Cladding guide is split across 3 PDFs (Cover, 2pp, 4x32pp)
   - What's unclear: Should these be separate sourceDocuments or concatenated into single 'cladding' document?
   - Recommendation: Concatenate into single 'cladding' sourceDocument with sequential page numbers (Cover = p1, 2pp = p2-3, 4x32pp = p4-131). Maintains logical structure, simpler queries.

## Sources

### Primary (HIGH confidence)
- Codebase: lib/db/import-cop-hierarchy.ts (existing import script pattern, 226 lines)
- Codebase: lib/db/seed-sources.ts (dotenv pattern, database connection)
- Codebase: components/cop/SupplementaryPanel.tsx (Phase 16 infrastructure complete)
- Codebase: lib/db/queries/supplementary.ts (getSupplementaryContent query complete)
- Codebase: components/cop/SectionRenderer.tsx (HTG rendering logic exists, lines 98-109)
- Database schema: lib/db/schema.ts (htgContent, copSectionHtg tables exist)
- Phase 13-02 findings: .planning/phases/13-data-foundation/13-02-PLAN.md (ZERO automatic links documented)
- Phase 16 verification: .planning/phases/16-supplementary-panels/16-VERIFICATION.md (infrastructure complete)
- HTG PDF files: File system listing shows 5 PDFs (3.1MB, 352MB, 97MB, 2.2MB, 1.6MB)
- Project package.json: tsx already available via npx, dotenv installed

### Secondary (MEDIUM confidence)
- [unpdf GitHub](https://github.com/unjs/unpdf) — Modern PDF extraction library, TypeScript-first, actively maintained
- [tsx documentation](https://tsx.is/) — TypeScript execution tool using esbuild
- [Drizzle ORM Seeding Overview](https://orm.drizzle.team/docs/seed-overview) — Batch insert patterns
- [7 PDF Parsing Libraries for Node.js](https://strapi.io/blog/7-best-javascript-pdf-parsing-libraries-nodejs-2025) — Comparison of pdf-parse, unpdf, pdf.js-extract
- [Node.js TypeScript Execution](https://nodejs.org/en/learn/typescript/run) — Official Node.js documentation on running TypeScript

### Tertiary (LOW confidence)
- WebSearch: "Keyword-based content mapping manual curation vs automation 2026" — Hybrid approach (60% automation, manual validation) is 2026 standard
- WebSearch: "Chapter number topic matching content cross-reference" — Cross-referencing best practices (include chapter number with headings)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — unpdf is documented, tsx already in project, existing import scripts verified
- Architecture: MEDIUM — Page-level extraction pattern is reasonable but not verified against actual HTG PDF structure (requires manual inspection)
- Pitfalls: HIGH — 352MB Penetrations PDF memory risk is real, Phase 13-02 automatic mapping failure is documented, Phase 16 infrastructure confirmed complete
- Mapping strategy: MEDIUM — Manual curation is necessary (per Phase 13-02) but workflow and timeline unclear

**Research date:** 2026-02-08
**Valid until:** 30 days for stable patterns (unpdf API, import script patterns), 7 days for fast-moving areas (unpdf updates, new PDF extraction tools)
