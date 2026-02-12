# Roadmap: Master Roofers COP

## Milestones

- ✅ **v1.0 Core COP Platform** - Phases 1-6 (shipped January 2026)
- ✅ **v1.1 Unified COP Architecture** - Phases 7-12 (shipped 2026-02-03)
- ✅ **v1.2 Digital COP** - Phases 13-18 (shipped 2026-02-08)
- ✅ **v1.3 Content Quality & Completeness** - Phases 19-23 (shipped 2026-02-11)
- ✅ **v1.4 Content Quality & Navigation Restructure** - Phases 24-28 (shipped 2026-02-12)
- ✅ **v1.5 Roofing Encyclopedia** - Phases 29-35 (shipped 2026-02-12)

## Phases

<details>
<summary>✅ v1.0 Core COP Platform (Phases 1-6) - SHIPPED January 2026</summary>

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
<summary>✅ v1.1 Unified COP Architecture (Phases 7-12) - SHIPPED 2026-02-03</summary>

| Phase | Name | What Shipped |
|-------|------|--------------|
| 7 | Data Model Foundation | Topics, detail_links, legislative references, 13 semantic topics |
| 8 | Visual Authority System | Blue/grey authority styling, capability badges, version watermarks |
| 9 | Unified Navigation | Topic browse, source/capability filters, section navigation |
| 10 | Detail Page Enhancement | Content borrowing, image gallery, related content tab |
| 11 | Search Enhancement | MRM 2x boost, grouped results, consent mode, section redirect |
| 12 | Content Linking Population | 274 link suggestions, admin UI, E2E tests |

</details>

<details>
<summary>✅ v1.2 Digital COP (Phases 13-18) - SHIPPED 2026-02-08</summary>

| Phase | Name | What Shipped |
|-------|------|--------------|
| 13 | Data Foundation | 1,121 COP sections, 775 image mappings, per-chapter JSON |
| 14 | Basic COP Reader | Chapter grid, recursive section renderer, inline images |
| 15 | Navigation Chrome | Deep-linking, breadcrumbs, TOC sidebar, scrollspy |
| 16 | Supplementary Panels | Collapsible inline panels for 3D, case law, related content |
| 17 | HTG Content Pipeline | 350 HTG records, 484 section mappings, inline panels |
| 18 | Mode Transition and Polish | COP Reader as Planner, SW v3, E2E regression tests |

Full archive: `.planning/milestones/v1.2-ROADMAP.md`

</details>

<details>
<summary>✅ v1.3 Content Quality & Completeness (Phases 19-23) - SHIPPED 2026-02-11</summary>

| Phase | Name | What Shipped |
|-------|------|--------------|
| 19 | Data Pipeline Foundation | 75 images + 138 warnings populated, UI display verified |
| 20 | RANZ Steps as Primary | RANZ steps promoted to primary on 61 matched details |
| 21 | MRM COP Excerpt Fallback | COP section excerpts replace section-refs on 190 MRM-only details |
| 22 | HTG Detail-Level Mapping | 39,532 HTG-to-detail mappings, HtgDetailPanel component |
| 23 | 3D Viewer Verification and Polish | V3D colors verified (1973/1993 valid), DoubleSide + lighting polish |

Full archive: `.planning/milestones/v1.3-ROADMAP.md`

</details>

<details>
<summary>✅ v1.4 Content Quality & Navigation Restructure (Phases 24-28) - SHIPPED 2026-02-12</summary>

| Phase | Name | What Shipped |
|-------|------|--------------|
| 24 | Content Cleanup | PDF artifacts stripped from MRM COP + HTG content |
| 25 | HTG Planner Section | HTG guides as standalone top-level Planner section |
| 26 | Case Law Overhaul | Case law inline on details + dedicated browsable section |
| 27 | Cross-Source Linking | Bidirectional RANZ-COP-HTG navigation |
| 28 | Fixer Mode Refinement | Practical content prioritized with COP reference links |

