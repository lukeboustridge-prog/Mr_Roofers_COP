# Requirements: Master Roofers COP v1.5

**Defined:** 2026-02-12
**Core Value:** Three-click access to authoritative roofing details with clear source attribution for Building Code citation

## v1.5 Requirements

Requirements for the Roofing Encyclopedia transformation. Each maps to roadmap phases.

### Article Format (ARTICLE)

- [ ] **ARTICLE-01**: COP sections render as Wikipedia-style articles with continuous prose, inline diagrams, and heading hierarchy (not flat text blocks)
- [ ] **ARTICLE-02**: Each article displays a table-of-contents sidebar showing section hierarchy with scrollspy highlighting current position
- [ ] **ARTICLE-03**: COP section numbers remain prominently displayed and function as deep-link anchors (shareable URLs for citation)
- [ ] **ARTICLE-04**: Technical diagrams render inline within article flow at the point they're referenced (not in separate galleries)
- [ ] **ARTICLE-05**: Articles use legislative-quality typography: formal section numbering, hierarchical headings, high-contrast readable prose with @tailwindcss/typography
- [ ] **ARTICLE-06**: Case law appears as inline callout annotations within article content (margin-note style, not separate tab/panel)
- [ ] **ARTICLE-07**: Version identification (COP edition, date) displayed prominently for MBIE citation validity

### Content Merging (MERGE)

- [ ] **MERGE-01**: HTG guide content is absorbed into relevant COP section articles as clearly-labelled "Practical Guidance" blocks (not standalone /guides pages)
- [ ] **MERGE-02**: Supplementary content (HTG, details, case law) is visually distinct from authoritative COP text with clear source attribution
- [ ] **MERGE-03**: Content composition engine fetches from cop_sections + htg_content + details + failure_cases in parallel and merges at render time via Server Components
- [ ] **MERGE-04**: Authority hierarchy enforced: MRM COP (primary) > MBIE Building Code refs > RANZ HTG (supplementary). No ambiguity about which source is authoritative

### Cross-Linking (XLINK)

- [ ] **XLINK-01**: Internal COP section references in text (e.g., "See 8.5.4", "refer to Section 3.7") are detected and rendered as clickable hyperlinks
- [ ] **XLINK-02**: Cross-links between COP articles and Installation Guide details are bidirectional ("View Installation Detail F24" ↔ "COP Reference §3.7.5")
- [ ] **XLINK-03**: Link density is controlled: max 5 links per paragraph, first-mention-only rule to avoid unreadable blue-text soup
- [ ] **XLINK-04**: Reference resolver provides O(1) lookup from any section number to its URL (in-memory Map built at module load)

### Navigation (NAV)

- [ ] **NAV-01**: Chapter-level browsing with collapsible sidebar TOC showing full section hierarchy (desktop: fixed sidebar, mobile: slide-out drawer)
- [ ] **NAV-02**: Breadcrumb navigation showing: COP Reader > Chapter N > Section X.Y > Subsection X.Y.Z
- [ ] **NAV-03**: Search with autocomplete across all COP content, results showing chapter/section context with text snippets
- [ ] **NAV-04**: Command palette (Cmd+K) for fast section jumping by number or keyword

### Installation Guide (INSTALL)

- [ ] **INSTALL-01**: Fixer mode renamed to "Installation Guide" with detail-centric navigation (substrate → category → detail)
- [ ] **INSTALL-02**: Installation Guide detail pages prioritise practical content: 3D models, step-by-step instructions, warnings, checklists
- [ ] **INSTALL-03**: Every Installation Guide detail links back to its relevant COP article section(s) for full reference context
- [ ] **INSTALL-04**: COP articles link to relevant Installation Guide details with preview cards ("See Installation Detail F24")

### Migration (MIGRATE)

- [ ] **MIGRATE-01**: New encyclopedia routes built in parallel with existing routes (feature-flagged) — no production disruption during development
- [ ] **MIGRATE-02**: 301 redirects from old routes (/cop/, /guides/, /planner/) to new encyclopedia routes maintained indefinitely
- [ ] **MIGRATE-03**: All internal links, search results, and navigation updated to new route structure at cutover
- [ ] **MIGRATE-04**: Sidebar and mobile navigation updated: "COP Reader" and "Installation Guide" replace "Planner"/"Fixer"/"HTG Guides"

