# Master Roofers COP - Development Roadmap

## Milestone v1.0 (COMPLETE)

### Completed Features
- [x] Multi-source content architecture (MRM + RANZ + Membrane placeholder)
- [x] MRM data import (251 details, 528 steps - enhanced quality)
- [x] RANZ data import (61 details, 287 steps)
- [x] 3D step synchronization (camera animation, layer visibility)
- [x] 61 RANZ 3D models on Cloudflare R2 CDN
- [x] Basic navigation (Planner/Fixer modes)
- [x] User authentication (Clerk)
- [x] Favorites system
- [x] View history
- [x] Failure cases integration (15 cases linked to details)
- [x] QA checklists with photo capture and PDF export
- [x] Full-text search with filters
- [x] Voice search (Web Speech API)
- [x] Offline/PWA support
- [x] Admin CMS for content management

---

## Phase 1: MRM Content Enhancement - COMPLETE

**Goal:** Bring MRM details up to parity with RANZ quality

### Completed Tasks
- [x] 1.1 Audit MRM step data quality
- [x] 1.2 Improve step instructions (1013 garbage steps removed)
- [x] 1.3 Add warning conditions (138 content-derived warnings)
- [x] 1.4 Link specifications to NZBC clauses (20 standards linked)
- [x] 1.5 Clean PDF artifacts from descriptions

### Success Criteria - MET
- All MRM details have meaningful step-by-step instructions
- Warning conditions trigger based on user preferences
- Each detail has proper specifications and standards refs

---

## Phase 2: Failure Cases Integration - COMPLETE

**Goal:** Connect real MBIE/LBP decisions to roofing details

### Completed Tasks
- [x] 2.1 Research and collect MBIE determination data
- [x] 2.2 Create failure case import script
- [x] 2.3 Link failure cases to relevant details (many-to-many)
- [x] 2.4 Display failure badges on detail cards
- [x] 2.5 Create failure case detail page
- [x] 2.6 Add failure case browse/search page

### Success Criteria - MET
- 15 real failure cases imported
- Each failure linked to 1+ details
- Red warning badges appear on affected details
- Users can browse and search failure cases

---

## Phase 3: QA Checklists - COMPLETE

**Goal:** Complete the on-site QA workflow for roofers

### Completed Tasks
- [x] 3.1 Photo capture/attachment to checklist items
- [x] 3.2 Upload photos to R2 storage
- [x] 3.3 Save checklist progress (resume later)
- [x] 3.4 PDF export of completed checklists
- [x] 3.5 Checklist history/archive view
- [x] 3.6 Add project reference field (job number)

### Success Criteria - MET
- Roofer can complete checklist with photos
- PDF generated with all items + photos
- Checklists persist across sessions
- Historical checklists accessible

---

## Phase 4: Search Enhancement - COMPLETE

**Goal:** Fast, comprehensive search across all COP content

### Completed Tasks
- [x] 4.1 Full-text search indexing (details, steps, failures)
- [x] 4.2 Search results page with filters
- [x] 4.3 Filter by source (MRM/RANZ/Membrane)
- [x] 4.4 Filter by category, substrate
- [x] 4.5 Filter by has-warnings, has-failures
- [x] 4.6 Voice search (Web Speech API)
- [x] 4.7 Direct code jump (type "F07" -> go to detail)

### Success Criteria - MET
- Search returns results quickly
- Filters work correctly
- Voice search works on mobile
- Code search jumps directly to detail

---

## Phase 5: Offline/PWA - COMPLETE

**Goal:** Enable on-site use without internet connection

### Completed Tasks
- [x] 5.1 Service worker setup
- [x] 5.2 Cache core app shell (HTML, CSS, JS)
- [x] 5.3 Cache API responses (details, categories)
- [x] 5.4 Downloadable substrate packages
- [x] 5.5 Offline indicator in UI
- [x] 5.6 Sync queue for offline actions
- [x] 5.7 Background sync when back online
- [x] 5.8 PWA install prompt

### Success Criteria - MET
- App works fully offline after initial load
- User can download specific substrate data
- Offline actions sync when reconnected
- App installable on mobile/desktop

