# Requirements: Master Roofers COP

**Defined:** 2026-02-08
**Core Value:** Three-click access to authoritative roofing details with clear source attribution for Building Code citation

## v1.2 Requirements

Requirements for v1.2 Digital COP milestone. Restructure navigation to mirror the MRM COP PDF structure.

### COP Reader Foundation

- [x] **COPR-01**: User can browse all 19 MRM COP chapters via a table of contents matching the PDF structure
- [x] **COPR-02**: Every section, subsection, and sub-subsection displays its original MRM COP number exactly as in the PDF (e.g. "8.5.4 Change of Pitch")
- [x] **COPR-03**: User can navigate directly to any COP section via a URL containing the section number (e.g. `/cop/8.5.4`)
- [x] **COPR-04**: Technical diagrams from the MRM COP appear inline within their parent section's content (775 images, 772 section-mapped)
- [x] **COPR-05**: Each chapter renders as scrollable rich text with proper heading hierarchy, paragraphs, tables, and figures
- [x] **COPR-06**: COP version identifier ("v25.12 -- 1 December 2025") is displayed prominently in the COP Reader

### Navigation

- [x] **NAV-01**: Breadcrumb trail shows full hierarchy (COP > Chapter 8 > 8.5 Flashing Types > 8.5.4 Change of Pitch) with each level tappable
- [x] **NAV-02**: Desktop shows a collapsible TOC sidebar with chapter/section tree; mobile shows a slide-out drawer
- [x] **NAV-03**: As user scrolls through chapter content, the TOC sidebar highlights the currently visible section (scrollspy)

### Supplementary Content

- [x] **SUPP-01**: When a COP section has linked supplementary content (3D model, HTG guide, or failure case), a collapsible inline panel appears within the section -- collapsed by default
- [x] **SUPP-02**: Supplementary panels are visually distinct from authoritative MRM content (grey border, "Supplementary" label)

### HTG Content Pipeline

- [x] **HTG-01**: Content extracted from the 3 RANZ HTG PDFs (Flashings, Penetrations, Cladding) into structured data
- [x] **HTG-02**: Extracted HTG content mapped to corresponding MRM COP sections
- [x] **HTG-03**: HTG content appears as collapsible inline panels within the relevant COP sections (using SUPP-01 infrastructure)

### Existing Modes

- [x] **MODE-01**: Fixer mode (task-first on-site navigation) continues to function unchanged
- [x] **MODE-02**: COP Reader becomes the primary "Planner" navigation path (chapter-first replaces substrate-first)

## v2 Requirements

Deferred to future milestones. Tracked but not in current roadmap.

### Additional Substrate COPs
- **SUB-01**: Membrane COP content import and integration into COP Reader
- **SUB-02**: Concrete tile COP content import
- **SUB-03**: Clay tile COP content import
- **SUB-04**: Pressed metal tile COP content import
- **SUB-05**: Asphalt shingle COP content import

### COP Reader Enhancements
- **ENH-01**: Cross-reference navigation -- internal COP references (e.g. "See 16.9") become clickable links
- **ENH-02**: Reading position persistence -- return to last-read section on revisit
- **ENH-03**: Chapter-level full-text search across COP prose content
- **ENH-04**: Print-friendly section export with version watermark
- **ENH-05**: Interactive table enhancement (sort, filter on data tables)
- **ENH-06**: Section bookmarking (extend existing favourites to COP sections)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Page-by-page PDF pagination | Scroll-based reading within chapters is the correct pattern for reference material |
| Content reorganization or renumbering | MRM COP section numbers are the industry's shared reference language -- preserve exactly |
| Inline video players | Storage/bandwidth costs; 3D models provide visual instruction |
| AI-generated section summaries | Paraphrasing normative content risks changing meaning; undermines citation integrity |
| Dual-column text layout | Conflicts with sidebar TOC and supplementary panels; single-column is correct |
| Supplementary panels expanded by default | Progressive disclosure -- panels collapsed to preserve reading flow |
| Other substrate COPs (membrane, tile, shingle) | Source content not yet available; deferred to future milestones (SUB-01 through SUB-05) |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| COPR-01 | Phase 13: Data Foundation | Complete |
| COPR-02 | Phase 13: Data Foundation | Complete |
| COPR-03 | Phase 15: Navigation Chrome | Complete |
| COPR-04 | Phase 13: Data Foundation | Complete |
| COPR-05 | Phase 14: Basic COP Reader | Complete |
| COPR-06 | Phase 14: Basic COP Reader | Complete |
| NAV-01 | Phase 15: Navigation Chrome | Complete |
| NAV-02 | Phase 15: Navigation Chrome | Complete |
| NAV-03 | Phase 15: Navigation Chrome | Complete |
| SUPP-01 | Phase 16: Supplementary Panels | Complete |
| SUPP-02 | Phase 16: Supplementary Panels | Complete |
| HTG-01 | Phase 17: HTG Content Pipeline | Complete |
| HTG-02 | Phase 17: HTG Content Pipeline | Complete |
| HTG-03 | Phase 17: HTG Content Pipeline | Complete |
| MODE-01 | Phase 18: Mode Transition and Polish | Complete |
| MODE-02 | Phase 18: Mode Transition and Polish | Complete |

**Coverage:**
- v1.2 requirements: 16 total
- Mapped to phases: 16
- Unmapped: 0

---
*Requirements defined: 2026-02-08*
*Last updated: 2026-02-08 — v1.2 milestone complete, all 16 requirements satisfied*
