# State

## Current Position

Phase: 12 - Content Linking Population
Plan: 1 of 4 complete
Status: In progress
Progress: [##--------] 25%

Last activity: 2026-02-02 - Completed 12-01 (Link suggestion script and admin API)

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-31)

**Core value:** Three-click access to authoritative roofing details with clear source attribution for Building Code citation
**Current focus:** Phase 12 - Content Linking Population (MRM-RANZ link population)

## Milestone Summary

**v1.0:** COMPLETE (Phases 1-6)
**v1.1:** IN PROGRESS - Unified COP Architecture (Phases 7-12)

| Phase | Goal | Status |
|-------|------|--------|
| 7 | Data Model Foundation | COMPLETE (3/3 plans) |
| 8 | Visual Authority System | COMPLETE (2/2 plans) |
| 9 | Unified Navigation | COMPLETE (4/4 plans) |
| 10 | Detail Page Enhancement | COMPLETE (4/4 plans) |
| 11 | Search Enhancement | COMPLETE (3/3 plans) |
| 12 | Content Linking Population | IN PROGRESS (1/4 plans) |

## Phase 12 Progress

- 12-01: Link suggestion script and admin API - **Complete**
- 12-02: Admin link management UI - Pending
- 12-03: Link population execution - Pending
- 12-04: Verification and refinement - Pending

### Key Deliverables (12-01 Complete)
- CLI script (suggest-detail-links.ts) for auto-suggesting MRM-RANZ links
- 274 suggestions generated (26 exact, 248 related) from 251 MRM + 61 RANZ details
- Code normalization strips RANZ- prefix for matching (F07 = RANZ-F07)
- Admin API: /api/admin/links (CRUD), /api/admin/links/suggestions (on-demand)
- Three-tier confidence: exact (1.0), partial (>=0.7), related (name similarity)

## Accumulated Context

### Decisions Made
- Case law PDFs migrated to R2 (git push timeout fix)
- Admin routes need `force-dynamic` for Clerk auth
- MRM thumbnails served from R2
- Topic-based unification architecture (from research)
- MRM is authoritative (primary), RANZ is supplementary (from research)
- Self-referential FK in Drizzle schema causes TS error - add via migration SQL instead
- Raw SQL for topic aggregation (complex GROUP BY with counts)
- Bidirectional link model: supplements and supplementsTo arrays
- Blue border-left (border-primary) for authoritative content
- Grey border-left (border-slate-300) for supplementary content
- Only show capability badges for TRUE capabilities (no greyed-out placeholders)
- Icon order: 3D, Steps, Warnings, Case Law (constructive to cautionary)
- SourceBadge uses cva variants for consistent authority styling
- BookOpen icon for authoritative, Library icon for supplementary
- Authority derived from sourceId via getAuthorityLevel helper
- DetailCard replaced warning/failure badges with ContentCapabilityBadges
- URL state for all filters - enables shareable links and back button support
- Delete param when default value (source=all removes ?source from URL)
- Capability filter icons match ContentCapabilityBadges colors for consistency
- EXISTS subqueries for capability flags (more efficient than COUNT with JOINs)
- Client-side capability filtering with mounted state for hydration safety
- Source counts calculated via GROUP BY before source filter applied
- Box icon (not Cube) for 3D model badges - consistent with ContentCapabilityBadges
- ImageLightbox uses 12×12 close button for mobile accessibility
- Explicit length check for empty arrays prevents rendering "0"
- RelatedContentTab has two distinct sections (supplements and supplementsTo) for bidirectional links
- SourceAttribution wrapper pattern: bordered div + SourceAttribution component + explanatory text
- Conditional tabs filter at render time (not state-based)
- Derived display pattern: calculate display values from own + linked content before render
- Promise.all for parallel step fetching on linked details (reduces latency ~200ms to ~50ms)
- Merge pattern for combining base detail with linked content (preserves query separation)
- Images field included in base detail query for conditional Images tab rendering
- Gap closure pattern: identify verification blockers → fix schema → seed test data → verify
- Use jsonb (not text[]) for array fields in schema - consistent with existing conventions
- Toggle sets both consentMode=true AND source=mrm-cop for authoritative filtering
- Dual parameter pattern for URL state toggles (one toggle affects multiple params)
- MRM authoritative content gets 2x relevance boost in search rankings
- Use websearch_to_tsquery for safe natural language query handling
- Section number detection returns redirect URL (not search results)
- Consent mode forces sourceId='mrm-cop' filter for building consent compliance
- Search weights: name (A), description (B), specifications (C)
- SearchResultCard extracted as standalone component for reusability
- Visual separator pattern: "Supplementary Content" divider between authority sections
- Consent mode empty state provides guidance to disable toggle for supplementary content
- GroupedSearchResults composition pattern: groups by source, uses SearchResultCard
- Section redirect handling in search page (check data.redirect before displaying results)
- Strip RANZ- prefix before code comparison for normalized matching (12-01)
- Use name similarity (>=0.6) as fallback when codes differ (12-01)
- Three confidence tiers: exact (1.0), partial (>=0.7), related (>=0.5 or name match) (12-01)
- Default installation_guide linkType for auto-suggested links (12-01)

### Known Issues
- Not all MRM details have thumbnails displayed on cards

### Pending Items
- 12-02: Admin UI for link management
- 12-03: Execute link population with admin review
- 12-04: Verification and refinement

### Research Flags
- Phase 12 (Content Linking): Automated matching will have false positives/negatives - 26 exact matches are high-confidence, 248 related need manual review

## Session Continuity

Last session: 2026-02-02 04:41 UTC
Stopped at: Completed 12-01 (Link suggestion script and admin API)
Resume file: None

When resuming work:
1. 12-01 COMPLETE - suggestion script and admin API working
2. 12-02 (Admin link management UI) is next
3. 274 suggestions available (26 exact, 248 related)
4. Test suggestion script: `npx tsx scripts/suggest-detail-links.ts --dry-run`
5. Test admin API requires authentication (Clerk)

---
*Last updated: 2026-02-02 04:41 UTC*
