---
phase: 13
plan: 01
subsystem: database
tags: [drizzle, postgresql, cop-hierarchy, data-import, neon]
requires: [migration-0003]
provides: [cop-sections-table, cop-section-images-table, cop-hierarchy-data]
affects: [13-02, phase-14, phase-15]
tech-stack:
  added: []
  patterns: [recursive-tree-import, batch-insert, idempotent-scripts]
key-files:
  created:
    - lib/db/import-cop-hierarchy.ts
    - lib/db/import-cop-images.ts
    - lib/db/migrations/0004_calm_midnight.sql
  modified:
    - lib/db/schema.ts
    - package.json
decisions:
  - id: DEC-13-01-01
    title: Duplicate section handling in import
    context: Source JSON contains duplicate section 13.1
    decision: Auto-detect and skip duplicates with warning log
    rationale: Data issue in extraction, not worth blocking import
  - id: DEC-13-01-02
    title: Partial image import accepted
    context: Only 105/775 images have R2 URLs (section-detail-* images not uploaded)
    decision: Import available images, skip unmapped ones
    rationale: Script works correctly, missing R2 URLs is data prep issue for future phase
metrics:
  duration: 9min
  completed: 2026-02-08
---

# Phase 13 Plan 01: Database Schema and COP Hierarchy Import

**One-liner:** Created 5 COP data tables in PostgreSQL and imported 1,121 sections + 105 images with recursive tree structure

## Performance

| Metric | Value |
|--------|-------|
| Duration | 9 minutes |
| Tasks completed | 7/7 |
| Commits | 6 |
| Lines of code | +550 (schema, scripts, migration) |

## Accomplishments

✓ **Schema Design:** Added 5 new tables to Drizzle schema with proper relationships and indexes
✓ **Migration:** Generated and applied migration 0004 to Neon PostgreSQL
✓ **Hierarchy Import:** Recursive import of 1,121 COP sections across 19 chapters
✓ **Image Import:** Imported 105 section images with R2 URLs
✓ **Data Integrity:** Handled duplicate section IDs, proper parent/child links
✓ **Idempotent Scripts:** Both import scripts can be safely re-run

## Task Commits

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Add COP schema tables | 7d8c65b | schema.ts |
| 2 | Generate and apply migration | 4100355 | migrations/0004_calm_midnight.sql |
| 3-4 | Create import scripts | 1ee781b | import-cop-hierarchy.ts, import-cop-images.ts |
| 5 | Add scripts to package.json | 17781a9 | package.json |
| Fix | Add dotenv config | f09b3d7 | Both import scripts |
| Fix | Handle duplicate sections | 8979421 | import-cop-hierarchy.ts |
| 6 | Run hierarchy import | (no commit - data operation) | n/a |
| 7 | Run images import | (no commit - data operation) | n/a |

## Files Created

**Database Schema:**
- `lib/db/schema.ts` - Added 5 new table definitions (cop_sections, cop_section_images, cop_section_details, htg_content, cop_section_htg)

**Import Scripts:**
- `lib/db/import-cop-hierarchy.ts` - Recursively imports section tree with parent/child relationships
- `lib/db/import-cop-images.ts` - Maps images to sections from manifest + R2 URLs

**Migrations:**
- `lib/db/migrations/0004_calm_midnight.sql` - Creates 5 new tables with indexes

**Configuration:**
- `package.json` - Added `db:import-cop-hierarchy` and `db:import-cop-images` scripts

## Files Modified

- `lib/db/schema.ts` - Added boolean to imports, 80 new lines for COP tables
- `package.json` - Added 2 new npm scripts

## Decisions Made

### DEC-13-01-01: Duplicate Section Handling

**Context:** Source JSON (`sections_hierarchy.json`) contains duplicate section 13.1 with identical content

**Options:**
1. Fail import and require manual JSON fix
2. Auto-detect and skip duplicates
3. Overwrite duplicates

**Decision:** Auto-detect and skip duplicates with warning log

**Rationale:**
- Data extraction issue, not worth blocking import
- Warning log provides visibility
- First occurrence wins (maintains data integrity)
- Script remains idempotent

**Impact:** 1,121 unique sections imported (1 duplicate removed)

### DEC-13-01-02: Partial Image Import

**Context:** Only 105 of 775 images from `images_manifest.json` have corresponding R2 URLs in `r2_image_urls.json`. The R2 URLs file contains detail-specific images (e.g., "mould-damage-detail-01.png") uploaded in earlier phases, not the COP section screenshots (e.g., "section-detail-107.png").

**Options:**
1. Fail import until all images uploaded to R2
2. Import available images, skip rest with warnings
3. Generate placeholder R2 URLs

**Decision:** Import available images (105), skip unmapped ones (667) with warnings

**Rationale:**
- Script logic is correct
- Missing R2 URLs is a data preparation issue, not a code issue
- 105 images successfully linked to sections
- Remaining images can be uploaded and imported later via re-run
- Idempotent script design supports incremental data addition

**Impact:**
- 105 images imported successfully
- 667 images skipped (no R2 URL)
- 3 images skipped (no section mapping)

## Deviations from Plan

### [Rule 2 - Missing Critical] Added duplicate detection

**Found during:** Task 6 (hierarchy import)

**Issue:** Source JSON contained duplicate section 13.1, causing primary key violation

**Fix:**
- Added duplicate ID detection before insert
- Filters to unique sections only
- Logs warning for each duplicate found

**Files modified:** `lib/db/import-cop-hierarchy.ts`

**Commit:** 8979421

