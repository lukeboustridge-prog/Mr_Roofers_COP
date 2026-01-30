# Master Roofers COP - Development Roadmap

## Current State (January 2026)

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

## Phase 1: MRM Content Enhancement ✅ COMPLETE

**Goal:** Bring MRM details up to parity with RANZ quality

### Completed Tasks
- [x] 1.1 Audit MRM step data quality
- [x] 1.2 Improve step instructions (1013 garbage steps removed)
- [x] 1.3 Add warning conditions (138 content-derived warnings)
- [x] 1.4 Link specifications to NZBC clauses (20 standards linked)
- [x] 1.5 Clean PDF artifacts from descriptions

### Success Criteria - MET
- All MRM details have meaningful step-by-step instructions ✅
- Warning conditions trigger based on user preferences ✅
- Each detail has proper specifications and standards refs ✅

---

## Phase 2: Failure Cases Integration ✅ COMPLETE

**Goal:** Connect real MBIE/LBP decisions to roofing details

### Completed Tasks
- [x] 2.1 Research and collect MBIE determination data
- [x] 2.2 Create failure case import script
- [x] 2.3 Link failure cases to relevant details (many-to-many)
- [x] 2.4 Display failure badges on detail cards
- [x] 2.5 Create failure case detail page
- [x] 2.6 Add failure case browse/search page

### Success Criteria - MET
- 15 real failure cases imported ✅
- Each failure linked to 1+ details ✅
- Red warning badges appear on affected details ✅
- Users can browse and search failure cases ✅

---

## Phase 3: QA Checklists ✅ COMPLETE

**Goal:** Complete the on-site QA workflow for roofers

### Completed Tasks
- [x] 3.1 Photo capture/attachment to checklist items
- [x] 3.2 Upload photos to R2 storage
- [x] 3.3 Save checklist progress (resume later)
- [x] 3.4 PDF export of completed checklists
- [x] 3.5 Checklist history/archive view
- [x] 3.6 Add project reference field (job number)

### Success Criteria - MET
- Roofer can complete checklist with photos ✅
- PDF generated with all items + photos ✅
- Checklists persist across sessions ✅
- Historical checklists accessible ✅

---

## Phase 4: Search Enhancement ✅ COMPLETE

**Goal:** Fast, comprehensive search across all COP content

### Completed Tasks
- [x] 4.1 Full-text search indexing (details, steps, failures)
- [x] 4.2 Search results page with filters
- [x] 4.3 Filter by source (MRM/RANZ/Membrane)
- [x] 4.4 Filter by category, substrate
- [x] 4.5 Filter by has-warnings, has-failures
- [x] 4.6 Voice search (Web Speech API)
- [x] 4.7 Direct code jump (type "F07" → go to detail)

### Success Criteria - MET
- Search returns results quickly ✅
- Filters work correctly ✅
- Voice search works on mobile ✅
- Code search jumps directly to detail ✅

---

## Phase 5: Offline/PWA ✅ COMPLETE

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
- App works fully offline after initial load ✅
- User can download specific substrate data ✅
- Offline actions sync when reconnected ✅
- App installable on mobile/desktop ✅

---

## Phase 6: Polish & Performance 🔄 IN PROGRESS

**Goal:** Production-ready quality and speed

### Tasks
- [ ] 6.1 Lighthouse audit (target 90+ mobile)
- [x] 6.2 Accessibility improvements (skip links, aria labels, roles)
- [x] 6.3 Loading skeletons for all async content
- [x] 6.4 Error boundaries and fallbacks (global + dashboard)
- [x] 6.5 Analytics integration (abstraction layer ready)
- [x] 6.6 E2E test coverage (Playwright - 4 test files)
- [x] 6.7 Documentation update (README comprehensive)

### Success Criteria
- Lighthouse mobile score 90+ (manual audit recommended)
- Skip links and ARIA labels implemented ✅
- All critical paths have E2E tests ✅
- Documentation current ✅

---

## Future Enhancements (Post-Launch)

### Content Expansion
- [ ] Import Membrane Roofing COP when available
- [ ] Add more MBIE/LBP failure cases (target 50+)
- [ ] Add thumbnail images for MRM details
- [ ] Add 3D models for MRM details (if available)

### Feature Additions
- [ ] User analytics dashboard
- [ ] Admin reporting
- [ ] Bulk export functionality
- [ ] API for third-party integrations
- [ ] Multi-language support

### Technical Improvements
- [ ] Image optimization pipeline
- [ ] CDN optimization for 3D models
- [ ] Database query optimization
- [ ] Server-side rendering for SEO

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│                    Master Roofers COP                        │
├─────────────────────────────────────────────────────────────┤
│  Content Sources                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │  MRM COP    │ │ RANZ Guide  │ │  Membrane   │           │
│  │ 251 details │ │ 61 details  │ │ (Pending)   │           │
│  │ 528 steps   │ │ 287 steps   │ │             │           │
│  │ 159 warnings│ │ 61 3D models│ │             │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
├─────────────────────────────────────────────────────────────┤
│  Features                                                    │
│  • Planner Mode (desktop-first browsing)                    │
│  • Fixer Mode (mobile-first quick access)                   │
│  • 3D Model Viewer with step sync                           │
│  • QA Checklists with photo capture                         │
│  • Failure Cases learning system                            │
│  • Full-text search with voice                              │
│  • Offline PWA support                                      │
│  • Admin CMS                                                │
├─────────────────────────────────────────────────────────────┤
│  Tech Stack                                                  │
│  Next.js 14 | Drizzle | Neon | Clerk | R2 | Three.js       │
└─────────────────────────────────────────────────────────────┘
```

---

## Notes

- All core features are implemented and functional
- Phase 6 (Polish) is the only remaining phase before production
- User testing recommended before final launch
- Membrane COP content can be added when available (follows same import pattern)

---

*Last updated: January 2026*
