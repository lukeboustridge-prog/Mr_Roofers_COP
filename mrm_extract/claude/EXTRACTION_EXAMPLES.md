# Example Output Files for MRM COP Extraction

This document shows exactly what the output files should look like.

## 1. details.json - Example

```json
[
  {
    "code": "F07",
    "name": "Ridge Flashing",
    "description": "Ridge flashings provide weather protection at the apex of the roof where two roof planes meet. The flashing must allow for ventilation while preventing water ingress.",
    "category": "flashings",
    "substrate": "profiled-metal",
    "min_pitch": 3.0,
    "max_pitch": null,
    "wind_zone_min": "M",
    "specifications": {
      "material": "0.55mm steel minimum (G550)",
      "coverage": "150mm each side of ridge",
      "fastening": "Every rib",
      "clearance": "25mm minimum above cladding",
      "finish": "Pre-painted or unpainted zincalume"
    },
    "steps": [
      {
        "step": 1,
        "instruction": "Install continuous ridge ventilation strip first",
        "note": "Ensure vent is compatible with profile"
      },
      {
        "step": 2,
        "instruction": "Position ridge capping centrally over ridge line",
        "note": "Maintain 25mm clearance for ventilation"
      },
      {
        "step": 3,
        "instruction": "Fasten through every rib into purlins below",
        "note": "Use appropriate fasteners with sealing washers"
      },
      {
        "step": 4,
        "instruction": "Overlap end laps by minimum 150mm",
        "note": "Direction of overlap follows prevailing wind"
      }
    ],
    "standards_refs": [
      {
        "code": "E2/AS1",
        "clause": "Table 1",
        "title": "External moisture requirements"
      },
      {
        "code": "AS/NZS 2728",
        "clause": "Section 2.8",
        "title": "Coating durability requirements"
      }
    ],
    "ventilation_checks": [
      {
        "check": "Ridge vent installed and unobstructed",
        "required": true,
        "nzbc_ref": "E3/AS1"
      },
      {
        "check": "25mm minimum clearance maintained",
        "required": true
      }
    ],
    "images": [
      "ridge-flashing-installation-detail.png",
      "ridge-flashing-section-view.png",
      "ridge-vent-clearance-diagram.png"
    ],
    "pdf_pages": [201, 202, 203],
    "related_details": ["F01", "V01"]
  },
  {
    "code": "P02",
    "name": "Arrowhead Back Curb",
    "description": "Arrowhead back curbs are used for penetrations where the penetration is located in the upper third of the roof run. The arrowhead design diverts water around the penetration.",
    "category": "penetrations",
    "substrate": "profiled-metal",
    "min_pitch": 8.0,
    "max_pitch": 30.0,
    "wind_zone_min": "L",
    "specifications": {
      "material": "0.55mm steel matching roof cladding",
      "min_height": "150mm above cladding",
      "curb_width": "Penetration width + 100mm each side",
      "arrowhead_angle": "90 degrees minimum"
    },
    "steps": [
      {
        "step": 1,
        "instruction": "Frame curb to required height (150mm minimum)",
        "note": "Ensure structural support adequate for wind loads"
      },
      {
        "step": 2,
        "instruction": "Install compression timber around curb perimeter"
      },
      {
        "step": 3,
        "instruction": "Form arrowhead divider pointing upslope",
        "note": "90-degree minimum angle"
      },
      {
        "step": 4,
        "instruction": "Install back flashings over curb",
        "note": "Extend 200mm minimum up penetration"
      }
    ],
    "standards_refs": [
      {
        "code": "E2/AS1",
        "clause": "9.1.7",
        "title": "Penetration requirements"
      }
    ],
    "ventilation_checks": [
      {
        "check": "Ensure curb does not block roof ventilation paths",
        "required": true
      }
    ],
    "images": [
      "arrowhead-curb-isometric.png",
      "arrowhead-curb-plan-view.png",
      "arrowhead-curb-section-detail.png"
    ],
    "pdf_pages": [315, 316],
    "related_details": ["P01", "P03", "F04"]
  }
]
```