Full archive: `.planning/milestones/v1.4-ROADMAP.md`

</details>

---

## ✅ v1.5 Roofing Encyclopedia (Complete)

**Milestone Goal:** Transform the app from PDF-to-HTML rendering into a Wikipedia-style interlinked roofing encyclopedia with COP Reader (theory/reference with legislative feel) and Installation Guide (practical 3D models and procedures), merging all content sources into unified, richly hyperlinked articles anchored on COP section numbers while maintaining legislative authority.

**Phase Numbering:** Starting at 29 (continuation from v1.4)

**Target:** Seven phases delivering article format foundation, multi-source content composition, intelligent cross-linking across 1,121 sections, Wikipedia-style navigation, rich content rendering, Installation Guide transformation, and migration with legacy route redirects.

### Phase 29: Foundation & Article Architecture

**Goal:** Establish encyclopedia route structure and article format foundation with feature-flagged parallel development, enabling new encyclopedia routes at /encyclopedia/cop/ to coexist with existing /cop/ routes without production disruption.

**Depends on:** Phase 28

**Requirements:** ARTICLE-01, ARTICLE-03, ARTICLE-05, ARTICLE-07, SUBSTRATE-01, MIGRATE-01

**Success Criteria** (what must be TRUE):
1. Encyclopedia routes exist at /encyclopedia/cop/[chapter] and render COP sections as continuous prose with heading hierarchy
2. Section numbers display prominently as deep-link anchors with shareable URLs
3. Legislative typography applies: formal section numbering, hierarchical headings, high-contrast readable prose
4. Version identification shows COP edition and date for MBIE citation validity
5. Content architecture supports substrate parameter (metal roofing populated, structure ready for future substrates)
6. Feature flag controls encyclopedia route visibility without affecting existing /cop/ routes

**Plans:** 3/3 complete

Plans:
- [x] 29-01-PLAN.md — Feature flag, typography plugin, encyclopedia route scaffolding
- [x] 29-02-PLAN.md — ArticleRenderer component suite with legislative typography and TOC
- [x] 29-03-PLAN.md — Substrate-aware content architecture and types

---

### Phase 30: Content Composition Engine

**Goal:** Enable runtime article composition by fetching content from multiple sources in parallel (cop_sections, htg_content, details, failure_cases) and merging with clear authority hierarchy and source attribution.

**Depends on:** Phase 29

**Requirements:** MERGE-01, MERGE-02, MERGE-03, MERGE-04, SUBSTRATE-02

**Success Criteria** (what must be TRUE):
1. HTG guide content appears within relevant COP articles as clearly-labeled "Practical Guidance" blocks
2. Supplementary content (HTG, details, case law) is visually distinct from authoritative COP text with source attribution always visible
3. Article composer fetches from cop_sections + htg_content + details + failure_cases in parallel via Server Components
4. Authority hierarchy enforced in presentation: MRM COP primary, MBIE Building Code references secondary, RANZ HTG supplementary
5. Metal roofing content fully populated and functional as launch substrate

**Plans:** 2/2 complete

Plans:
- [x] 30-01-PLAN.md — Article composer service with parallel DB queries for HTG content and failure cases
- [x] 30-02-PLAN.md — PracticalGuidanceBlock, InlineCaseLawCallout components and chapter page integration

---

### Phase 31: Cross-Linking System

**Goal:** Implement intelligent cross-linking across all COP content with automatic detection of internal references, bidirectional links between COP articles and Installation Guide details, and strict link density controls to prevent unreadable blue-text soup.

**Depends on:** Phase 30

**Requirements:** XLINK-01, XLINK-02, XLINK-03, XLINK-04

**Success Criteria** (what must be TRUE):
1. Internal COP section references in text (e.g., "See 8.5.4", "refer to Section 3.7") render as clickable hyperlinks
2. Cross-links between COP articles and Installation Guide details are bidirectional
3. Link density controlled: maximum 5 links per paragraph, first-mention-only rule applied
4. Reference resolver provides O(1) lookup from section number to URL via in-memory Map

