# Master Roofers COP - Development Roadmap

## Current State (Completed)
- [x] Multi-source content architecture (MRM + RANZ + Membrane placeholder)
- [x] RANZ data import (61 details, 287 steps)
- [x] 3D step synchronization (camera animation, layer visibility)
- [x] 61 RANZ 3D models on Cloudflare R2 CDN
- [x] Basic navigation (Planner/Fixer modes)
- [x] User authentication (Clerk)
- [x] Favorites system
- [x] View history

---

## Phase 1: MRM Content Enhancement
**Goal:** Bring MRM details up to parity with RANZ quality

### Tasks
- [ ] 1.1 Audit MRM step data quality
- [ ] 1.2 Improve step instructions (clarity, completeness)
- [ ] 1.3 Add warning conditions (wind zone, corrosion, pitch)
- [ ] 1.4 Link specifications to NZBC clauses
- [ ] 1.5 Add thumbnail images for MRM details

### Success Criteria
- All MRM details have meaningful step-by-step instructions
- Warning conditions trigger based on user preferences
- Each detail has proper specifications and standards refs

---

## Phase 2: Failure Cases Integration
**Goal:** Connect real MBIE/LBP decisions to roofing details

### Tasks
- [ ] 2.1 Research and collect MBIE determination data
- [ ] 2.2 Create failure case import script
- [ ] 2.3 Link failure cases to relevant details (many-to-many)
- [ ] 2.4 Display failure badges on detail cards
- [ ] 2.5 Create failure case detail page
- [ ] 2.6 Add failure case browse/search page

### Success Criteria
- 20+ real failure cases imported
- Each failure linked to 1+ details
- Red warning badges appear on affected details
- Users can browse and search failure cases

---

## Phase 3: QA Checklists
**Goal:** Complete the on-site QA workflow for roofers

### Tasks
- [ ] 3.1 Photo capture/attachment to checklist items
- [ ] 3.2 Upload photos to R2 storage
- [ ] 3.3 Save checklist progress (resume later)
- [ ] 3.4 PDF export of completed checklists
- [ ] 3.5 Checklist history/archive view
- [ ] 3.6 Add project reference field (job number)

### Success Criteria
- Roofer can complete checklist with photos
- PDF generated with all items + photos
- Checklists persist across sessions
- Historical checklists accessible

---

## Phase 4: Search Enhancement
**Goal:** Fast, comprehensive search across all COP content

### Tasks
- [ ] 4.1 Full-text search indexing (details, steps, failures)
- [ ] 4.2 Search results page with filters
- [ ] 4.3 Filter by source (MRM/RANZ/Membrane)
- [ ] 4.4 Filter by category, substrate
- [ ] 4.5 Filter by has-warnings, has-failures
- [ ] 4.6 Voice search (Web Speech API)
- [ ] 4.7 Direct code jump (type "F07" → go to detail)

### Success Criteria
- Search returns results in <500ms
- Filters work correctly
- Voice search works on mobile
- Code search jumps directly to detail

---

## Phase 5: Offline/PWA
**Goal:** Enable on-site use without internet connection

### Tasks
- [ ] 5.1 Service worker setup (next-pwa or custom)
- [ ] 5.2 Cache core app shell (HTML, CSS, JS)
- [ ] 5.3 Cache API responses (details, categories)
- [ ] 5.4 Downloadable substrate packages (~50MB each)
- [ ] 5.5 Offline indicator in UI (yellow banner)
- [ ] 5.6 Sync queue for offline actions (favorites, history)
- [ ] 5.7 Background sync when back online
- [ ] 5.8 PWA install prompt

### Success Criteria
- App works fully offline after initial load
- User can download specific substrate data
- Offline actions sync when reconnected
- App installable on mobile/desktop

---

## Phase 6: Polish & Performance
**Goal:** Production-ready quality and speed

### Tasks
- [ ] 6.1 Lighthouse audit (target 90+ mobile)
- [ ] 6.2 Accessibility audit (WCAG 2.1 AA)
- [ ] 6.3 Loading skeletons for all async content
- [ ] 6.4 Error boundaries and fallbacks
- [ ] 6.5 Analytics integration
- [ ] 6.6 E2E test coverage (Playwright)
- [ ] 6.7 Documentation update

### Success Criteria
- Lighthouse mobile score 90+
- No accessibility violations
- All critical paths have E2E tests
- Documentation current

---

## Timeline Estimate

| Phase | Description | Relative Effort |
|-------|-------------|-----------------|
| 1 | MRM Content Enhancement | Medium |
| 2 | Failure Cases Integration | Medium |
| 3 | QA Checklists | Medium |
| 4 | Search Enhancement | Small |
| 5 | Offline/PWA | Large |
| 6 | Polish & Performance | Medium |

---

## Dependencies

```
Phase 1 (MRM) ─────┐
                   ├──→ Phase 4 (Search) ──→ Phase 6 (Polish)
Phase 2 (Failures) ┘

Phase 3 (QA) ──────────→ Phase 5 (Offline) ──→ Phase 6 (Polish)
```

- Search benefits from having MRM and Failures content ready
- Offline needs QA checklist flow finalized first
- Polish happens last after features are stable

---

## Recommended Order

1. **Phase 1: MRM Content** - Foundation for search
2. **Phase 2: Failure Cases** - High-value safety feature
3. **Phase 4: Search** - Leverages new content
4. **Phase 3: QA Checklists** - Complete user workflow
5. **Phase 5: Offline/PWA** - On-site capability
6. **Phase 6: Polish** - Final quality pass

---

## Notes

- Each phase can be broken into smaller PRs
- User testing recommended after Phases 2, 3, and 5
- Membrane COP content can be added when available (follows same pattern as RANZ import)
