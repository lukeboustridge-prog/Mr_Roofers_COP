# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-08)

**Core value:** Three-click access to authoritative roofing details with clear source attribution for Building Code citation
**Current focus:** Phase 17 -- HTG Content Pipeline (v1.2 Digital COP)

## Current Position

Phase: 17 of 18 (HTG Content Pipeline)
Plan: 1 of 2 in current phase
Status: In progress
Last activity: 2026-02-08 -- Completed 17-01-PLAN.md (HTG PDF extraction)

Progress: [████████░░░] 73% (8/11 plans complete)

## Milestone Summary

**v1.0:** COMPLETE -- Core COP Platform (Phases 1-6) -- January 2026
**v1.1:** COMPLETE -- Unified COP Architecture (Phases 7-12) -- 2026-02-03
**v1.2:** IN PROGRESS -- Digital COP (Phases 13-18) -- 6 phases, 11 plans, 16 requirements

## Performance Metrics

**Velocity:**
- Total plans completed: 8 (v1.2)
- Average duration: 10.1min
- Total execution time: 81.5min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 13 | 2/2 | 12.5min | 6min |
| 14 | 2/2 | 6min | 3min |
| 15 | 2/2 | 10min | 5min |
| 16 | 1/1 | 6min | 6min |
| 17 | 1/2 | 47min | 47min |

**Recent Trend:**
- Last 5 plans: 4min, 6min, 4min, 6min, 47min (current)
- Trend: Phase 17-01 COMPLETE (HTG PDF extraction took longer due to large file handling)

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
- [14-02]: Regex-based content deduplication strips leading section number + title (COP JSON has duplicates)
- [14-02]: Level-1 sections skip heading (page h1 already shows chapter title)
- [14-02]: HeadingTag typed as 'h2'|'h3'|'h4'|'h5'|'h6' union for TypeScript type safety
- [15-01]: Single [chapterNumber] route handles both chapter numbers (1-19) and section numbers (8.5.4) by detecting dots
- [15-01]: Section deep-links redirect to chapter page with hash anchor (e.g., /cop/8.5.4 → /cop/8#section-8.5.4)
- [15-01]: Server-side breadcrumbs show chapter-level only; client-side section breadcrumbs deferred to Plan 15-02
- [15-01]: Service worker cache version v2 includes /cop route and .json extension for chapter files
- [15-02]: IntersectionObserver rootMargin '-20% 0px -75% 0px' for accurate scrollspy (top 20% zone)
- [15-02]: Client/Server boundary pattern - Server Component passes data to Client Component wrapper
- [15-02]: TOC sidebar fixed at 288px (w-72) with auto-scroll to active section via scrollIntoView
- [15-02]: Mobile drawer closes on TOC item click via onItemClick callback
- [16-01]: Use Collapsible (NOT Accordion) for independent supplementary panel state per section
- [16-01]: Map serialization via Object.fromEntries() to cross Server/Client boundary
- [16-01]: Two separate queries (details + HTG) grouped by section ID in-memory to avoid N+1
- [16-01]: Supplementary panels collapsed by default (SUPP-01) to avoid visual clutter
- [17-01]: HTG content stored as full-document records (5 total) not per-page (352+) for simpler import logic
- [17-01]: Buffer-to-Uint8Array conversion required for unpdf v1.4.0 compatibility
- [17-01]: unpdf mergePages:false returns array of page strings, join with double newlines

### Pending Todos

- Upload remaining 667 COP section images to R2 (not blocking Phase 13-02 or 14)

### Blockers/Concerns

- Hash scroll timing: 100ms delay in useHashScroll may be insufficient on slow devices (consider requestAnimationFrame pattern)
- Source data quality: Duplicate section 13.1 in extracted JSON (handled, but indicates extraction issues)
- Chapter 19 (618 KB uncompressed) may exceed 100 KB compressed target on mobile -- consider pagination
- Section-detail linking found zero automatic relationships -- manual curation needed for semantic links
- Breadcrumb truncation on mobile hides middle items -- consider ellipsis or dropdown for deep hierarchies

## Session Continuity

Last session: 2026-02-08
Stopped at: Completed 17-01 (HTG PDF extraction) - Phase 17 in progress (1/2 plans)
Resume file: .planning/phases/17-htg-content-pipeline/17-01-SUMMARY.md

---
*Last updated: 2026-02-08*