### [Rule 3 - Blocking] Added dotenv config to import scripts

**Found during:** Task 6 (hierarchy import attempt)

**Issue:** Scripts failed with "DATABASE_URL environment variable is not set"

**Fix:**
- Added `import { config } from 'dotenv'` and `config({ path: '.env.local' })` to both import scripts
- Pattern already used in existing `import-mrm.ts` script

**Files modified:** `import-cop-hierarchy.ts`, `import-cop-images.ts`

**Commit:** f09b3d7

### [Data Issue] Partial image import

**Context:** Plan expected 775 images to be imported, but only 105 had R2 URLs

**Root cause:** The `r2_image_urls.json` file contains URLs for detail-specific images from earlier MRM detail imports, not COP section screenshot images. COP section images (section-detail-*.png) need separate R2 upload.

**Outcome:**
- 105 images successfully imported
- 667 images skipped (no R2 URL available)
- 3 images skipped (no section mapping in manifest)
- Script logic correct, missing data is future work

**No code deviation required** - working as designed for available data

## Issues Encountered

### Source Data Quality

**Issue:** Duplicate section 13.1 in `sections_hierarchy.json`

**Resolution:** Auto-detection and skip with warning

**Preventable:** Yes - would be caught in data extraction validation

### Missing R2 URLs for Section Images

**Issue:** Only 207 R2 URLs exist, covering 105 section-mapped images

**Resolution:** Import available images, document gap

**Next steps:** Upload remaining section images to R2, re-run import

## Next Phase Readiness

### Ready for Plan 13-02

✓ COP hierarchy fully imported (1,121 sections)
✓ Section tree structure intact (parent/child relationships)
✓ Partial images imported (105 with R2 URLs)

**Blockers for 13-02:** None

**Data gaps:**
- 667 COP section images need R2 upload (can be done later, doesn't block 13-02)

### Ready for Phase 14-15 (COP Reader UI)

✓ cop_sections table populated and queryable
✓ Section numbers, titles, levels, sort order all correct
✓ Image URLs available for sections that have them

**Recommendation:** Upload remaining section images to R2 before Phase 14 UI work, but not blocking

## Schema Summary

### Tables Created (5)

1. **cop_sections** - Hierarchical section structure
   - 1,121 records imported
   - 19 chapters (level 1)
   - Nested subsections (level 2-4)
   - All have content flag set correctly

2. **cop_section_images** - Image-to-section mapping
   - 105 records imported
   - Links images to specific COP sections
   - Includes dimensions, captions, sort order

3. **cop_section_details** - Links COP sections to existing detail records
   - Empty (populated in Plan 13-02)

4. **htg_content** - How-To Guide content
   - Empty (populated in Phase 17)

5. **cop_section_htg** - Links COP sections to HTG guides
   - Empty (populated in Phase 17)

### Indexes Created

- `idx_cop_sections_chapter` - Fast chapter lookups
- `idx_cop_sections_parent` - Fast tree traversal
- `idx_cop_sections_number` - Unique section number queries
- `idx_cop_section_images_section` - Fast image lookups by section
- `idx_cop_section_images_filename` - Fast image lookups by filename

## Import Statistics

### Hierarchy Import

- **Total sections:** 1,121 (1 duplicate removed from 1,122 extracted)
- **Chapters:** 19
- **Sections with content:** 1,121 (100%)
- **Max depth:** 4 levels
- **Sample sections:**
  - 1 (Level 1): Introduction
  - 1.1 (Level 2): Disclaimer and Copyright
  - 8.5.4 (Level 3): Apron Flashings
  - 19 (Level 1): Revision History

### Images Import

- **Total images in manifest:** 775
- **Images imported:** 105
- **Images skipped:** 670
  - 667 without R2 URLs
  - 3 without section mapping
- **Top sections by image count:**
  - cop-14.21A: 4 images
  - cop-4.10.3C: 3 images
  - cop-10.1.4A: 3 images
  - cop-14.21I: 3 images
  - cop-15.1.10A: 3 images

## Technical Notes

### Recursive Import Strategy

The hierarchy import uses a recursive depth-first traversal:

1. Read top-level chapters (1-19)
2. For each chapter, recursively process subsections
3. Maintain global sort order counter for tree traversal
4. Calculate level and parent ID from section number
5. Batch insert in groups of 100 for performance

### Section ID Format

- Pattern: `cop-{sectionNumber}`
- Examples: `cop-1`, `cop-1.1`, `cop-8.5.4A`
- Handles variant suffixes (A, B, C)

### Parent/Child Relationships

- Chapter 1 (`cop-1`) → parent_id: NULL
- Section 1.1 (`cop-1.1`) → parent_id: `cop-1`
- Section 1.1.1 (`cop-1.1.1`) → parent_id: `cop-1.1`

### Idempotent Design

Both scripts use `DELETE` + `INSERT` pattern:
1. Clear existing records
2. Import fresh data
3. Safe to re-run without side effects

### Database Connection

- Uses Drizzle ORM with Neon PostgreSQL
- Lazy connection initialization via proxy
- Requires `DATABASE_URL` from `.env.local`

## Future Enhancements

1. **Upload remaining section images to R2** (667 images)
2. **Verify section content extraction** (all sections have content flag, validate quality)
3. **Add section full-text search** (search_vector column prepared but not populated)
4. **Link sections to existing details** (Plan 13-02)
5. **Extract and import HTG content** (Phase 17)

---

**Status:** ✓ Complete
**Next:** Plan 13-02 - Link COP sections to existing detail records