---

## Phase 6: Polish & Performance - COMPLETE

**Goal:** Production-ready quality and speed

### Completed Tasks
- [x] 6.1 Performance optimization (Lighthouse audit + fixes)
- [x] 6.2 Accessibility improvements (skip links, aria labels, roles)
- [x] 6.3 Loading skeletons for all async content
- [x] 6.4 Error boundaries and fallbacks (global + dashboard)
- [x] 6.5 Analytics integration (abstraction layer ready)
- [x] 6.6 E2E test coverage (Playwright - 4 test files)
- [x] 6.7 Documentation update (README comprehensive)
- [x] 6.8 Bundle optimization (dynamic imports, tree-shaking)
- [x] 6.9 Cache headers and asset optimization

### Performance Optimizations Implemented
| Optimization | Impact |
|-------------|--------|
| Dynamic import for Three.js/Model3DViewer | -95% detail page bundle (333KB -> 16.6KB) |
| Dynamic import for CommandSearch | -40KB on initial load |
| Auth moved to layout level (non-blocking) | Faster initial render |
| Removed StoreProvider hydration blocker | Faster FCP |
| Font optimization (display: swap, preload) | No FOIT |
| Cache headers for static assets | Faster repeat visits |
| Package tree-shaking (cmdk, radix-ui, etc.) | Smaller bundles |
| Preconnect links for Clerk | Reduced connection latency |

### Lighthouse Results
| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Performance Score | 55 | 65 | +18% |
| Total Blocking Time | 740ms | 90ms | -87% |
| LCP | 7.9s | 7.0s | -11% |
| Accessibility | 91 | 93 | +2 |

### Success Criteria - MET
- Performance optimized with 87% TBT reduction
- Skip links and ARIA labels implemented
- All critical paths have E2E tests
- Documentation current

---

## Milestone v1.1: Unified COP Architecture

**Overview:** Integrate MRM Code of Practice and RANZ Installation Guides into a unified navigation system with clear source attribution, enabling Building Code citation while providing rich installation content.

**Core Value:** Three-click access to authoritative roofing details with clear source attribution for Building Code citation.

---

## Phase 7: Data Model Foundation - COMPLETE

**Goal:** Establish cross-source linking infrastructure that preserves authority hierarchy

**Dependencies:** None (foundation phase)

**Requirements:** DATA-01, DATA-02, DATA-03, DATA-04

**Plans:** 3 plans

Plans:
- [x] 07-01-PLAN.md — Schema additions (topics, detailLinks, legislativeReferences tables)
- [x] 07-02-PLAN.md — Topic seeding and category mapping
- [x] 07-03-PLAN.md — Query functions (getDetailsByTopic, getDetailWithLinks)

### Success Criteria

1. User can query details by semantic topic and receive content from both MRM and RANZ sources with correct source attribution
2. Admin can create a link between an MRM detail and a RANZ guide, and the link persists with defined authority hierarchy (MRM primary)
3. Legislative references display in proper NZBC citation format (e.g., "E2/AS1 Amendment 15 Table 20")
4. All six substrate sections appear in navigation even when categories have no content yet

### Deliverables
- [x] detail_links table with MRM-RANZ cross-references
- [x] topics and category_topics tables for semantic grouping
- [x] legislative_references normalization
- [x] Migration ensuring all substrates exist with placeholder categories
- [x] Query functions: getDetailsByTopic, getDetailWithRelatedContent

---

## Phase 8: Visual Authority System

**Goal:** Users can distinguish authoritative content from supplementary content at a glance

**Dependencies:** Phase 7 (data model must exist for source attribution)

**Requirements:** AUTH-01, AUTH-02, AUTH-03, AUTH-04

**Plans:** 3 plans

Plans:
- [ ] 08-01-PLAN.md — Foundation components (AuthoritativeContent, SupplementaryContent, ContentCapabilityBadges, getAuthorityLevel)
- [ ] 08-02-PLAN.md — Extended SourceBadge with authority variants and DetailCard enhancement
- [ ] 08-03-PLAN.md — DetailViewer integration with authority wrappers

