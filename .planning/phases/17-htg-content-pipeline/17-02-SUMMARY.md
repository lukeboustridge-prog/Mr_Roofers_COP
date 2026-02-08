---
phase: 17-htg-content-pipeline
plan: 02
subsystem: database
tags: [htg, cop, mapping, drizzle, postgresql, content-pipeline]

# Dependency graph
requires:
  - phase: 17-01
    provides: HTG content extracted into htg_content table
  - phase: 16-01
    provides: SupplementaryPanel infrastructure and getSupplementaryContent query
provides:
  - cop_section_htg table populated with initial HTG-to-COP mappings
  - Two-mode mapping script (--suggest for keyword analysis, --insert for database population)
  - HTG guides automatically displayed in COP Reader via Phase 16 infrastructure
affects: [Phase 18 (COP Reader Enhancements), content-curation, supplementary-content]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Two-mode CLI script pattern (--suggest for analysis, --insert for execution)"
    - "Idempotent database seeding via delete-then-insert pattern"
    - "Broad initial mapping strategy (map to chapter root sections, refine later)"

key-files:
  created:
    - lib/db/map-htg-to-cop.ts
  modified:
    - package.json

key-decisions:
  - "Map ALL htgContent records to chapter root sections (cop-8, cop-9, cop-6, cop-7) for broad initial seeding"
  - "Two-mode mapping script (--suggest for keyword suggestions, --insert for database population)"
  - "HTG record IDs are slug-based from filenames, not page-level (e.g., flashings-ranz-metal-roof-flashings-web-quality-20200703republish)"
  - "Human verification deferred — user will verify HTG panels in browser later"

patterns-established:
  - "Idempotent database seeding: clear existing cop_section_htg before inserting (allows script re-runs)"
  - "Auto-generated initial mappings marked with notes field for manual curation tracking"
  - "relevance: 'supplementary' for all auto-generated HTG mappings"

# Metrics
duration: 4min
completed: 2026-02-08
---

# Phase 17 Plan 02: HTG Section Mapping Summary

**HTG-to-COP mappings created for 8 records across 3 source documents, automatically displayed via Phase 16 infrastructure**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-08T14:39:59+13:00
- **Completed:** 2026-02-08T14:43:59+13:00
- **Tasks:** 2 (1 auto-execution + 1 checkpoint)
- **Files modified:** 2

## Accomplishments

- Created `lib/db/map-htg-to-cop.ts` with --suggest (keyword analysis) and --insert (database population) modes
- Populated cop_section_htg table with 8 mappings linking HTG content to COP sections
- Flashings HTG → Chapter 8 (cop-8)
- Penetrations HTG → Chapter 9 (cop-9)
- Cladding HTG → Chapters 6 and 7 (cop-6, cop-7)
- HTG panels automatically appear in COP Reader via Phase 16 SupplementaryPanel infrastructure (no UI changes needed)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create HTG-to-COP mapping script and insert initial mappings** - `55510b2` (feat)

**Plan metadata:** (pending - to be committed with SUMMARY.md and STATE.md updates)

## Files Created/Modified

- `lib/db/map-htg-to-cop.ts` — Two-mode CLI script for HTG-to-COP mapping (--suggest for keyword-based suggestions, --insert for database seeding)
- `package.json` — Added `db:map-htg-to-cop` npm script entry

## Decisions Made

1. **Map to chapter root sections initially** — Rather than attempting granular page-to-section mappings, the --insert mode maps all HTG content for each sourceDocument to the corresponding chapter root section (cop-8, cop-9, cop-6). This provides broad initial seeding that can be refined manually later.

2. **Two-mode script pattern** — `--suggest` outputs keyword-based mapping suggestions to console (analysis only, no database changes). `--insert` performs the actual database population. This allows inspection before committing to mappings.

3. **HTG IDs are slug-based** — HTG records use file-level slugs (e.g., `flashings-ranz-metal-roof-flashings-web-quality-20200703republish`) not page-level IDs. This means each htg_content record represents an entire PDF document, not individual pages.

4. **Deferred visual verification** — User approved checkpoint with deferred verification. Visual confirmation that HTG panels display correctly in the COP Reader browser UI will happen later.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - script executed successfully, mappings inserted, Phase 16 infrastructure automatically handles display.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**HTG Content Pipeline (Phase 17) COMPLETE:**
- Plan 01: HTG PDF extraction → htg_content table ✓
- Plan 02: HTG-to-COP mappings → cop_section_htg table ✓

**What's ready:**
- HTG content flows end-to-end: PDF → database → query → UI
- Phase 16 SupplementaryPanel infrastructure successfully reused (no new UI components needed)
- cop_section_htg table ready for manual curation to refine mappings

**Deferred items:**
- Visual verification of HTG panels in browser (user will check later)
- Manual curation to refine broad chapter-level mappings into specific section mappings
- Additional HTG source documents if RANZ provides more PDFs

**Next phase:** Phase 18 (final phase in v1.2 Digital COP) — COP Reader enhancements, search functionality, or other polish tasks per roadmap.

---
*Phase: 17-htg-content-pipeline*
*Completed: 2026-02-08*
