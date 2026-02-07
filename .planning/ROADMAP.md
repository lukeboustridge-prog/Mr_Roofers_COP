# Roadmap: Master Roofers COP

## Milestones

- v1.0 Core COP Platform -- Phases 1-6 (shipped January 2026)
- v1.1 Unified COP Architecture -- Phases 7-12 (shipped 2026-02-03)
- v1.2 Digital COP -- Phases 13-18 (in progress)

<details>
<summary>v1.0 Core COP Platform (Phases 1-6) -- SHIPPED January 2026</summary>

| Phase | Name | What Shipped |
|-------|------|--------------|
| 1 | MRM Content Enhancement | 528 quality steps, 159 warnings, NZBC links |
| 2 | Failure Cases Integration | 86 case law entries linked to details |
| 3 | QA Checklists | Photo capture, PDF export, checklist persistence |
| 4 | Search Enhancement | Full-text search, filters, voice search, code jump |
| 5 | Offline/PWA | Service worker, substrate packages, sync queue |
| 6 | Polish and Performance | 87% TBT reduction, accessibility, E2E tests |

</details>

<details>
<summary>v1.1 Unified COP Architecture (Phases 7-12) -- SHIPPED 2026-02-03</summary>

| Phase | Name | What Shipped |
|-------|------|--------------|
| 7 | Data Model Foundation | Topics, detail_links, legislative references, 13 semantic topics |
| 8 | Visual Authority System | Blue/grey authority styling, capability badges, version watermarks |
| 9 | Unified Navigation | Topic browse, source/capability filters, section navigation |
| 10 | Detail Page Enhancement | Content borrowing, image gallery, related content tab |
| 11 | Search Enhancement | MRM 2x boost, grouped results, consent mode, section redirect |
| 12 | Content Linking Population | 274 link suggestions, admin UI, E2E tests |

</details>

## v1.2 Digital COP (In Progress)

**Milestone Goal:** Restructure app navigation to mirror the MRM COP PDF's 19-chapter structure so roofers can navigate the digital version exactly as they would the printed document, with supplementary content (3D models, HTG guides, case law) surfacing inline as collapsible panels.

## Phases

