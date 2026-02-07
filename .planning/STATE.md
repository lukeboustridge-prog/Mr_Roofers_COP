# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-08)

**Core value:** Three-click access to authoritative roofing details with clear source attribution for Building Code citation
**Current focus:** Phase 14 -- Basic COP Reader (v1.2 Digital COP)

## Current Position

Phase: 14 of 18 (Basic COP Reader)
Plan: 1 of 2 in current phase
Status: In progress
Last activity: 2026-02-08 -- Completed 14-01-PLAN.md (COP types and reader shell)

Progress: [███░░░░░░░] 27% (3/11 plans complete)

## Milestone Summary

**v1.0:** COMPLETE -- Core COP Platform (Phases 1-6) -- January 2026
**v1.1:** COMPLETE -- Unified COP Architecture (Phases 7-12) -- 2026-02-03
**v1.2:** IN PROGRESS -- Digital COP (Phases 13-18) -- 6 phases, 11 plans, 16 requirements

## Performance Metrics

**Velocity:**
- Total plans completed: 3 (v1.2)
- Average duration: 5min
- Total execution time: 15min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 13 | 2/2 | 12.5min | 6min |
| 14 | 1/2 | 2.5min | 2.5min |

**Recent Trend:**
- Last 5 plans: 9min, 3.5min, 2.5min
- Trend: Phase 14 in progress (COP reader routes)

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [v1.2 Planning]: Hybrid data model -- COP hierarchy in PostgreSQL, text in per-chapter static JSON
- [v1.2 Planning]: Routes use `/cop/[sectionNumber]` with dot notation (e.g. `/cop/8.5.4`)
- [v1.2 Planning]: COP Reader is additive -- all existing routes remain functional
- [v1.2 Planning]: Only 4 new npm packages (3 Radix primitives + unpdf for build-time)
- [13-01]: Auto-skip duplicate sections in import (source JSON has duplicate 13.1)
- [13-01]: Partial image import accepted (667 images need R2 upload, not blocking)
- [13-02]: Minified JSON output for chapter files (no pretty-printing)
- [13-02]: Chapter 19 (618 KB) exceeds 200 KB target but acceptable for initial implementation
- [13-02]: Zero section-detail links expected (COP narrative doesn't use explicit detail codes)
- [13-02]: Detail code regex pattern `\b([A-Z]\d{2,3})\b` may need refinement based on manual review
- [14-01]: fs.readFileSync in Server Components for chapter JSON (simpler than dynamic imports)
- [14-01]: Incremental rendering - basic in Plan 01, recursive SectionRenderer in Plan 02
- [14-01]: Version display format "v25.12 — 1 December 2025" satisfies COPR-06

### Pending Todos

- Upload remaining 667 COP section images to R2 (not blocking Phase 13-02 or 14)

### Blockers/Concerns

- HTG PDF extraction quality unknown until PDFs are opened (352MB Penetrations PDF may be mostly images)
- Deep-link scroll reliability needs testing (Next.js App Router hash/scroll known issues)
- Service worker cache version must bump when routes change (Phase 15 or 18)
- Source data quality: Duplicate section 13.1 in extracted JSON (handled, but indicates extraction issues)
- Chapter 19 (618 KB uncompressed) may exceed 100 KB compressed target on mobile -- consider pagination
- Section-detail linking found zero automatic relationships -- manual curation needed for semantic links

## Session Continuity

Last session: 2026-02-08
Stopped at: Completed 14-01 (COP types and reader shell) -- Phase 14 in progress
Resume file: .planning/phases/14-basic-cop-reader/14-01-SUMMARY.md

---
*Last updated: 2026-02-08*