### Success Criteria

1. User can visually distinguish MRM COP content (authoritative blue styling) from RANZ Guide content (supplementary grey styling) without reading text labels
2. User sees capability badges on detail cards indicating available content: 3D model, installation steps, warnings, case law
3. User sees "MRM COP v25.12" version watermark on all authoritative content sections
4. Every content block (description, steps, specifications, warnings) displays its source attribution badge

### Deliverables
- [ ] AuthoritativeContent and SupplementaryContent wrapper components
- [ ] SourceBadge component with MRM and RANZ variants
- [ ] ContentCapabilityBadges component (3D, steps, warnings, case law icons)
- [ ] VersionWatermark component showing COP version
- [ ] Updated DetailCard with capability badges

---

## Phase 9: Unified Navigation

**Goal:** Users can browse by semantic topic and see all relevant content from all sources

**Dependencies:** Phase 7 (topics tables), Phase 8 (source badges)

**Requirements:** NAV-01, NAV-02, NAV-03, NAV-04, NAV-05

### Success Criteria

1. User can navigate to a topic (e.g., "Flashings") and see details from both MRM COP and RANZ Guide sources in a single listing
2. User can filter a topic listing by source using tabs: "All" / "MRM COP" / "RANZ Guide"
3. User can filter a topic listing by capability: "Has 3D Model" / "Has Steps" / "Has Warnings" / "Has Case Law"
4. User can navigate by COP section number (Chapter 4 > Section 4.3 > Detail 4.3.2) for consent documentation references
5. User sees "Coming Soon" placeholder when navigating to substrate sections with no content

### Deliverables
- [ ] TopicCategoryPage showing unified source content
- [ ] SourceFilterTabs component (All / MRM / RANZ)
- [ ] CapabilityFilters component (3D, Steps, Warnings, Case Law)
- [ ] SectionNavigation for COP structure browsing
- [ ] ComingSoon placeholder for empty substrates

---

## Phase 10: Detail Page Enhancement

**Goal:** Detail pages compose content from linked sources, showing MRM specs with RANZ 3D/steps when linked

**Dependencies:** Phase 7 (detail links), Phase 8 (visual authority), Phase 9 (navigation context)

**Requirements:** DETAIL-01, DETAIL-02, DETAIL-03, DETAIL-04

### Success Criteria

1. When viewing an MRM detail that has a linked RANZ guide, user sees the RANZ 3D model and installation steps integrated into the MRM detail page (with source attribution)
2. User can view MRM technical images in a gallery modal with zoom/pan, not just as small thumbnails
3. User can access "Related Content" tab showing cross-source linked content (MRM detail links to RANZ guide and vice versa)
4. Detail page dynamically hides content sections (3D, Steps, Warnings, Related) when no content exists for that section

### Deliverables
- [ ] Enhanced DetailViewer with linked guide integration
- [ ] ImageGallery component with zoom/pan for MRM images
- [ ] RelatedContentTab showing cross-source links
- [ ] Dynamic section visibility based on content availability

---

## Phase 11: Search Enhancement

**Goal:** Search respects authority hierarchy, prioritizing MRM content for consent documentation

**Dependencies:** Phase 7 (source fields), Phase 8 (source badges)

**Requirements:** SEARCH-01, SEARCH-02, SEARCH-03, SEARCH-04

### Success Criteria

1. When searching, MRM content appears higher in results than equivalent RANZ content (MRM gets 2x relevance boost)
2. Search results display in grouped format: MRM COP section first, then RANZ Guide section, with clear visual separation
3. User can toggle "Consent Mode" to hide supplementary content and show only authoritative MRM content
4. User can type a COP section number (e.g., "4.3.2") and jump directly to that section in the COP structure

### Deliverables
- [ ] Source-weighted search with MRM 2x boost
- [ ] GroupedSearchResults component (MRM first, then RANZ)
- [ ] ConsentModeToggle hiding supplementary content
- [ ] SectionNumberSearch for direct COP navigation

---

## Phase 12: Content Linking Population

**Goal:** All MRM details are appropriately linked to RANZ guides, validated across all content scenarios

