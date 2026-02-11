# Roadmap: Master Roofers COP

## Milestones

- ✅ **v1.0 Core COP Platform** - Phases 1-6 (shipped January 2026)
- ✅ **v1.1 Unified COP Architecture** - Phases 7-12 (shipped 2026-02-03)
- ✅ **v1.2 Digital COP** - Phases 13-18 (shipped 2026-02-08)
- ✅ **v1.3 Content Quality & Completeness** - Phases 19-23 (shipped 2026-02-11)
- ✅ **v1.4 Content Quality & Navigation Restructure** - Phases 24-28 (shipped 2026-02-12)

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

---

## 🚧 v1.4 Content Quality & Navigation Restructure (In Progress)

**Milestone Goal:** Clean up messy extraction content (MRM + HTG), restructure navigation so Planner is reference-focused (COP + HTG guides) and Fixer is practical (3D models, case law, warnings), with better case law access and cross-source linking.

**Phase Numbering:** Starting at 24 (continuation from v1.3)

### Phase 24: Content Cleanup
**Goal:** Strip PDF extraction artifacts from MRM COP and HTG content while preserving technical accuracy

**Depends on:** Phase 23 (v1.3 complete)

**Requirements:** CLEAN-01, CLEAN-02, CLEAN-03, CLEAN-04

**Success Criteria** (what must be TRUE):
1. MRM COP chapter JSON content is free of embedded page numbers, footer disclaimers, and header repetition
2. HTG content records are free of page numbers, headers/footers, section number artifacts, and spurious whitespace
3. Cleaned content preserves original technical wording and accuracy (no semantic changes)
4. Cleanup is implemented as repeatable agent-driven scripts that can be re-run on future content updates
5. User viewing COP Reader or HTG content sees clean formatted text without PDF artifacts

**Plans:** TBD

Plans:
- [ ] TBD

---

### Phase 25: HTG Planner Section
**Goal:** Make HTG guides accessible as a standalone top-level Planner section with substrate-organized navigation

**Depends on:** Phase 24

**Requirements:** HTGP-01, HTGP-02, HTGP-03, HTGP-04

**Success Criteria** (what must be TRUE):
1. HTG Guides appear as a separate top-level section in Planner navigation alongside COP Reader
2. HTG section is organized by substrate (metal for now) then by topic (flashings, penetrations, cladding)
3. Individual HTG pages are browsable with clean formatted content and page-level navigation
4. HTG pages show links to relevant COP sections where mapped (via existing copSectionHtg table)
5. User in Planner mode can navigate to HTG guides independently without going through COP sections

**Plans:** TBD

Plans:
- [ ] TBD

---

### Phase 26: Case Law Overhaul
**Goal:** Surface case law inline on detail pages with meaningful summaries and provide dedicated browsable section

**Depends on:** Phase 24

**Requirements:** CASE-01, CASE-02, CASE-03, CASE-04

**Success Criteria** (what must be TRUE):
1. Case law summary and key finding are shown inline on detail pages without requiring click-through
2. Dedicated browsable case law section exists with filtering by detail type, failure type, and outcome
3. Every case entry has a direct one-click PDF link (determination or LBP complaint)
4. Case summaries are meaningful descriptions of what failed and why (not generic boilerplate)
5. User viewing a detail page sees case law context immediately without navigating away

**Plans:** TBD

Plans:
- [ ] TBD

---

### Phase 27: Cross-Source Linking
**Goal:** Establish bidirectional navigation between RANZ details, COP sections, and HTG pages

**Depends on:** Phase 25

**Requirements:** LINK-01, LINK-02, LINK-03

**Success Criteria** (what must be TRUE):
1. RANZ detail pages show links to relevant COP sections and HTG pages where relationships exist
2. COP Reader sections show links to relevant RANZ details (bidirectional navigation)
3. HTG pages show links to relevant RANZ details that cover the same topic
4. User can navigate seamlessly between RANZ supplementary content and MRM authoritative content
5. Links are contextual and relevant (not spurious associations)

**Plans:** TBD

Plans:
- [ ] TBD

---

### Phase 28: Fixer Mode Refinement
**Goal:** Sharpen Fixer mode to prioritize practical content (3D, steps, case law, warnings) with COP reference links

**Depends on:** Phase 26, Phase 27

**Requirements:** FIXER-01, FIXER-02, FIXER-03

**Success Criteria** (what must be TRUE):
1. Fixer detail pages prioritize practical content (3D models, RANZ steps, warnings, case law) over reference text
2. "View in COP" link appears on Fixer detail pages to jump to Planner for full reference context
3. Case law is accessible directly from Fixer detail pages with inline summaries and PDF links
4. User in Fixer mode sees actionable on-site content first (what to do) with option to drill into reference (why)
5. Mode distinction is clear: Planner = reference, Fixer = practical

**Plans:** TBD

Plans:
- [ ] TBD

---

## Progress

**Execution Order:**
Phases execute in numeric order: 24 → 25 → 26 → 27 → 28

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

---
*Roadmap created: 2026-02-08*
*Last updated: 2026-02-12 (v1.4 complete — all 28 phases shipped)*
