# Instructions for Codex - MRM COP Extraction

## Quick Start

You have been asked to extract content from the MRM Code of Practice PDF.

## Key Files You Need

1. **INPUT FILE**: `/mnt/project/RoofingCOP_v25-12_2025-12-01.pdf`
   - This is the source PDF to extract from

2. **SCHEMA**: `/mnt/project/extraction_schema.json`
   - Complete JSON schema defining all data structures
   - Shows exactly what fields are required/optional
   - Includes detailed descriptions and examples

3. **EXAMPLES**: `/mnt/project/EXTRACTION_EXAMPLES.md`
   - Real examples of what each output file should look like
   - Shows actual detail records, images, warnings, etc.
   - Includes file naming conventions

## What to Produce

Create these files in `/extracted/` directory:

```
/extracted/
├── details.json              # Roofing details (F01, P01, etc.)
├── standards.json            # Standards references
├── warnings.json             # Warnings and cautions
├── images_manifest.json      # Image metadata
├── sections_hierarchy.json   # Document structure
├── tables.json               # Extracted tables
├── metadata.json             # Extraction info
└── images/                   # All technical diagrams
    └── (248+ PNG files)
```

## Critical Requirements

1. **EXTRACT ALL IMAGES** - Technical diagrams are the most important part
2. **ASSIGN DETAIL CODES** - Use F01-F30 for flashings, P01-P20 for penetrations
3. **FOLLOW SCHEMA** - Match the structure in extraction_schema.json exactly
4. **USE EXAMPLES** - Follow the format shown in EXTRACTION_EXAMPLES.md

## Priority Sections

Extract in this order:
1. Section 8.5 - Flashing Types (Details F01-F20)
2. Section 9 - Penetrations (Details P01-P15)
3. Section 10 - Ventilation requirements
4. Section 5 - Drainage details
5. Section 17 - Standards references

## Key Detail Categories

- **F01-F30**: Flashings (Section 8.5)
- **P01-P20**: Penetrations (Section 9)
- **D01-D15**: Drainage (Section 5)
- **V01-V10**: Ventilation (Section 10)
- **J01-J15**: Junctions (Section 8)

## Image Handling

- Extract ALL technical diagrams
- Save as PNG with descriptive names: `ridge-flashing-detail-01.png`
- Create entry in images_manifest.json for each image
- Link images to their detail codes

## Questions?

- Schema reference: `/mnt/project/extraction_schema.json`
- Output examples: `/mnt/project/EXTRACTION_EXAMPLES.md`
- Source PDF: `/mnt/project/RoofingCOP_v25-12_2025-12-01.pdf`

## Begin Extraction

Please start by:
1. Reading the schema file to understand data structures
2. Reviewing the examples to see expected output format
3. Extracting content from the PDF
4. Generating all output files in /extracted/ directory

Focus on quality over speed. Images and technical accuracy are critical.