**Plans:** 2 plans

Plans:
- [x] 31-01-PLAN.md — ReferenceResolver (O(1) section-to-URL Map) and CrossLinkEngine (regex detection, link budget, first-mention-only)
- [x] 31-02-PLAN.md — CrossLinkedText component integration into ArticleContent with page-level ReferenceMap wiring

---

### Phase 32: Navigation & Discovery

**Goal:** Deliver Wikipedia-style navigation with collapsible sidebar TOC, scrollspy highlighting, breadcrumbs, full-text search with autocomplete, and command palette for fast section jumping.

**Depends on:** Phase 31

**Requirements:** NAV-01, NAV-02, NAV-03, NAV-04, ARTICLE-02

**Success Criteria** (what must be TRUE):
1. Chapter-level sidebar TOC displays full section hierarchy with scrollspy highlighting current section as user scrolls
2. Breadcrumb navigation shows: COP Reader > Chapter N > Section X.Y > Subsection X.Y.Z
3. Search autocomplete works across all COP content, showing chapter/section context with text snippets
4. Command palette (Cmd+K) enables fast section jumping by number or keyword
5. Table-of-contents sidebar appears on each article page showing section hierarchy

**Plans:** 2 plans

Plans:
- [x] 32-01-PLAN.md — Search index API and autocomplete UI for COP section content
- [x] 32-02-PLAN.md — Command palette (Cmd+K) for fast section jumping

---

### Phase 33: Rich Content Rendering

**Goal:** Add rich content presentation with technical diagrams rendered inline at point of reference, case law as margin-note-style callout annotations, and enhanced legislative typography via Tailwind typography plugin.

**Depends on:** Phase 32

**Requirements:** ARTICLE-04, ARTICLE-06

**Success Criteria** (what must be TRUE):
1. Technical diagrams (775 images) render inline within article flow at the point they're referenced
2. Case law appears as inline callout annotations within article content in margin-note style
3. Tailwind typography plugin configured for legislative-quality prose styling

**Plans:** 2 plans

Plans:
- [x] 33-01-PLAN.md — Legislative typography config + CopImage click-to-zoom with figure numbering
- [x] 33-02-PLAN.md — Case law margin-note float layout (desktop float-right, mobile full-width)

---

### Phase 34: Installation Guide Transformation

**Goal:** Transform Fixer mode into Installation Guide with detail-centric navigation, practical content prioritization (3D models, steps, warnings, checklists), and bidirectional links between Installation Guide details and COP article sections.

**Depends on:** Phase 33

**Requirements:** INSTALL-01, INSTALL-02, INSTALL-03, INSTALL-04

**Success Criteria** (what must be TRUE):
1. Fixer mode renamed to "Installation Guide" with updated branding and navigation labels
2. Installation Guide detail pages prioritize practical content: 3D models, step-by-step instructions, warnings, checklists
3. Every Installation Guide detail links back to relevant COP article section(s) for full reference context
4. COP articles link to relevant Installation Guide details with preview cards

**Plans:** 2 plans

Plans:
- [x] 34-01-PLAN.md — Rename Fixer to Installation Guide across all navigation, headings, and page titles
- [x] 34-02-PLAN.md — Update COP cross-links to encyclopedia routes and enhance detail preview cards

---

### Phase 35: Migration & Cutover

**Goal:** Complete the encyclopedia transformation by establishing 301 redirects from legacy routes, updating all internal links and navigation to new structure, and making encyclopedia routes the primary user experience.

**Depends on:** Phase 34

**Requirements:** MIGRATE-02, MIGRATE-03, MIGRATE-04

**Success Criteria** (what must be TRUE):
1. 301 redirects established from old routes (/cop/, /guides/, /planner/) to new encyclopedia routes
2. All internal links, search results, and navigation point to new route structure
3. Sidebar and mobile navigation updated: "COP Reader" and "Installation Guide" replace "Planner"/"Fixer"/"HTG Guides"
4. Redirects maintained indefinitely for bookmark preservation

