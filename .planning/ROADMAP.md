# Roadmap: Master Roofers COP

## Milestones

- ✅ **v1.0 Core COP Platform** - Phases 1-6 (shipped January 2026)
- ✅ **v1.1 Unified COP Architecture** - Phases 7-12 (shipped 2026-02-03)
- ✅ **v1.2 Digital COP** - Phases 13-18 (shipped 2026-02-08)
- 🚧 **v1.3 Content Quality & Completeness** - Phases 19-23 (in progress)

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

---

## 🚧 v1.3 Content Quality & Completeness (In Progress)

**Milestone Goal:** Make every detail page actionable for a roofer - real installation steps, correct images, working 3D models, condition-aware warnings.

**Phase Numbering:** Starting at 19 (continuation from v1.2)

### Phase 19: Data Pipeline Foundation
**Goal:** Populate database with images and warnings from extraction artifacts (R2 manifest + warnings_enhanced.json)

**Depends on:** Phase 18 (v1.2 complete)

**Requirements:** IMG-01, IMG-02, IMG-03, WARN-01, WARN-02, WARN-03

**Success Criteria** (what must be TRUE):
1. Detail records have their images array populated from the 775 MRM extraction manifest entries
2. Detail image galleries display connected MRM technical diagrams on 201 detail-mapped images
3. 138 condition-aware warnings from warnings_enhanced.json are populated in the database with severity and logic fields
4. Warnings display on detail pages with correct severity styling (info/warning/critical colors)
5. Images that aren't detail-specific remain section-mapped only (no false associations created)

**Plans:** TBD

Plans:
- [ ] 19-01: TBD
- [ ] 19-02: TBD

---

### Phase 20: RANZ Steps as Primary
**Goal:** Promote RANZ installation steps from supplementary to primary content on all 61 matched detail pages

**Depends on:** Phase 19

**Requirements:** STEP-01, STEP-02, STEP-03

**Success Criteria** (what must be TRUE):
1. Roofer sees RANZ installation steps as the primary step content on all 61 RANZ-matched detail pages (not in supplementary panel)
2. RANZ step labels (a, b, c markers from extraction) display as numbered installation steps (1, 2, 3) with instruction text
3. 3D viewer stage navigation synchronizes with the primary RANZ steps (existing step-sync behavior preserved)
4. MRM section-ref steps (e.g. "5.1", "5.1A") are moved to supplementary or hidden when RANZ steps are primary

**Plans:** TBD

Plans:
- [ ] 20-01: TBD
- [ ] 20-02: TBD

---

### Phase 21: MRM COP Excerpt Fallback
**Goal:** Replace section-reference steps on 190 MRM-only details with inline COP section excerpts and deep-links

**Depends on:** Phase 20

**Requirements:** STEP-04, STEP-05, STEP-06

**Success Criteria** (what must be TRUE):
1. MRM-only details (190 without RANZ match) show an inline COP section excerpt instead of section-ref steps like "5.1"
2. MRM-only detail pages include a deep-link button to the full COP Reader section for complete context
3. Section-reference steps (e.g. "5.1", "5.1A") are removed from all 251 detail pages (no bare section numbers as steps)
4. Roofer on an MRM-only detail page sees actionable content (excerpt text + link) not just a reference code

**Plans:** TBD

Plans:
- [ ] 21-01: TBD
- [ ] 21-02: TBD

---

### Phase 22: HTG Detail-Level Mapping
**Goal:** Map HTG guide pages to specific detail codes (not just chapter root sections) and display on detail pages

**Depends on:** Phase 21

**Requirements:** HTG-01, HTG-02, HTG-03

**Success Criteria** (what must be TRUE):
1. HTG page records (350 total) are mapped to specific detail codes via database linkage or mapping script
2. Detail pages with HTG mappings show HTG content inline (collapsible panel or dedicated tab)
3. HTG content on detail pages includes a link back to the full HTG guide for broader context
4. Roofer viewing a detail page sees relevant HTG installation guidance if available (not just chapter-level HTG)

**Plans:** TBD

Plans:
- [ ] 22-01: TBD
- [ ] 22-02: TBD

---

### Phase 23: 3D Viewer Verification and Polish
**Goal:** Verify V3D color extraction across all 61 models and polish stage transitions, transparency, and environment

**Depends on:** Phase 22

**Requirements:** V3D-01, V3D-02, V3D-03

**Success Criteria** (what must be TRUE):
1. V3D color extraction renders correct material colors on all 61 GLB models (verified by spot-check on 10+ models)
2. Stage transitions (ghost/highlight transparency) work correctly with V3D-colored materials (no visual glitches)
3. Black background, lighting, and environment match roofguide.co.nz reference app appearance
4. 3D viewer loads without console errors on all 61 RANZ detail pages

**Plans:** TBD

Plans:
- [ ] 23-01: TBD
- [ ] 23-02: TBD

---

## Progress

**Execution Order:**
Phases execute in numeric order: 19 → 20 → 21 → 22 → 23

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
| 19. Data Pipeline Foundation | v1.3 | 0/? | Not started | - |
| 20. RANZ Steps as Primary | v1.3 | 0/? | Not started | - |
| 21. MRM COP Excerpt Fallback | v1.3 | 0/? | Not started | - |
| 22. HTG Detail-Level Mapping | v1.3 | 0/? | Not started | - |
| 23. 3D Viewer Verification and Polish | v1.3 | 0/? | Not started | - |

---
*Roadmap created: 2026-02-08*
*Last updated: 2026-02-11 (v1.3 phases added)*
