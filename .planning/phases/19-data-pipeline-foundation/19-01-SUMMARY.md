---
phase: 19-data-pipeline-foundation
plan: 01
subsystem: data-pipeline
tags: [images, warnings, population, database, extraction]

dependency_graph:
  requires:
    - mrm_extract/images_manifest.json (775 images with detail_codes mapping)
    - mrm_extract/r2_image_urls.json (207 R2 URLs for uploaded images)
    - mrm_extract/warnings_enhanced.json (138 enhanced warnings)
    - mrm_extract/details.json (251 details with fallback images)
  provides:
    - details.images jsonb column populated (51 details with R2 images)
    - details.thumbnailUrl populated (51 details)
    - warning_conditions table populated (138 warnings)
  affects:
    - Phase 20-21: Content enrichment depends on image and warning data
    - Phase 22-23: HTG mapping and V3D color extraction use these as base data

tech_stack:
  added: []
  patterns:
    - Targeted database population (column-specific updates)
    - Idempotent delete-then-insert pattern for warnings
    - Image-to-detail mapping via detail_codes array
    - Two-source merge: manifest detail_codes + details.json fallback

key_files:
  created:
    - scripts/populate-detail-images.ts
    - scripts/populate-warnings.ts
  modified:
    - package.json (added db:populate-images and db:populate-warnings scripts)

decisions:
  - title: Manifest detail_codes as primary image source
    rationale: images_manifest.json has explicit detail_codes array mapping 201 images to details - more accurate than extraction inference
    alternatives: [Use only details.json, Rely on filename parsing]
    selected: Manifest primary with details.json fallback
    impact: IMG-03 compliance - section-only images stay unmapped

  - title: Delete-then-insert for warnings idempotency
    rationale: Warnings are entirely derived from JSON file - safe to clear and repopulate
    alternatives: [Upsert pattern, Check-then-insert]
    selected: Delete-then-insert
    impact: Simple, fast, no risk of duplicates or stale data

metrics:
  duration: 3m 21s
  tasks_completed: 2
  files_created: 2
  files_modified: 1
  completed_at: "2026-02-11T00:41:50Z"
---

# Phase 19 Plan 01: Data Pipeline Foundation Summary

**One-liner:** Targeted image and warning population scripts using extraction manifests - 75 images linked to 51 details, 138 warnings covering 121 detail codes.

## What Was Built

Two specialized database population scripts that update specific columns without destructive full re-imports:

### 1. Detail Images Population (`populate-detail-images.ts`)

**Data Flow:**
- Reads `images_manifest.json` (775 images) to build Map<detailCode, filename[]> from `detail_codes` arrays
- Falls back to `details.json` images field for unmapped details
- Resolves filenames to full R2 URLs via `r2_image_urls.json`
- Updates `details.images` jsonb array and `thumbnailUrl` for matching records

**Image-to-Detail Mapping Logic (IMG-03 Compliance):**
- Only images with non-empty `detail_codes` arrays get mapped to details (201 images)
- Section-only images (574 with empty detail_codes) are NOT assigned to any detail
- Manifest mapping takes priority, details.json fills gaps
- Detail IDs follow pattern: `lrm-{code.toLowerCase()}` (e.g., D01 → lrm-d01)

**Results:**
- 51 details updated with images (limited by R2 uploads - only 207/775 images uploaded so far)
- 75 total images linked (average 1.5 images per detail)
- 200 details skipped (images not in R2 manifest yet)
- 574 section-only images correctly remained unmapped (IMG-03 compliance)

### 2. Warnings Population (`populate-warnings.ts`)

**Data Flow:**
- Reads `warnings_enhanced.json` (138 entries with detailCode, conditionType, conditionValue, warningText, severity)
- Clears existing `warning_conditions` table (idempotent delete-then-insert)
- Generates warning IDs: `w-enh-{code}-{index}` (e.g., w-enh-d01-000)
- Batch inserts in groups of 50 (same pattern as import-mrm.ts)

**Results:**
- 138 warnings inserted successfully
- Covering 121 unique detail codes
- 4 condition types: other, wind_zone, corrosion_zone, pitch
- 2 severity levels: info, warning

## Deviations from Plan

None - plan executed exactly as written. Both scripts ran successfully and are idempotent.

## Key Decisions

**1. Manifest detail_codes as Primary Source**

The plan correctly prioritized `images_manifest.json` detail_codes over `details.json` inferred mappings. This ensures:
- Explicit control over which images appear on detail pages
- Section-only images stay unmapped (IMG-03 compliance)
- Fallback to details.json covers any gaps in manual tagging

**2. R2 Upload Bottleneck is Expected**

Only 207 of 775 images are in R2 (27% upload completion). This blocked 200 details from getting images, but:
- The script is ready to handle remaining images when uploaded
- State.md already documents "Upload remaining 667 COP section images to R2" as a pending todo
- Not a blocker for Phase 19 - downstream phases use whatever images are available

**3. Delete-Then-Insert for Warnings**

Rather than complex upsert logic, warnings use a clean slate approach:
- Delete all existing warning_conditions
- Re-insert all 138 from JSON
- Safe because warnings are entirely derived from the extraction file
- Simple, fast, no risk of partial updates or orphaned records

## Verification Results

Both scripts are fully idempotent:

**Images Script (re-run):**
- Same 51 details updated
- Same 75 images linked
- Same 574 section-only images unmapped

**Warnings Script (re-run):**
- 138 warnings deleted
- 138 warnings re-inserted
- Same counts across all dimensions

## Tech Debt / Follow-up

None introduced. Clean implementation following existing patterns (backfill-detail-images.ts, import-mrm.ts).

## Dependencies for Next Plans

**Phase 19-02 (Content Audit & Quality)** can now:
- Query which details have images vs. need images
- Validate warning coverage across all detail codes
- Generate reports on IMG-03 compliance

**Phase 20-21 (Content Enrichment)** depends on:
- Images array being populated (done for 51 details, will grow as R2 uploads complete)
- Warnings being in database (done - 138 warnings covering 121 details)

## Files Changed

### Created
- `scripts/populate-detail-images.ts` (189 lines)
- `scripts/populate-warnings.ts` (113 lines)

### Modified
- `package.json` (+2 npm scripts)

## Self-Check: PASSED

**Files created:**
```
FOUND: scripts/populate-detail-images.ts
FOUND: scripts/populate-warnings.ts
```

**Commits exist:**
```
FOUND: 59e287c (feat(19-01): create targeted image population script)
FOUND: d31d57f (feat(19-01): create targeted warnings population script)
```

**Scripts executable:**
```
✓ npm run db:populate-images completes successfully
✓ npm run db:populate-warnings completes successfully
```

**Database state verified:**
```
✓ 51 details have populated images arrays
✓ 138 warnings in warning_conditions table
✓ No section-only images assigned to details (IMG-03 compliance)
```

## Metrics

- **Duration:** 3m 21s
- **Tasks Completed:** 2/2
- **Commits:** 2
- **Lines Added:** 302
- **Database Records Updated:** 51 details, 138 warnings

## What's Next

Phase 19-02 will audit the populated data and identify quality gaps before Phase 20-21 enrichment begins.
