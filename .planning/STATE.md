# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-11)

**Core value:** Three-click access to authoritative roofing details with clear source attribution for Building Code citation
**Current focus:** v1.3 Content Quality & Completeness (Phase 20: RANZ Steps as Primary)

## Current Position

Phase: 22 of 23 (HTG Detail Level Mapping)
Plan: 1 of 2
Status: In Progress
Last activity: 2026-02-11 — Completed 22-01 (HTG-to-Detail Mapping Infrastructure)

Progress: [█████████████████████░░░] 93% (21 phases complete, 1 in progress)

## Milestone Summary

**v1.0:** COMPLETE -- Core COP Platform (Phases 1-6) -- January 2026
**v1.1:** COMPLETE -- Unified COP Architecture (Phases 7-12) -- 2026-02-03
**v1.2:** COMPLETE -- Digital COP (Phases 13-18) -- 2026-02-08
**v1.3:** IN PROGRESS -- Content Quality & Completeness (Phases 19-23) -- Started 2026-02-11

## Performance Metrics

**Velocity:**
- Total plans completed: 52
- Average duration: ~8min (overall)
- Total execution time: ~142.7min (v1.2 + v1.3)

**By Phase (v1.2 + v1.3):**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 13 | 2/2 | 12.5min | 6min |
| 14 | 2/2 | 6min | 3min |
| 15 | 2/2 | 10min | 5min |
| 16 | 1/1 | 6min | 6min |
| 17 | 2/2 | ~51min | ~25min |
| 18 | 2/2 | 6.4min | 3.2min |
| 19 | 2/2 | 8.3min | 4.2min |
| 20 | 1/1 | 3min | 3min |
| 21 | 2/2 | 9.5min | 4.75min |
| 22 | 1/2 | 30min | 30min |

**Recent Trend:**
- Last 5 plans: 5min, 3min, 4.5min, 5min, 30min
- Trend: Phase 22 plan 1 complete - HTG detail-level mapping with 39,532 keyword-based mappings

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting v1.3 work:

- [v1.3 Planning]: V3D runtime color extraction - GLBs have no PBR data, parse S8S_v3d_material_data at load time
- [v1.3 Planning]: RANZ steps as primary - RANZ has real installation procedures, MRM has section refs
- [v1.3 Planning]: COP excerpt fallback for MRM-only details - Better than showing "5.1" as a step
- [v1.3 Planning]: Phase 19 is data pipeline foundation (images + warnings) - other phases depend on this data
- [v1.3 Planning]: Phase 20-21 are highest-impact content fixes (61 matched details + 190 MRM-only)
- [19-01]: Manifest detail_codes as primary image source - explicit mapping from images_manifest.json with details.json fallback
- [19-01]: Delete-then-insert for warnings idempotency - warnings fully derived from JSON, safe to clear and repopulate
- [19-02]: Conditional URL construction for backwards compatibility - ImageGallery handles both full R2 URLs and relative keys
- [20-01]: Section-ref detection heuristic - pattern /^\d+(\.\d+)*[A-Z]?(\s|$)/ OR length < 40 without installation verbs
- [20-01]: RANZ steps override MRM section-refs - RANZ has actionable installation procedures, MRM has COP section references
- [20-01]: 3D sync metadata resolves through linked guides - enables step navigation on MRM details with borrowed RANZ 3D models
- [21-01]: Server-side COP excerpt resolution - fs.readFileSync acceptable for server components, chapters cached in Map
- [21-01]: Sentence-boundary truncation at ~200 chars - provides context without overwhelming, complete sentences more readable
- [21-01]: Section number pattern /^(\d+(?:\.\d+)*[A-Z]?)/ - supports letter suffixes (5A, 5.1A) for subsections
- [21-02]: Card layout for CopExcerptFallback matching StepByStep - consistent UI for both Installation content types
- [21-02]: "COP References" tab label with BookOpen icon for MRM-only details - clear distinction from installation instructions
- [21-02]: Deep-link buttons use ArrowUpRight icon - matches existing external link pattern in DetailViewer
- [22-01]: Keyword matching strategy - tokenize detail names (length > 3) + predefined keyword groups for robust HTG-to-detail mapping
- [22-01]: Batch insert size of 50 records balances performance with transaction overhead for large data populations
- [22-01]: All HTG mappings keyword-based (primary relevance) - category fallback unnecessary due to comprehensive keyword matches

### Pending Todos

- Upload remaining 667 COP section images to R2 (not blocking v1.3)

### Blockers/Concerns

- V3D color extraction (Phase 23) needs testing across all 61 models for edge cases

## Session Continuity

Last session: 2026-02-11
Stopped at: Completed 22-01 (HTG-to-Detail Mapping Infrastructure) - Phase 22 plan 1 of 2 complete
Resume file: .planning/phases/22-htg-detail-level-mapping/22-01-SUMMARY.md

---
*Last updated: 2026-02-11*