## 2. images_manifest.json - Example

```json
{
  "ridge-flashing-installation-detail.png": {
    "source_page": 201,
    "detail_codes": ["F07"],
    "caption": "Ridge flashing installation showing fastening pattern and ventilation clearance",
    "type": "technical_diagram",
    "dimensions": {
      "width": 1600,
      "height": 1200
    },
    "section": "8.5.1"
  },
  "ridge-flashing-section-view.png": {
    "source_page": 202,
    "detail_codes": ["F07", "V01"],
    "caption": "Cross-section view of ridge flashing with continuous ventilation",
    "type": "technical_diagram",
    "dimensions": {
      "width": 1400,
      "height": 800
    },
    "section": "8.5.1"
  },
  "arrowhead-curb-isometric.png": {
    "source_page": 315,
    "detail_codes": ["P02"],
    "caption": "Isometric view of arrowhead back curb construction",
    "type": "technical_diagram",
    "dimensions": {
      "width": 1800,
      "height": 1400
    },
    "section": "9.4.2.2"
  }
}
```

## 3. standards.json - Example

```json
[
  {
    "code": "AS/NZS 2728",
    "title": "Prefinished/prepainted sheet metal products for interior/exterior building applications - Performance requirements",
    "sections_referenced": ["2.8", "2.10.2", "Appendix H"],
    "pdf_pages": [488, 489],
    "url": "https://www.standards.govt.nz"
  },
  {
    "code": "E2/AS1",
    "title": "Acceptable Solution for External Moisture",
    "sections_referenced": ["Table 1", "9.1.7", "8.5"],
    "pdf_pages": [201, 315, 320],
    "url": "https://www.building.govt.nz"
  },
  {
    "code": "NZS 3604",
    "title": "Timber-framed buildings",
    "sections_referenced": ["8.5.2"],
    "pdf_pages": [145],
    "url": ""
  }
]
```

## 4. warnings.json - Example

```json
[
  {
    "detail_code": "F07",
    "level": "critical",
    "message": "Ridge vents must not be sealed. Sealing ridge vents will cause condensation and void warranties.",
    "condition": {
      "ventilation": "blocked",
      "roof_type": "any"
    },
    "nzbc_ref": "E3/AS1",
    "pdf_page": 201
  },
  {
    "detail_code": "P02",
    "level": "warning",
    "message": "Arrowhead curbs should not be used on pitches less than 8 degrees. Use cricket curbs instead.",
    "condition": {
      "pitch": "< 8 degrees"
    },
    "nzbc_ref": "E2/AS1 9.1.7",
    "pdf_page": 315
  },
  {
    "detail_code": "",
    "level": "caution",
    "message": "All cut edges must be sealed with touch-up paint within 24 hours to prevent corrosion.",
    "condition": {},
    "nzbc_ref": "B2",
    "pdf_page": 120
  }
]
```

## 5. sections_hierarchy.json - Example

```json
{
  "1": {
    "number": "1",
    "title": "Introduction",
    "content": "The NZ Metal Roof and Wall Cladding Code of Practice...",
    "pdf_pages": [9, 10, 11, 12, 13, 14, 15],
    "subsections": {
      "1.1": {
        "number": "1.1",
        "title": "Disclaimer and Copyright",
        "content": "Although the information contained in this Code...",
        "pdf_pages": [9, 10]
      },
      "1.2": {
        "number": "1.2",
        "title": "Scope",
        "content": "This Code of Practice provides requirements...",
        "pdf_pages": [10]
      }
    }
  },
  "8": {
    "number": "8",
    "title": "External Moisture Flashings",
    "content": "This section should be read in conjunction with...",
    "pdf_pages": [180, 181, 182],
    "subsections": {
      "8.5": {
        "number": "8.5",
        "title": "Flashing Types",
        "content": "Various types of flashings are used...",
        "pdf_pages": [195, 196],
        "subsections": {
          "8.5.1": {
            "number": "8.5.1",
            "title": "Ridge and Hip Intersections",
            "content": "Ridge flashings provide...",
            "pdf_pages": [201, 202, 203]
          },
          "8.5.2": {
            "number": "8.5.2",
            "title": "Barge and Verge",
            "content": "Barge flashings seal the junction...",
            "pdf_pages": [204, 205]
          }
        }
      }
    }
  }
}
```

