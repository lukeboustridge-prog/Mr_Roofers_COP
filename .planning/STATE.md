# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-11)

**Core value:** Three-click access to authoritative roofing details with clear source attribution for Building Code citation
**Current focus:** v1.3 Content Quality & Completeness (Phase 20: RANZ Steps as Primary)

## Current Position

Phase: 23 of 23 (3D Viewer Verification & Polish)
Plan: 1 of 2
Status: Complete
Last activity: 2026-02-11 — Completed 23-01 (V3D Color Extraction Verification & Transparency Polish)

Progress: [█████████████████████░░░] 98% (22 phases complete, 1 in progress)

## Milestone Summary

**v1.0:** COMPLETE -- Core COP Platform (Phases 1-6) -- January 2026
**v1.1:** COMPLETE -- Unified COP Architecture (Phases 7-12) -- 2026-02-03
**v1.2:** COMPLETE -- Digital COP (Phases 13-18) -- 2026-02-08
**v1.3:** IN PROGRESS -- Content Quality & Completeness (Phases 19-23) -- Started 2026-02-11

## Performance Metrics

**Velocity:**
- Total plans completed: 54
- Average duration: ~8.2min (overall)
- Total execution time: ~162.2min (v1.2 + v1.3)

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
| 22 | 2/2 | 34min | 17min |
| 23 | 1/2 | 15.5min | 15.5min |

**Recent Trend:**
- Last 5 plans: 4.5min, 5min, 30min, 4min, 15.5min
- Trend: Phase 23 in progress - V3D color extraction verified (100% pass), transparency handling hardened

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
- [22-02]: HtgDetailPanel collapsible sections open by default - primary content user navigated to (unlike SupplementaryPanel)
- [22-02]: HTG Guide tab positioned after Installation but before Warnings for logical content flow
- [22-02]: COP Reader deep-links (/cop/8 flashings, /cop/9 penetrations, /cop/6 cladding) provide broader context
- [23-01]: Proportional ghosting for transparent materials - min(original_opacity * 0.3, 0.25) ensures already-transparent materials ghost proportionally
- [23-01]: Restore original V3D opacity on highlight - highlight pass restores from originalOpacityMap instead of forcing 1.0
- [23-01]: GLB binary parsing without dependencies - Node.js Buffer API sufficient for extracting GLTF JSON chunk from GLB format
- [23-01]: Verification pass criteria = at least 1 valid V3D material - pragmatic threshold for usable models (61/61 passed)

### Pending Todos

- Upload remaining 667 COP section images to R2 (not blocking v1.3)

### Blockers/Concerns

None - V3D color extraction verified (100% pass rate), transparency handling hardened

## Session Continuity

Last session: 2026-02-11
Stopped at: Completed 23-01 (V3D Color Extraction Verification & Transparency Polish) - Phase 23 in progress (1/2 plans)
Resume file: .planning/phases/23-3d-viewer-verification-polish/23-01-SUMMARY.md

---
*Last updated: 2026-02-11*