**Plans:** 1/1 complete

Plans:
- [x] 35-01-PLAN.md — 301 redirects, navigation cutover, internal link updates

---

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → ... → 35

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. MRM Content Enhancement | v1.0 | 6/6 | Complete | January 2026 |
| 2. Failure Cases Integration | v1.0 | 4/4 | Complete | January 2026 |
| 3. QA Checklists | v1.0 | 3/3 | Complete | January 2026 |
| 4. Search Enhancement | v1.0 | 4/4 | Complete | January 2026 |
| 5. Offline/PWA | v1.0 | 5/5 | Complete | January 2026 |
| 6. Polish and Performance | v1.0 | 4/4 | Complete | January 2026 |
| 7. Data Model Foundation | v1.1 | 2/2 | Complete | 2026-02-03 |
| 8. Visual Authority System | v1.1 | 3/3 | Complete | 2026-02-03 |
| 9. Unified Navigation | v1.1 | 3/3 | Complete | 2026-02-03 |
| 10. Detail Page Enhancement | v1.1 | 4/4 | Complete | 2026-02-03 |
| 11. Search Enhancement | v1.1 | 2/2 | Complete | 2026-02-03 |
| 12. Content Linking Population | v1.1 | 2/2 | Complete | 2026-02-03 |
| 13. Data Foundation | v1.2 | 2/2 | Complete | 2026-02-08 |
| 14. Basic COP Reader | v1.2 | 2/2 | Complete | 2026-02-08 |
| 15. Navigation Chrome | v1.2 | 2/2 | Complete | 2026-02-08 |
| 16. Supplementary Panels | v1.2 | 1/1 | Complete | 2026-02-08 |
| 17. HTG Content Pipeline | v1.2 | 2/2 | Complete | 2026-02-08 |
| 18. Mode Transition and Polish | v1.2 | 2/2 | Complete | 2026-02-08 |
| 19. Data Pipeline Foundation | v1.3 | 2/2 | Complete | 2026-02-11 |
| 20. RANZ Steps as Primary | v1.3 | 1/1 | Complete | 2026-02-11 |
| 21. MRM COP Excerpt Fallback | v1.3 | 2/2 | Complete | 2026-02-11 |
| 22. HTG Detail-Level Mapping | v1.3 | 2/2 | Complete | 2026-02-11 |
| 23. 3D Viewer Verification and Polish | v1.3 | 2/2 | Complete | 2026-02-11 |
| 24. Content Cleanup | v1.4 | 1/1 | Complete | 2026-02-11 |
| 25. HTG Planner Section | v1.4 | 1/1 | Complete | 2026-02-12 |
| 26. Case Law Overhaul | v1.4 | 1/1 | Complete | 2026-02-12 |
| 27. Cross-Source Linking | v1.4 | 1/1 | Complete | 2026-02-12 |
| 28. Fixer Mode Refinement | v1.4 | 1/1 | Complete | 2026-02-12 |
| 29. Foundation & Article Architecture | v1.5 | 3/3 | Complete | 2026-02-12 |
| 30. Content Composition Engine | v1.5 | 2/2 | Complete | 2026-02-12 |
| 31. Cross-Linking System | v1.5 | 2/2 | Complete | 2026-02-12 |
| 32. Navigation & Discovery | v1.5 | 2/2 | Complete | 2026-02-12 |
| 33. Rich Content Rendering | v1.5 | 2/2 | Complete | 2026-02-12 |
| 34. Installation Guide Transformation | v1.5 | 2/2 | Complete | 2026-02-12 |
| 35. Migration & Cutover | v1.5 | 1/1 | Complete | 2026-02-12 |

---
*Roadmap created: 2026-02-08*
*Last updated: 2026-02-12 (v1.5 complete — all 35 phases shipped)*
