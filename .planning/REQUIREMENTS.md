# Requirements: Master Roofers COP v1.1

**Defined:** 2026-01-31
**Core Value:** Three-click access to authoritative roofing details with clear source attribution for Building Code citation

## v1.1 Requirements

Requirements for Unified COP Architecture milestone. Each maps to roadmap phases.

### Data Model (DATA) — COMPLETE

- [x] **DATA-01**: System stores cross-source links between MRM details and RANZ guides with explicit authority hierarchy
- [x] **DATA-02**: System groups categories into semantic topics enabling unified navigation across sources
- [x] **DATA-03**: System normalizes legislative references for proper NZBC citation format (E2/AS1 Amendment X Table Y)
- [x] **DATA-04**: System preserves all substrate sections (profiled-metal, pressed-metal, concrete-tile, clay-tile, membrane, shingle) even if empty

### Visual Authority (AUTH)

- [ ] **AUTH-01**: User can distinguish authoritative content (MRM COP) from supplementary content (RANZ Guide) through distinct visual treatment
- [ ] **AUTH-02**: User sees content capability badges (3D model, steps, warnings, case law) on detail cards in listings
- [ ] **AUTH-03**: User sees version watermark (MRM COP v25.12) on authoritative content
- [ ] **AUTH-04**: Every content block displays its source attribution

### Navigation (NAV)

- [ ] **NAV-01**: User can browse details by semantic topic showing content from all sources
- [ ] **NAV-02**: User can filter details by source (All / MRM COP / RANZ Guide)
- [ ] **NAV-03**: User can filter details by capability (Has 3D, Has Steps, Has Warnings, Has Case Law)
- [ ] **NAV-04**: User can navigate by COP section structure (Chapter/Section numbers) for consent references
- [ ] **NAV-05**: User sees substrate sections with "Coming Soon" placeholder when no content exists

### Detail Page (DETAIL)

- [ ] **DETAIL-01**: User sees RANZ 3D model and installation steps when linked to MRM detail
- [ ] **DETAIL-02**: User can view MRM technical images in gallery format (not just thumbnails)
- [ ] **DETAIL-03**: User can access related content from other source via Related tab
- [ ] **DETAIL-04**: Detail page dynamically shows only available content sections

### Search (SEARCH)

- [ ] **SEARCH-01**: Search results weight MRM content higher than RANZ content (2x boost)
- [ ] **SEARCH-02**: Search results group by source showing MRM first, then RANZ
- [ ] **SEARCH-03**: User can enable "Consent Mode" to show only authoritative content
- [ ] **SEARCH-04**: User can search by COP section number (type "4.3.2" to jump to section)

### Content Linking (LINK)

- [ ] **LINK-01**: System automatically suggests links between MRM and RANZ details by code matching
- [ ] **LINK-02**: Admin can create, edit, and delete cross-source links via admin UI
- [ ] **LINK-03**: System validates that all content scenarios work (MRM-only, RANZ-only, both linked, neither)

## v1.2+ Requirements (Future)

Deferred to later milestones. Tracked but not in current roadmap.

### BCA Integration

- **BCA-01**: System engages major BCAs (Auckland, Wellington, Christchurch) for acceptance validation
- **BCA-02**: System provides consent evidence export format
- **BCA-03**: System tracks BCA feedback on digital COP acceptance

### Advanced Features

- **ADV-01**: System detects conflicts between RANZ guidance and MRM specifications
- **ADV-02**: System provides immutable version snapshots with audit trail
- **ADV-03**: System supports multiple concurrent COP versions for transitional compliance

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| User-editable normative content | Would compromise citation integrity |
| AI-generated COP summaries | Cannot be cited as authoritative |
| Blending sources without attribution | Would cause authority dilution |
| Real-time BCA API integration | No BCA APIs exist; requires manual process |
| Membrane COP content import | Source content not yet available |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DATA-01 | Phase 7 | **Complete** |
| DATA-02 | Phase 7 | **Complete** |
| DATA-03 | Phase 7 | **Complete** |
| DATA-04 | Phase 7 | **Complete** |
| AUTH-01 | Phase 8 | Pending |
| AUTH-02 | Phase 8 | Pending |
| AUTH-03 | Phase 8 | Pending |
| AUTH-04 | Phase 8 | Pending |
| NAV-01 | Phase 9 | Pending |
| NAV-02 | Phase 9 | Pending |
| NAV-03 | Phase 9 | Pending |
| NAV-04 | Phase 9 | Pending |
| NAV-05 | Phase 9 | Pending |
| DETAIL-01 | Phase 10 | Pending |
| DETAIL-02 | Phase 10 | Pending |
| DETAIL-03 | Phase 10 | Pending |
| DETAIL-04 | Phase 10 | Pending |
| SEARCH-01 | Phase 11 | Pending |
| SEARCH-02 | Phase 11 | Pending |
| SEARCH-03 | Phase 11 | Pending |
| SEARCH-04 | Phase 11 | Pending |
| LINK-01 | Phase 12 | Pending |
| LINK-02 | Phase 12 | Pending |
| LINK-03 | Phase 12 | Pending |

**Coverage:**
- v1.1 requirements: 23 total
- Mapped to phases: 23
- Unmapped: 0

---
*Requirements defined: 2026-01-31*
*Last updated: 2026-02-01 after Phase 7 completion*
