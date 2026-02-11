# Requirements: Master Roofers COP

**Defined:** 2026-02-11
**Core Value:** Three-click access to authoritative roofing details with clear source attribution for Building Code citation

## v1.4 Requirements

Requirements for Content Quality & Navigation Restructure milestone. Each maps to roadmap phases.

### Content Cleanup

- [ ] **CLEAN-01**: MRM COP chapter JSON content cleaned of embedded page numbers, footer disclaimers, and header repetition artifacts
- [ ] **CLEAN-02**: HTG content records cleaned of page numbers, headers/footers, section number artifacts, and spurious whitespace
- [ ] **CLEAN-03**: Content cleanup preserves original wording and technical accuracy (strip artifacts + light formatting only)
- [ ] **CLEAN-04**: Cleanup implemented as repeatable agent-driven scripts that can be re-run on future content updates

### HTG Planner Section

- [ ] **HTGP-01**: HTG Guides accessible as a separate top-level section in Planner navigation alongside COP Reader
- [ ] **HTGP-02**: HTG section organized by substrate (metal for now) then topic (flashings, penetrations, cladding)
- [ ] **HTGP-03**: Individual HTG pages browsable with clean formatted content and page-level navigation
- [ ] **HTGP-04**: HTG pages link to relevant COP sections where mapped (via existing copSectionHtg table)

### Cross-Source Linking

- [ ] **LINK-01**: RANZ detail pages show links to relevant COP sections and HTG pages where relationships exist
- [ ] **LINK-02**: COP Reader sections show links to relevant RANZ details (bidirectional navigation)
- [ ] **LINK-03**: HTG pages show links to relevant RANZ details that cover the same topic

### Case Law

- [ ] **CASE-01**: Case law summary and key finding shown inline on detail pages without requiring click-through
- [ ] **CASE-02**: Dedicated browsable case law section with filtering by detail type, failure type, and outcome
- [ ] **CASE-03**: Direct one-click PDF link on every case entry (determination or LBP complaint)
- [ ] **CASE-04**: Case summaries improved from generic boilerplate to meaningful descriptions of what failed and why

### Fixer Mode

- [ ] **FIXER-01**: Fixer detail pages prioritize practical content (3D models, RANZ steps, warnings, case law) over reference text
- [ ] **FIXER-02**: "View in COP" link on Fixer detail pages to jump to Planner for full reference context
- [ ] **FIXER-03**: Case law accessible directly from Fixer detail pages with inline summaries and PDF links

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Content Expansion

- **EXP-01**: Membrane COP content import (source content not yet available)
- **EXP-02**: Concrete tile, clay tile, pressed metal substrate details
- **EXP-03**: RANZ steps rewritten as standalone instructions (independent of 3D context)
- **EXP-04**: HTG guides for non-metal substrates (when content available)

### Content Authoring

- **AUTH-01**: Admin interface for editing/improving step instructions
- **AUTH-02**: HTG-to-detail mapping admin review UI
- **AUTH-03**: Image-to-detail mapping admin review UI

## Out of Scope

| Feature | Reason |
|---------|--------|
| AI-generated installation instructions | Cannot be cited as authoritative |
| New substrate content creation | Source content not available for non-metal substrates |
| Real-time collaboration on case law | Single-user workflow sufficient |
| Case law AI summarization without review | Accuracy critical for legal content |
| HTG PDF re-extraction | Current 350-record extraction is sufficient; cleanup existing content |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CLEAN-01 | TBD | Pending |
| CLEAN-02 | TBD | Pending |
| CLEAN-03 | TBD | Pending |
| CLEAN-04 | TBD | Pending |
| HTGP-01 | TBD | Pending |
| HTGP-02 | TBD | Pending |
| HTGP-03 | TBD | Pending |
| HTGP-04 | TBD | Pending |
| LINK-01 | TBD | Pending |
| LINK-02 | TBD | Pending |
| LINK-03 | TBD | Pending |
| CASE-01 | TBD | Pending |
| CASE-02 | TBD | Pending |
| CASE-03 | TBD | Pending |
| CASE-04 | TBD | Pending |
| FIXER-01 | TBD | Pending |
| FIXER-02 | TBD | Pending |
| FIXER-03 | TBD | Pending |

**Coverage:**
- v1.4 requirements: 18 total
- Mapped to phases: 0 (awaiting roadmap)
- Unmapped: 18

---
*Requirements defined: 2026-02-11*
*Last updated: 2026-02-11*