## 6. tables.json - Example

```json
[
  {
    "title": "Fastening Pattern Table - Corrugated Profile",
    "headers": ["Wind Zone", "Span (mm)", "Fasteners/Sheet", "Pattern"],
    "rows": [
      ["L", "900", "9", "Every rib at supports"],
      ["M", "900", "12", "Every rib at supports + mid-span"],
      ["H", "900", "15", "Every rib all supports"],
      ["VH", "750", "18", "Every rib + intermediate"]
    ],
    "section": "3.10",
    "pdf_page": 88,
    "detail_code": ""
  },
  {
    "title": "Ridge Vent Clear Opening Areas",
    "headers": ["Profile Type", "Clear Opening (mm²/m)", "Equivalent Net Area"],
    "rows": [
      ["Corrugated", "10,000", "10,000"],
      ["Trapezoidal 5-rib", "12,000", "12,000"],
      ["Low profile", "8,000", "8,000"]
    ],
    "section": "10.10.1.3",
    "pdf_page": 352,
    "detail_code": "V01"
  }
]
```

## 7. metadata.json - Example

```json
{
  "source_file": "RoofingCOP_v25-12_2025-12-01.pdf",
  "version": "v25.12",
  "extraction_date": "2026-01-26T10:30:00Z",
  "total_pages": 502,
  "details_count": 156,
  "images_count": 248,
  "standards_count": 42,
  "warnings_count": 89,
  "tables_count": 35,
  "extractor": "Codex",
  "notes": "Full extraction of MRM Code of Practice for Master Roofers COP database import"
}
```

## File Naming Conventions for Images

```
{section-name}-{description}-{number}.png

Examples:
ridge-flashing-installation-01.png
ridge-flashing-section-view-02.png
arrowhead-curb-isometric-01.png
penetration-cricket-detail-03.png
valley-gutter-capacity-chart-01.png
fastening-pattern-table-corrugate-01.png
wind-zone-map-new-zealand.png
```

## Directory Structure Output

```
/extracted/
├── details.json              (156 details)
├── standards.json            (42 standards)
├── warnings.json             (89 warnings)
├── images_manifest.json      (248 images documented)
├── sections_hierarchy.json   (full document structure)
├── tables.json               (35 tables)
├── metadata.json             (extraction info)
└── images/                   (248 extracted diagrams)
    ├── ridge-flashing-installation-01.png
    ├── ridge-flashing-section-view-02.png
    ├── barge-flashing-detail-01.png
    ├── arrowhead-curb-isometric-01.png
    ├── cricket-curb-plan-view-01.png
    └── ... (243 more images)
```

## Key Extraction Rules

1. **Detail Codes**: Assign sequentially within category (F01, F02, F03...)
2. **Images**: Extract ALL technical diagrams - these are critical
3. **Specifications**: Convert prose to key-value pairs where possible
4. **Steps**: Number sequentially, include any cautionary notes
5. **Standards**: Capture code, title, and specific clauses referenced
6. **Warnings**: Extract any "must not", "warning", "caution" statements
7. **Ventilation**: EVERY detail needs ventilation checks (even if "N/A")

## Priority Sections (Extract First)

1. **Section 8.5** - Flashing Types → Details F01-F20
2. **Section 9** - Penetrations → Details P01-P15
3. **Section 10** - Ventilation → Details V01-V10, requirements for all
4. **Section 5** - Drainage → Details D01-D10
5. **Section 17** - Standards → standards.json

These examples show exactly the format, structure, and level of detail expected in each output file.
