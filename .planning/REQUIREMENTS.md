# Requirements: Master Roofers COP

**Defined:** 2026-02-11
**Core Value:** Three-click access to authoritative roofing details with clear source attribution for Building Code citation

## v1.3 Requirements

Requirements for Content Quality & Completeness milestone. Each maps to roadmap phases.

### Installation Steps

- [ ] **STEP-01**: Roofer sees RANZ installation steps as the primary step content on all 61 RANZ-matched detail pages
- [ ] **STEP-02**: RANZ step labels (a, b, c markers) with instruction text display as numbered installation steps
- [ ] **STEP-03**: 3D viewer stage navigation synchronizes with the primary RANZ steps (existing step-sync preserved)
- [ ] **STEP-04**: MRM-only details (190 without RANZ match) show an inline COP section excerpt instead of section-ref steps
- [ ] **STEP-05**: MRM-only detail pages include a deep-link button to the full COP Reader section
- [ ] **STEP-06**: Section-reference steps (e.g. "5.1", "5.1A") are removed or replaced — no detail page shows a bare section number as a step

### HTG Integration

- [ ] **HTG-01**: HTG page records are mapped to specific detail codes (not just chapter root sections)
- [ ] **HTG-02**: Detail pages with HTG mappings show HTG content inline (collapsible panel or tab)
- [ ] **HTG-03**: HTG content on detail pages links back to the full HTG guide for broader context

### Image Pipeline

- [ ] **IMG-01**: Detail records have their images array populated from the MRM extraction manifest (775 images)
- [ ] **IMG-02**: Detail image gallery displays connected MRM technical diagrams
- [ ] **IMG-03**: Images that aren't detail-specific remain mapped to COP sections only (no false associations)

### Warning System

- [ ] **WARN-01**: 138 condition-aware warnings from warnings_enhanced.json are populated in the database
- [ ] **WARN-02**: Warnings display on detail pages with correct severity styling (info/warning/critical)
- [ ] **WARN-03**: Warnings filter based on user context preferences (wind zone, corrosion zone, pitch)

### 3D Viewer

- [ ] **V3D-01**: V3D color extraction renders correct material colors on all 61 GLB models (verified by spot-check)
- [ ] **V3D-02**: Stage transitions (ghost/highlight transparency) work correctly with V3D-colored materials
- [ ] **V3D-03**: Black background, lighting, and environment match roofguide.co.nz reference app appearance

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Content Expansion

- **EXP-01**: Membrane COP content import (source content not yet available)
- **EXP-02**: Concrete tile, clay tile, pressed metal substrate details
- **EXP-03**: RANZ steps rewritten as standalone instructions (independent of 3D context)

### Content Authoring

- **AUTH-01**: Admin interface for editing/improving step instructions
- **AUTH-02**: HTG-to-detail mapping admin review UI
- **AUTH-03**: Image-to-detail mapping admin review UI

## Out of Scope

| Feature | Reason |
|---------|--------|
| Rewriting MRM steps as new prose | Would require domain expert review; COP excerpt + link is sufficient |
| AI-generated installation instructions | Cannot be cited as authoritative |
| New substrate content creation | Source content not available for non-metal substrates |
| HTG PDF re-extraction | Current 350-record extraction is sufficient; improve mapping, not extraction |
| 3D model re-export from Verge3D | Runtime V3D parsing is sufficient; source files not available |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| STEP-01 | TBD | Pending |
| STEP-02 | TBD | Pending |
| STEP-03 | TBD | Pending |
| STEP-04 | TBD | Pending |
| STEP-05 | TBD | Pending |
| STEP-06 | TBD | Pending |
| HTG-01 | TBD | Pending |
| HTG-02 | TBD | Pending |
| HTG-03 | TBD | Pending |
| IMG-01 | TBD | Pending |
| IMG-02 | TBD | Pending |
| IMG-03 | TBD | Pending |
| WARN-01 | TBD | Pending |
| WARN-02 | TBD | Pending |
| WARN-03 | TBD | Pending |
| V3D-01 | TBD | Pending |
| V3D-02 | TBD | Pending |
| V3D-03 | TBD | Pending |

**Coverage:**
- v1.3 requirements: 18 total
- Mapped to phases: 0
- Unmapped: 18 ⚠️

---
*Requirements defined: 2026-02-11*
*Last updated: 2026-02-11 after initial definition*