**Phase Numbering:**
- Integer phases (13, 14, ...): Planned milestone work
- Decimal phases (13.1, 13.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 13: Data Foundation** - COP hierarchy in database, per-chapter JSON files, image mappings
- [x] **Phase 14: Basic COP Reader** - Chapter content rendering with inline images and version display
- [ ] **Phase 15: Navigation Chrome** - Breadcrumbs, TOC sidebar/drawer, scrollspy, deep-linking
- [ ] **Phase 16: Supplementary Panels** - Inline collapsible panels for 3D models, case law, and related content
- [ ] **Phase 17: HTG Content Pipeline** - Extract HTG PDFs, map to COP sections, display as inline panels
- [ ] **Phase 18: Mode Transition and Polish** - COP Reader becomes Planner path, Fixer mode preserved, SW cache update

## Phase Details

### Phase 13: Data Foundation
**Goal**: COP structure is queryable in the database and chapter content is deliverable as lightweight per-chapter JSON files
**Depends on**: Nothing (first phase of v1.2; builds on v1.1 schema)
**Requirements**: COPR-01, COPR-02, COPR-04
**Success Criteria** (what must be TRUE):
  1. All 19 MRM COP chapters and their sections (800-1,100 sections) exist in the database with correct hierarchy and original section numbers
  2. 775 MRM technical diagrams are mapped to their parent sections in the database (772 section-mapped, 201 detail-mapped)
  3. Per-chapter JSON files exist in `/public/cop/` and each chapter file loads in under 100KB compressed on mobile
  4. Existing detail records are linked to their corresponding COP sections so supplementary content can be surfaced later
**Plans**: 2 plans

Plans:
- [x] 13-01: Database schema and COP hierarchy import
- [x] 13-02: Chapter JSON split and section-detail linking

### Phase 14: Basic COP Reader
**Goal**: Users can browse and read COP chapter content in the app with the same structure and section numbers as the printed PDF
**Depends on**: Phase 13
**Requirements**: COPR-05, COPR-06
**Success Criteria** (what must be TRUE):
  1. User can open `/cop` and see a grid of all 19 COP chapters with their titles and chapter numbers
  2. User can tap a chapter and read its full content as scrollable rich text with proper heading hierarchy, paragraphs, tables, and figures
  3. Technical diagrams from the MRM COP appear inline within their parent section content (not in a separate gallery)
  4. COP version identifier ("v25.12 -- 1 December 2025") is displayed prominently at the top of the COP Reader
**Plans**: 2 plans

Plans:
- [x] 14-01: COP types, chapter grid index page, chapter reader shell, loading skeletons
- [x] 14-02: Recursive section renderer with inline images, chapter reader wiring

### Phase 15: Navigation Chrome
**Goal**: Users can orient themselves within the COP hierarchy and navigate directly to any section via URL, breadcrumb, sidebar, or drawer
**Depends on**: Phase 14
**Requirements**: COPR-03, NAV-01, NAV-02, NAV-03
**Success Criteria** (what must be TRUE):
  1. User can navigate to any COP section via a URL containing the section number (e.g. `/cop/8.5.4`) and the page scrolls to that section
  2. Breadcrumb trail shows the full hierarchy (COP > Chapter 8 > 8.5 Flashing Types > 8.5.4 Change of Pitch) with each level tappable
  3. Desktop users see a collapsible TOC sidebar with the chapter/section tree; mobile users see a slide-out drawer
  4. As the user scrolls through chapter content, the TOC sidebar highlights the currently visible section (scrollspy)
  5. Service worker cache version is bumped and new `/cop/*` routes are cached correctly for offline use
**Plans**: 2 plans

Plans:
- [ ] 15-01-PLAN.md -- Deep-link section addressing, breadcrumbs, hash scroll polyfill, SW cache update
- [ ] 15-02-PLAN.md -- TOC sidebar (desktop), mobile drawer (Sheet), scrollspy with IntersectionObserver

### Phase 16: Supplementary Panels
**Goal**: Supplementary content (3D models, case law, related details) appears inline within COP sections as collapsible panels that are visually distinct from authoritative content
**Depends on**: Phase 14 (reader must render sections), Phase 13 (section-detail links)
**Requirements**: SUPP-01, SUPP-02
**Success Criteria** (what must be TRUE):
  1. When a COP section has linked supplementary content, a collapsible panel appears within that section -- collapsed by default
  2. User can expand a supplementary panel to see the linked 3D model viewer, case law badges, or related detail cards
  3. Supplementary panels are visually distinct from authoritative MRM content (grey border, "Supplementary" label) consistent with existing authority styling
**Plans**: TBD

Plans:
- [ ] 16-01: Supplementary panel infrastructure and content rendering

### Phase 17: HTG Content Pipeline
**Goal**: HTG installation guides extracted from RANZ PDFs appear as inline supplementary panels within the relevant COP sections
**Depends on**: Phase 16 (supplementary panel infrastructure)
**Requirements**: HTG-01, HTG-02, HTG-03
**Success Criteria** (what must be TRUE):
  1. Content from the 3 RANZ HTG PDFs (Flashings, Penetrations, Cladding) is extracted into structured data in the database
  2. Extracted HTG content is mapped to corresponding MRM COP sections (e.g. flashings HTG linked to Chapter 8 flashing sections)
  3. HTG guides appear as collapsible inline panels within the relevant COP sections, using the same supplementary panel infrastructure from Phase 16
**Plans**: TBD

Plans:
- [ ] 17-01: HTG PDF extraction and data import
- [ ] 17-02: HTG section mapping and panel integration

### Phase 18: Mode Transition and Polish
**Goal**: COP Reader is the primary Planner navigation path and Fixer mode continues unchanged, completing the Digital COP experience
**Depends on**: Phase 15 (navigation), Phase 16 (panels), Phase 17 (HTG)
**Requirements**: MODE-01, MODE-02
**Success Criteria** (what must be TRUE):
  1. Planner mode navigates to the COP Reader (chapter-first) instead of the old substrate-first navigation
  2. Fixer mode (task-first on-site navigation) continues to function exactly as before with no regressions
  3. All existing routes (`/planner/*`, `/fixer/*`, `/search/*`) remain functional -- no broken links
  4. Offline/PWA works correctly with the new COP Reader routes cached by the service worker
**Plans**: TBD

Plans:
- [ ] 18-01: Mode transition and service worker update
- [ ] 18-02: Cross-browser verification and regression testing

## Progress

**Execution Order:**
Phases execute in numeric order: 13 > 14 > 15 > 16 > 17 > 18

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 13. Data Foundation | v1.2 | 2/2 | Complete | 2026-02-08 |
| 14. Basic COP Reader | v1.2 | 2/2 | Complete | 2026-02-08 |
| 15. Navigation Chrome | v1.2 | 0/2 | Not started | - |
| 16. Supplementary Panels | v1.2 | 0/1 | Not started | - |
| 17. HTG Content Pipeline | v1.2 | 0/2 | Not started | - |
| 18. Mode Transition and Polish | v1.2 | 0/2 | Not started | - |

---
*Roadmap created: 2026-02-08*
*Last updated: 2026-02-08 (Phase 15 planned)*
