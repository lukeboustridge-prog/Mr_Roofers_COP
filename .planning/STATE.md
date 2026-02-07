# State

## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements
Progress: [░░░░░░░░░░] 0%

Last activity: 2026-02-08 — Milestone v1.2 started

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-08)

**Core value:** Three-click access to authoritative roofing details with clear source attribution for Building Code citation
**Current focus:** v1.2 Digital COP — restructure navigation to mirror MRM COP PDF

## Milestone Summary

**v1.0:** COMPLETE — Core COP Platform (Phases 1-6)
**v1.1:** COMPLETE — Unified COP Architecture (Phases 7-12) — Shipped 2026-02-03
**v1.2:** IN PROGRESS — Digital COP (Phases TBD)

## Accumulated Context

### Decisions Made (v1.1)

- MRM is authoritative (primary), RANZ is supplementary
- Blue border-left for authoritative content
- Grey border-left for supplementary content
- Bidirectional link model: supplements and supplementsTo arrays
- URL state for all filters (shareable links)
- Content borrowing with source attribution
- Three-tier confidence for link suggestions (exact/partial/related)

### Decisions Made (v1.2 Planning)

- Primary navigation restructured to mirror MRM COP PDF 19-chapter structure
- Planner mode becomes COP Reader (chapter-first), Fixer mode preserved as-is
- Supplementary content (RANZ 3D, HTG guides, case law) shown as inline collapsible panels
- MRM technical diagrams (775 images) rendered inline within sections
- HTG PDFs (Flashings, Penetrations, Cladding) need extraction pipeline
- All 19 chapters included — reference chapters as rich text, detail chapters with viewers

### Known Issues

- E2E tests require Clerk auth setup for Playwright (tests skip gracefully)
- Maximum link coverage is 11.6% given content overlap
- R2 CORS bucket policy not yet configured (app-side handling complete)

### Pending Items

None — defining requirements for v1.2.

## Session Continuity

Last session: 2026-02-08
Stopped at: v1.2 milestone initialisation — gathering requirements
Resume file: None

---
*Last updated: 2026-02-08*