### Substrate Architecture (SUBSTRATE)

- [ ] **SUBSTRATE-01**: Content architecture supports multiple substrates (metal first, future: concrete tile, clay tile, membrane, shingle)
- [ ] **SUBSTRATE-02**: Metal roofing content fully populated and functional as launch substrate

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Enhanced Reading Experience
- **READ-01**: Reading position persistence — store last-read section per chapter, offer "Continue from §X.Y?"
- **READ-02**: Section bookmarking — extend favourites system to COP sections
- **READ-03**: Print-friendly section export with version watermark and section numbers for BCA consent applications

### Advanced Cross-Linking
- **XLINK-05**: Natural language cross-reference parsing (not just "See X.Y" patterns — detect topic-based references)
- **XLINK-06**: Related articles sidebar ("Articles related to Ridge Flashings") based on content similarity

### Search Enhancements
- **SEARCH-01**: Faceted search with chapter/topic/source filters
- **SEARCH-02**: Search result previews with highlighted text snippets in context

### Content Expansion
- **EXP-01**: Membrane COP content import (source content not yet available)
- **EXP-02**: Concrete tile, clay tile, pressed metal substrate details
- **EXP-03**: RANZ steps rewritten as standalone instructions (independent of 3D context)
- **EXP-04**: HTG guides for non-metal substrates (when content available)

## Out of Scope

| Feature | Reason |
|---------|--------|
| AI-generated summaries | Cannot be cited as authoritative; compromises MBIE acceptance |
| Content editing/CMS for articles | Read-only reference; source content managed externally |
| User comments/annotations | Complexity not justified; would dilute authority |
| Real-time collaboration | Single-user reference tool |
| Video content | Storage/bandwidth; 3D models serve visual aid purpose |
| Reorganising COP structure | Section numbers are the industry citation system — never change |
| Pre-computed article cache | Runtime composition via Server Components preferred (avoids stale data) |
| MDX migration | Plain text + React components sufficient; MDX adds build complexity for no user benefit |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| ARTICLE-01 | Phase 29 | Done |
| ARTICLE-02 | Phase 32 | Done |
| ARTICLE-03 | Phase 29 | Done |
| ARTICLE-04 | Phase 33 | Done |
| ARTICLE-05 | Phase 29 | Done |
| ARTICLE-06 | Phase 33 | Done |
| ARTICLE-07 | Phase 29 | Done |
| MERGE-01 | Phase 30 | Done |
| MERGE-02 | Phase 30 | Done |
| MERGE-03 | Phase 30 | Done |
| MERGE-04 | Phase 30 | Done |
| XLINK-01 | Phase 31 | Done |
| XLINK-02 | Phase 31 | Done |
| XLINK-03 | Phase 31 | Done |
| XLINK-04 | Phase 31 | Done |
| NAV-01 | Phase 32 | Done |
| NAV-02 | Phase 32 | Done |
| NAV-03 | Phase 32 | Done |
| NAV-04 | Phase 32 | Done |
| INSTALL-01 | Phase 34 | Done |
| INSTALL-02 | Phase 34 | Done |
| INSTALL-03 | Phase 34 | Done |
| INSTALL-04 | Phase 34 | Done |
| MIGRATE-01 | Phase 29 | Done |
| MIGRATE-02 | Phase 35 | Pending |
| MIGRATE-03 | Phase 35 | Pending |
| MIGRATE-04 | Phase 35 | Pending |
| SUBSTRATE-01 | Phase 29 | Done |
| SUBSTRATE-02 | Phase 30 | Done |

**Coverage:**
- v1.5 requirements: 29 total
- Mapped to phases: 29 (100% coverage)
- Unmapped: 0

---
*Requirements defined: 2026-02-12*
*Last updated: 2026-02-12 after roadmap creation (all requirements mapped)*
