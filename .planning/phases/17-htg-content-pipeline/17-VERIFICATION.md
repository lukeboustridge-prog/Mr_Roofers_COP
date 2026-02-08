---
phase: 17-htg-content-pipeline
verified: 2026-02-08T16:45:00+13:00
status: human_needed
score: 17/17 must-haves verified
human_verification:
  - test: "View HTG panels in Chapter 8 (Flashings)"
    expected: "Collapsible 'Related HTG Guides' panel appears with Flashings guide"
    why_human: "Visual rendering and user interaction cannot be verified programmatically"
  - test: "View HTG panels in Chapter 9 (Penetrations)"
    expected: "Collapsible 'Related HTG Guides' panel appears with Penetrations guide"
    why_human: "Visual rendering and user interaction cannot be verified programmatically"
  - test: "View HTG panels in Chapter 6 and 7 (Cladding)"
    expected: "Collapsible 'Related HTG Guides' panels appear with Cladding guides"
    why_human: "Visual rendering and user interaction cannot be verified programmatically"
  - test: "Check sections without HTG mappings show no HTG panel"
    expected: "Chapters like 1-5, 10+ show no HTG panel (only chapters 6-9 have mappings)"
    why_human: "Negative case validation requires manual browsing"
  - test: "Verify HTG panel styling matches supplementary panels"
    expected: "Grey border, 'Supplementary' label, consistent with detail/case law panels"
    why_human: "Visual consistency cannot be verified programmatically"
---

# Phase 17: HTG Content Pipeline Verification Report

**Phase Goal:** HTG installation guides extracted from RANZ PDFs appear as inline supplementary panels within the relevant COP sections

**Verified:** 2026-02-08T16:45:00+13:00

**Status:** human_needed

**Re-verification:** No - initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | HTG content from the 3 RANZ PDFs (Flashings, Penetrations, Cladding) exists as structured records in the htg_content database table | VERIFIED | Database query confirms 5 records: 1 flashings (14K chars), 1 penetrations (55K chars), 3 cladding (2.6K-51K chars) |
| 2 | Each htg_content record has a valid sourceDocument, guideName, content text, and pdfPage number | VERIFIED | All 5 records have non-null sourceDocument, guideName with descriptive titles, content between 1,627-55,775 chars, and pdfPage starting numbers (1, 5, 7) |
| 3 | The import script is idempotent - running it twice produces the same row count | VERIFIED | Script deletes copSectionHtg (child) then htgContent (parent) before re-inserting, ensuring consistent state |
| 4 | HTG content records are mapped to corresponding COP sections in the cop_section_htg table | VERIFIED | Database query confirms 8 mappings exist linking htgContent records to copSections |
| 5 | Flashings HTG pages link to Chapter 8 flashing-related sections | VERIFIED | 1 mapping: flashings to cop-8 (relevance: supplementary) |
| 6 | Penetrations HTG pages link to Chapter 9 penetration-related sections | VERIFIED | 1 mapping: penetrations to cop-9 (relevance: supplementary) |
| 7 | Cladding HTG pages link to Chapter 6 cladding-related sections | VERIFIED | 3 mappings: cladding to cop-6 (relevance: supplementary) |
| 8 | Cladding HTG pages link to Chapter 7 cladding-related sections | VERIFIED | 3 mappings: cladding to cop-7 (relevance: supplementary) |
| 9 | cop_section_htg table has mappings for all 3 sourceDocuments (flashings, penetrations, cladding) | VERIFIED | 8 total mappings: 1 flashings + 1 penetrations + 6 cladding (3 to cop-6, 3 to cop-7) |

**Score:** 9/9 truths verified


### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| lib/db/import-htg-content.ts | HTG PDF extraction and database import script, 80+ lines | VERIFIED | 232 lines, substantive implementation with unpdf integration, error handling, batch insert, idempotent deletion |
| package.json (db:import-htg-content) | npm script entry for HTG import | VERIFIED | Script exists in package.json |
| lib/db/map-htg-to-cop.ts | HTG-to-COP mapping script with keyword suggestions and manual insert, 60+ lines | VERIFIED | 275 lines, two-mode CLI (suggest and insert), MAPPING_RULES array, idempotent deletion |
| package.json (db:map-htg-to-cop) | npm script entry for HTG mapping | VERIFIED | Script exists in package.json |
| lib/db/queries/supplementary.ts | Query fetches HTG guides via copSectionHtg join | VERIFIED | Lines 44-56: Query 2 fetches HTG links with joins, returns htgGuides array |
| components/cop/SectionRenderer.tsx | Renders HTG guides in SupplementaryPanel | VERIFIED | Lines 98-109: Conditional rendering of SupplementaryPanel for htgGuides |
| types/cop.ts (SupplementaryData) | Includes htgGuides array | VERIFIED | Line 62: htgGuides: SupplementaryHtg[] |