**Dependencies:** Phase 7 (link table), Phase 10 (detail display), Phase 11 (search)

**Requirements:** LINK-01, LINK-02, LINK-03

### Success Criteria

1. System suggests potential MRM-RANZ links based on code matching (F07 to F07) and name similarity, with admin approval required
2. Admin can create, edit, and delete cross-source links through the admin UI with visual preview of the link result
3. All four content scenarios work correctly: MRM-only detail (no 3D), RANZ-only detail (no warnings), both linked (combined view), neither linked (standalone view)

### Deliverables
- [ ] Auto-suggestion script for MRM-RANZ code matching
- [ ] Admin link management UI (create, edit, delete)
- [ ] E2E tests covering all four content scenarios
- [ ] Link population audit report

---

## Progress Summary

### Milestone v1.0
| Phase | Status | Requirements |
|-------|--------|--------------|
| Phase 1 | COMPLETE | MRM content quality |
| Phase 2 | COMPLETE | Failure cases |
| Phase 3 | COMPLETE | QA checklists |
| Phase 4 | COMPLETE | Search |
| Phase 5 | COMPLETE | Offline/PWA |
| Phase 6 | COMPLETE | Polish/Performance |

### Milestone v1.1: Unified COP Architecture
| Phase | Status | Requirements |
|-------|--------|--------------|
| Phase 7 | COMPLETE | DATA-01, DATA-02, DATA-03, DATA-04 |
| Phase 8 | IN PROGRESS | AUTH-01, AUTH-02, AUTH-03, AUTH-04 |
| Phase 9 | Pending | NAV-01, NAV-02, NAV-03, NAV-04, NAV-05 |
| Phase 10 | Pending | DETAIL-01, DETAIL-02, DETAIL-03, DETAIL-04 |
| Phase 11 | Pending | SEARCH-01, SEARCH-02, SEARCH-03, SEARCH-04 |
| Phase 12 | Pending | LINK-01, LINK-02, LINK-03 |

**Coverage:** 23/23 v1.1 requirements mapped

---

## Architecture Summary

```
+-------------------------------------------------------------+
|                    Master Roofers COP                        |
+-------------------------------------------------------------+
|  Content Sources                                             |
|  +-------------+ +-------------+ +-------------+             |
|  |  MRM COP    | | RANZ Guide  | |  Membrane   |             |
|  | 251 details | | 61 details  | | (Pending)   |             |
|  | 528 steps   | | 287 steps   | |             |             |
|  | 159 warnings| | 61 3D models| |             |             |
|  | AUTHORITATIVE| SUPPLEMENTARY|               |             |
|  +-------------+ +-------------+ +-------------+             |
|                      |                                       |
|                      v                                       |
|  +-----------------------------------------------------+     |
|  |              Topic-Based Unification                |     |
|  |  - Semantic topics group categories across sources  |     |
|  |  - detail_links cross-reference with authority      |     |
|  |  - Source attribution on all content blocks         |     |
|  +-----------------------------------------------------+     |
+-------------------------------------------------------------+
|  Features                                                    |
|  - Planner Mode (desktop-first browsing)                    |
|  - Fixer Mode (mobile-first quick access)                   |
|  - 3D Model Viewer with step sync                           |
|  - QA Checklists with photo capture                         |
|  - Failure Cases learning system                            |
|  - Full-text search with voice                              |
|  - Offline PWA support                                      |
|  - Admin CMS                                                |
|  - Visual authority system (v1.1)                           |
|  - Unified topic navigation (v1.1)                          |
|  - Cross-source linking (v1.1)                              |
+-------------------------------------------------------------+
|  Tech Stack                                                  |
|  Next.js 14 | Drizzle | Neon | Clerk | R2 | Three.js        |
+-------------------------------------------------------------+
```

---

## Notes

- v1.0 is production-ready pending user acceptance testing
- v1.1 focuses on multi-source unification with authority preservation
- Critical risk: authority dilution - must maintain clear MRM vs RANZ distinction
- BCA engagement deferred to v1.2+ for acceptance validation

---

*Last updated: 2026-02-01*