**Score:** 7/7 artifacts verified

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| import-htg-content.ts | lib/db/schema.ts | imports htgContent table | WIRED | Line 11: imports htgContent, copSectionHtg from schema |
| import-htg-content.ts | unpdf | extractText for PDF extraction | WIRED | Line 12: imports extractText, used line 127-136, unpdf in package.json |
| map-htg-to-cop.ts | lib/db/schema.ts | imports copSectionHtg, htgContent, copSections | WIRED | Line 15: imports all three tables from schema |
| supplementary.ts query | cop_section_htg table | getSupplementaryContent joins copSectionHtg | WIRED | Lines 44-56: Query 2 inner joins copSectionHtg to copSections to htgContent |
| SectionRenderer.tsx | SupplementaryPanel | renders HTG guides in panels | WIRED | Lines 98-109: Maps over htgGuides array, displays in SupplementaryPanel |
| ChapterContent.tsx | SectionRenderer.tsx | passes supplementaryContent prop | WIRED | Line 113: passes supplementaryContent to SectionRenderer |
| page.tsx | getSupplementaryContent | fetches supplementary data for chapter | WIRED | Line 56: calls getSupplementaryContent, line 73 passes to ChapterContent |

**Score:** 7/7 key links verified


### Requirements Coverage

| Requirement | Status | Evidence |
|-------------|--------|----------|
| HTG-01: Content extracted from 3 RANZ HTG PDFs into structured data | SATISFIED | 5 records in htg_content table (1 flashings, 1 penetrations, 3 cladding files) with extracted text content ranging 1.6K-55K chars |
| HTG-02: Extracted HTG content mapped to corresponding MRM COP sections | SATISFIED | 8 mappings in cop_section_htg table linking sourceDocuments to chapters: flashings to cop-8, penetrations to cop-9, cladding to cop-6 and cop-7 |
| HTG-03: HTG content appears as collapsible inline panels using SUPP-01 infrastructure | SATISFIED | SectionRenderer.tsx renders HTG guides in SupplementaryPanel (Phase 16), query wired, data flows page.tsx to ChapterContent to SectionRenderer |

### Anti-Patterns Found

None. Both scripts follow project conventions:

- Load dotenv FIRST before other imports
- Idempotent deletion (child-first: copSectionHtg then htgContent)
- Batch insert pattern
- Comprehensive error handling
- No TODO/FIXME/placeholder comments
- No stub patterns (empty returns, console.log-only implementations)


### Human Verification Required

**Why needed:** All structural verification passed - scripts exist, database has data, query is wired, renderer displays HTG guides. However, the FINAL verification that HTG panels actually appear correctly in the browser UI requires visual confirmation and user interaction testing.

#### 1. View HTG panel in Chapter 8 (Flashings)

**Test:**
1. Navigate to http://localhost:3000/cop/8
2. Scroll through the chapter content
3. Look for a collapsible panel labeled "Related HTG Guides"

**Expected:**
- Grey border panel with "Supplementary" label
- Title: "Related HTG Guides"
- Content: "RANZ Metal Roof Flashings Guide (flashings)"
- Panel collapsed by default
- Clicking expands to show guide name and source document

**Why human:** Visual rendering, panel styling, and collapse/expand interaction cannot be verified programmatically.

---

#### 2. View HTG panel in Chapter 9 (Penetrations)

**Test:**
1. Navigate to http://localhost:3000/cop/9
2. Look for "Related HTG Guides" panel

**Expected:**
- Panel appears with "RANZ Metal Roof Penetrations Guide (penetrations)"

**Why human:** Visual rendering verification.

---

#### 3. View HTG panels in Chapters 6 and 7 (Cladding)

**Test:**
1. Navigate to http://localhost:3000/cop/6
2. Navigate to http://localhost:3000/cop/7
3. Look for "Related HTG Guides" panels in both chapters

**Expected:**
- Both chapters show HTG panels
- Each panel contains 3 cladding guide entries:
  - RANZ Metal Wall Cladding Guide - Cover
  - RANZ Metal Wall Cladding Guide - 2pp
  - RANZ Metal Wall Cladding Guide - Main

**Why human:** Visual rendering and multi-guide display verification.

---

#### 4. Check sections without HTG mappings show no HTG panel

**Test:**
1. Navigate to chapters without HTG mappings (e.g., /cop/1, /cop/5, /cop/10)
2. Verify "Related HTG Guides" panel does NOT appear

**Expected:**
- Chapters 1-5, 10+ show no HTG panel
- Only chapters 6-9 should display HTG panels

**Why human:** Negative case validation - confirming absence requires manual browsing.

---

#### 5. Verify HTG panel styling matches supplementary panels

**Test:**
1. View a chapter with detail cards (e.g., /cop/8)
2. Compare visual styling of "Related HTG Guides" panel with "Related Details" panel

**Expected:**
- Both use SupplementaryPanel component
- Consistent grey border, "Supplementary" label
- Same collapse/expand behavior
- Same text styling

**Why human:** Visual consistency cannot be verified programmatically.

---


## Gaps Summary

No structural gaps found. All automated verification passed:

- 5 HTG records extracted from PDFs with real content (14K-55K chars)
- 8 mappings created linking HTG content to COP sections (chapters 6-9)
- Full end-to-end pipeline wired: page.tsx to getSupplementaryContent query to ChapterContent to SectionRenderer to SupplementaryPanel
- No stub patterns, no TODOs, no missing artifacts
- Scripts are idempotent, follow project conventions, handle errors

**Awaiting:** Human visual verification that HTG panels render correctly in the browser UI with proper styling and interaction behavior.

---

_Verified: 2026-02-08T16:45:00+13:00_
_Verifier: Claude (gsd-verifier)_
