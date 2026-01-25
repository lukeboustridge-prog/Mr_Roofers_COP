# MRM COP Content Migration & Update Strategy

**Master Roofers Code of Practice - Content Pipeline**

Version 1.0 | January 2026

---

## Executive Summary

This document outlines the strategy for converting the 500+ page MRM Code of Practice PDF into the Master Roofers COP database-driven system, with a sustainable approach for ongoing updates.

**Strategic Context:**
- RANZ intends to absorb MRM, making this resource foundational
- Current MRM COP covers only metal roofing (one of six substrates)
- Quarterly update cycle must be maintained during transition
- Eventually will diverge as Master Roofers expands beyond metal

---

## Phase 1: Initial Content Extraction

### 1.1 PDF Processing Strategy

**Challenge:** 500+ page PDF too large for direct AI processing

**Solution: Chunked Processing Pipeline**

```
MRM_COP_v25.12.pdf (500+ pages)
    ↓
Split into manageable chunks (50-100 pages each)
    ↓
Process each chunk through extraction pipeline
    ↓
Structured data output (JSON)
    ↓
Database import
```

### 1.2 Extraction Tools & Approach

**Tool Stack:**
1. **PyMuPDF (fitz)** - PDF text extraction with layout preservation
2. **pdfplumber** - Table extraction
3. **Claude API** - Content structuring and semantic parsing
4. **Custom Python scripts** - Orchestration and transformation

**Extraction Script Architecture:**

```python
# /scripts/extract-mrm-cop.py

import fitz  # PyMuPDF
import pdfplumber
import json
from anthropic import Anthropic
from pathlib import Path

class MRMExtractor:
    """Extract and structure content from MRM COP PDF"""
    
    def __init__(self, pdf_path, output_dir):
        self.pdf_path = pdf_path
        self.output_dir = Path(output_dir)
        self.client = Anthropic()
        
    def split_pdf(self, chunk_size=50):
        """Split PDF into manageable chunks"""
        doc = fitz.open(self.pdf_path)
        total_pages = len(doc)
        
        chunks = []
        for i in range(0, total_pages, chunk_size):
            end_page = min(i + chunk_size, total_pages)
            chunk_doc = fitz.open()
            chunk_doc.insert_pdf(doc, from_page=i, to_page=end_page-1)
            
            chunk_path = self.output_dir / f"chunk_{i:04d}_{end_page:04d}.pdf"
            chunk_doc.save(chunk_path)
            chunks.append(chunk_path)
            
        return chunks
    
    def extract_chunk(self, chunk_path):
        """Extract structured content from a PDF chunk"""
        
        # Extract raw text with layout
        text_content = self._extract_text_with_layout(chunk_path)
        
        # Extract tables separately
        tables = self._extract_tables(chunk_path)
        
        # Extract images and diagrams
        images = self._extract_images(chunk_path)
        
        # Use Claude to structure the content
        structured_content = self._structure_with_claude(
            text_content, tables, images
        )
        
        return structured_content
    
    def _structure_with_claude(self, text, tables, images):
        """Use Claude API to parse and structure content"""
        
        prompt = f"""
        Parse this section of the MRM Code of Practice and extract structured data.
        
        Identify:
        1. Section hierarchy (chapters, sections, subsections)
        2. Roofing details (code, name, specifications)
        3. Standards references (NZS, AS/NZS codes)
        4. Warnings and cautionary notes
        5. Technical specifications and requirements
        6. Cross-references to other sections
        
        Text content:
        {text}
        
        Tables:
        {json.dumps(tables, indent=2)}
        
        Return structured JSON matching this schema:
        {{
            "sections": [
                {{
                    "code": "8.5.4",
                    "title": "Apron Flashings",
                    "content": "...",
                    "subsections": [...]
                }}
            ],
            "details": [
                {{
                    "code": "F07",
                    "name": "Ridge Flashing",
                    "category": "flashings",
                    "specifications": {{}},
                    "standards_refs": [],
                    "ventilation_checks": []
                }}
            ],
            "warnings": [...],
            "standards": [...],
            "tables": [...],
            "diagrams": [...]
        }}
        """
        
        response = self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=8000,
            messages=[{"role": "user", "content": prompt}]
        )
        
        return json.loads(response.content[0].text)
```

### 1.3 Content Mapping Strategy

**MRM COP Structure → Master Roofers Database**

| MRM COP Section | Maps To | Database Table |
|----------------|---------|----------------|
| 1. Introduction | Site documentation | `content_pages` |
| 2. Glossary | Searchable terms | `glossary_terms` |
| 3. Structure | Specifications | `specifications` |
| 4. Durability | Material specs + warnings | `details.specifications` + `warnings` |
| 5. Roof Drainage | Category: Drainage | `categories` + `details` |
| 6-9. External Moisture | Categories: Flashings, Penetrations | `details` with `category_id` |
| 8.5 Flashing Types | Individual Details | `details` (F01-F16) |
| 10. Internal Moisture | Ventilation requirements | `details.ventilation_checks` |
| 17. Testing Standards | Standards references | `standards` |
| 19. Revision History | Version control | `content_versions` |

### 1.4 Detail Code Assignment

**Create Consistent Coding System:**

```
[Category Prefix][Sequential Number]

Examples:
F01-F30: Flashings
P01-P20: Penetrations  
D01-D15: Drainage
V01-V10: Ventilation
J01-J15: Junctions
```

**MRM Content → Detail Records:**

| MRM Section | Detail Code | Name |
|------------|------------|------|
| 8.5.1 | F01 | Ridge Capping |
| 8.5.2 | F02 | Barge Flashing |
| 8.5.3 | F03 | Parapet Capping |
| 8.5.4 | F04 | Apron Flashing |
| 9.4.2.1 | P01 | Level Back Curb |
| 9.4.2.2 | P02 | Arrowhead Curb |

---

## Phase 2: Content Management System (CMS)

### 2.1 Admin Interface Requirements

**Purpose:** Enable non-technical staff to manage content updates without developer intervention

**Core Features:**

1. **Content Editor**
   - Rich text editing for descriptions
   - Structured form fields for specifications
   - Image/diagram upload with automatic R2 storage
   - 3D model upload and preview
   - Standards reference picker
   - Ventilation checklist builder

2. **Version Control**
   - Track all changes with timestamps and authors
   - Compare versions side-by-side
   - Rollback capability
   - Publish/unpublish controls

3. **Bulk Operations**
   - Import CSV of details
   - Batch update specifications
   - Mass tag assignment
   - Category reorganization

4. **Preview Mode**
   - See changes before publishing
   - Mobile/desktop preview
   - Warning simulation

### 2.2 CMS Architecture

**Route Structure:**
```
/admin/
  ├── dashboard/          # Overview stats
  ├── substrates/         # Manage substrates
  ├── categories/         # Manage categories
  ├── details/            # Main content management
  │   ├── list/           # Browse all details
  │   ├── [id]/edit/      # Edit detail
  │   └── new/            # Create new detail
  ├── failures/           # Failure cases management
  ├── standards/          # Standards library
  ├── warnings/           # Warning rules
  └── import/             # Bulk import tools
```

**Key Admin Components:**

```typescript
// components/admin/DetailEditor.tsx
interface DetailEditorProps {
  detailId?: string;
  mode: 'create' | 'edit';
}

export function DetailEditor({ detailId, mode }: DetailEditorProps) {
  return (
    <Form>
      <Section title="Basic Information">
        <Input name="code" label="Detail Code" required />
        <Input name="name" label="Name" required />
        <Textarea name="description" label="Description" />
      </Section>
      
      <Section title="Classification">
        <Select name="substrate_id" label="Substrate" />
        <Select name="category_id" label="Category" />
        <MultiSelect name="subcategories" label="Subcategories" />
      </Section>
      
      <Section title="Requirements">
        <Input name="min_pitch" label="Min Pitch (°)" type="number" />
        <Input name="max_pitch" label="Max Pitch (°)" type="number" />
        <Select name="wind_zone_min" label="Min Wind Zone" />
      </Section>
      
      <Section title="Installation Steps">
        <StepBuilder 
          steps={steps}
          onChange={setSteps}
        />
      </Section>
      
      <Section title="Specifications">
        <KeyValueEditor
          data={specifications}
          onChange={setSpecifications}
        />
      </Section>
      
      <Section title="Standards References">
        <StandardsSelector
          selected={standardsRefs}
          onChange={setStandardsRefs}
        />
      </Section>
      
      <Section title="Ventilation Requirements">
        <VentilationChecklistBuilder
          checks={ventilationChecks}
          onChange={setVentilationChecks}
        />
      </Section>
      
      <Section title="3D Model">
        <ModelUploader
          currentUrl={modelUrl}
          onUpload={handleModelUpload}
        />
      </Section>
      
      <Section title="Warnings">
        <WarningBuilder
          detailId={detailId}
          warnings={warnings}
          onChange={setWarnings}
        />
      </Section>
    </Form>
  );
}
```

---

## Phase 3: Update Management

### 3.1 Tracking MRM Updates

**Challenge:** MRM releases quarterly updates (March, June, September, December)

**Solution: Version Diffing System**

**Database Schema Addition:**

```sql
CREATE TABLE content_versions (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL, -- 'MRM', 'MASTER_ROOFERS'
  version TEXT NOT NULL, -- 'v25.12'
  release_date DATE NOT NULL,
  pdf_url TEXT,
  changes_summary TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE content_changes (
  id TEXT PRIMARY KEY,
  version_id TEXT REFERENCES content_versions(id),
  change_type TEXT NOT NULL, -- 'added', 'modified', 'deprecated'
  entity_type TEXT NOT NULL, -- 'detail', 'standard', 'warning'
  entity_id TEXT,
  old_value JSONB,
  new_value JSONB,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_changes_version ON content_changes(version_id);
```

### 3.2 Update Process Workflow

```
MRM releases new version (e.g., v26.03)
    ↓
1. Download new PDF
    ↓
2. Run extraction pipeline on new version
    ↓
3. Generate diff against current Master Roofers content
    ↓
4. Review changes in admin dashboard
    ↓
5. Approve/reject each change
    ↓
6. Bulk import approved changes
    ↓
7. Publish updated content
    ↓
8. Archive old version
```

### 3.3 Diff Detection Script

```python
# /scripts/detect-changes.py

class ContentDiffer:
    """Compare two versions of COP content"""
    
    def __init__(self, old_version, new_version):
        self.old = old_version
        self.new = new_version
        
    def generate_diff(self):
        """Create detailed change report"""
        
        changes = {
            'added': self._find_added(),
            'modified': self._find_modified(),
            'deprecated': self._find_deprecated(),
            'summary': None
        }
        
        changes['summary'] = self._generate_summary(changes)
        return changes
    
    def _find_added(self):
        """Find new details/sections"""
        old_codes = {d['code'] for d in self.old['details']}
        new_codes = {d['code'] for d in self.new['details']}
        
        added_codes = new_codes - old_codes
        return [
            d for d in self.new['details'] 
            if d['code'] in added_codes
        ]
    
    def _find_modified(self):
        """Find changed details"""
        old_dict = {d['code']: d for d in self.old['details']}
        new_dict = {d['code']: d for d in self.new['details']}
        
        modified = []
        for code in old_dict.keys() & new_dict.keys():
            if old_dict[code] != new_dict[code]:
                modified.append({
                    'code': code,
                    'old': old_dict[code],
                    'new': new_dict[code],
                    'diff': self._detail_diff(old_dict[code], new_dict[code])
                })
        
        return modified
    
    def _detail_diff(self, old, new):
        """Generate field-level diff"""
        diff = {}
        all_keys = set(old.keys()) | set(new.keys())
        
        for key in all_keys:
            if old.get(key) != new.get(key):
                diff[key] = {
                    'old': old.get(key),
                    'new': new.get(key)
                }
        
        return diff
```

### 3.4 Change Review Dashboard

**Admin Route: `/admin/updates/review`**

**Features:**
- Side-by-side comparison of changes
- Accept/reject individual changes
- Batch approval workflow
- Conflict resolution for diverged content
- Preview impact on related details

---

## Phase 4: Content Enhancement Strategy

### 4.1 Metal Content Transformation

**Source:** MRM COP (metal roofing only)

**Enhancement Process:**

1. **Extract Base Content**
   - Use extraction scripts on current MRM COP
   - Import as "Profiled Metal" substrate

2. **Add Master Roofers Context**
   - Tag with RANZ-specific guidance
   - Cross-reference to RANZ training materials
   - Link to Roofguide.co.nz 3D instructions

3. **Integrate Failure Cases**
   - Map LBP Board decisions to relevant details
   - Add MBIE Determinations as warnings
   - Create preventative checklists

4. **Enhance with Mandatory Ventilation**
   - Add ventilation requirements to ALL details
   - Create ventilation knowledge graph
   - Build ventilation calculator tools

### 4.2 Expanding to Other Substrates

**Substrate Addition Workflow:**

```
1. MEMBRANE ROOFING
   ├── Source: WMAI Code of Practice
   ├── Extract sections relevant to membrane systems
   ├── Create new details (M01-M30)
   ├── Map to ventilation requirements
   └── Link related failure cases

2. CONCRETE TILE
   ├── Source: Monier Technical Manual + AS 2050
   ├── Structure similar to metal
   ├── Create details (CT01-CT30)
   └── Add tile-specific warnings

3. CLAY TILE
   ├── Source: Clay Roof Tile Institute materials
   ├── Create details (CLT01-CLT30)
   └── Include heritage considerations

4. PRESSED METAL TILE
   ├── Source: Manufacturer specs + RANZ guidance
   ├── Create details (PMT01-PMT20)
   └── Overlap with metal roofing details

5. ASPHALT SHINGLE
   ├── Source: Tamko/IKO installation guides + US standards
   ├── Adapt for NZ conditions
   ├── Create details (AS01-AS20)
   └── Less common in NZ - lighter treatment

6. EXTERIOR CLEANING
   ├── Source: ECIA guidelines + RANZ best practice
   ├── Create maintenance protocols (EC01-EC15)
   └── Safety and environmental considerations
```

---

## Phase 5: Implementation Roadmap

### 5.1 Immediate Actions (Weeks 1-2)

**Priority: Extract MRM Metal Content**

- [ ] Split MRM COP PDF into chunks
- [ ] Run extraction pipeline
- [ ] Review and validate extracted data
- [ ] Create seed data SQL scripts
- [ ] Import into Neon database
- [ ] Verify data integrity

**Deliverables:**
- `seeds/metal-roofing-details.sql` - All profiled metal details
- `seeds/flashings.sql` - Complete flashings library
- `seeds/standards.sql` - Referenced standards
- Validation report

### 5.2 Short Term (Weeks 3-6)

**Priority: CMS Development**

- [ ] Build admin authentication (Clerk roles)
- [ ] Create detail editor interface
- [ ] Implement bulk import tools
- [ ] Add version control system
- [ ] Build change review dashboard

**Deliverables:**
- Working admin panel at `/admin`
- Ability to edit any detail
- CSV import functionality
- Basic version control

### 5.3 Medium Term (Weeks 7-12)

**Priority: Update Management System**

- [ ] Implement diff detection
- [ ] Create update workflow
- [ ] Build MRM version tracker
- [ ] Set up automated monitoring for MRM releases
- [ ] Test full update cycle with mock v26.03

**Deliverables:**
- Automated diff generation
- Change review workflow
- Update history tracking

### 5.4 Long Term (Months 4-12)

**Priority: Substrate Expansion**

- [ ] Add membrane roofing content
- [ ] Add concrete tile content
- [ ] Add clay tile content
- [ ] Add remaining substrates
- [ ] Create cross-substrate comparison tools
- [ ] Build comprehensive search across all substrates

**Deliverables:**
- All 6 substrates populated
- Cross-reference system working
- Unified search across all content

---

## Phase 6: Governance & Maintenance

### 6.1 Content Ownership Model

**During Transition (Years 1-2):**
- Metal content syncs with MRM quarterly releases
- Manual review and approval of changes
- Master Roofers adds enhancements (failures, ventilation)

**Post-Absorption (Year 3+):**
- Master Roofers becomes sole content authority
- MRM COP legacy version archived as reference
- Full editorial control over all content
- Establish own update schedule

### 6.2 Content Roles

**Content Manager** (RANZ Staff)
- Approve content changes
- Coordinate with technical committee
- Manage update schedule
- Quality control

**Technical Editors** (Subject Matter Experts)
- Review detail accuracy
- Validate specifications
- Update standards references
- Add cautionary notes

**Administrators** (IT Staff)
- Run extraction scripts
- Monitor system health
- Manage backups
- Handle technical issues

### 6.3 Quality Assurance Process

**New Content Checklist:**
- [ ] Detail code assigned correctly
- [ ] All required fields populated
- [ ] Standards references verified
- [ ] Ventilation requirements included
- [ ] 3D model uploaded and renders correctly
- [ ] Mobile preview tested
- [ ] Cross-references validated
- [ ] Peer review completed
- [ ] Technical committee approval

---

## Technical Specifications

### Database Performance

**Indexes for Fast Queries:**
```sql
-- Full-text search
CREATE INDEX idx_details_fts ON details 
USING GIN(to_tsvector('english', name || ' ' || description));

-- Substrate filtering
CREATE INDEX idx_details_substrate_category 
ON details(substrate_id, category_id);

-- Code lookup (direct jump)
CREATE INDEX idx_details_code_upper 
ON details(UPPER(code));

-- Recent updates
CREATE INDEX idx_details_updated 
ON details(updated_at DESC) WHERE is_published = true;
```

### Storage Estimates

**Content Volume:**
- Metal substrate: ~150 details
- Each additional substrate: ~100-150 details
- Total target: ~900 details across 6 substrates

**Storage Requirements:**
- Text content: ~50 MB
- Images/diagrams: ~500 MB
- 3D models: ~2 GB
- PDFs (failure cases): ~1 GB
- **Total: ~3.5 GB** (Cloudflare R2)

### API Rate Limits

**Claude API Usage (Extraction):**
- ~500 pages to process
- Split into 10 chunks of 50 pages
- ~8K tokens per chunk
- Total: ~80K tokens
- Cost: ~$0.24 (Sonnet 4)
- Time: ~30 minutes total

---

## Risk Mitigation

### Risk 1: MRM Content Copyright

**Risk:** MRM may object to content extraction

**Mitigation:**
- RANZ absorption strategy provides legal pathway
- Content transformation adds substantial value
- Attribution to MRM maintained during transition
- Legal review before public launch

### Risk 2: Extraction Accuracy

**Risk:** Automated extraction may miss nuances

**Mitigation:**
- Manual review of ALL extracted content
- Subject matter expert validation
- Staged rollout with pilot testing
- Keep original PDF as reference

### Risk 3: Update Conflicts

**Risk:** Master Roofers changes conflict with MRM updates

**Mitigation:**
- Track source of every content change
- Flag Master Roofers enhancements separately
- Merge strategy for conflicts
- Version control enables rollback

### Risk 4: Scope Creep

**Risk:** Perfect extraction delays launch

**Mitigation:**
- Phase 1: Metal only (MRM base)
- Phase 2: Enhancement layer
- Phase 3: Additional substrates
- Accept 80% accuracy initially, iterate

---

## Success Metrics

### Content Coverage
- ✅ 150+ metal roofing details extracted
- ✅ All MRM standards references captured
- ✅ 100+ warnings/failure cases linked
- ✅ Ventilation requirements on every detail

### Update Efficiency
- ⏱️ New MRM version processed in < 2 days
- ⏱️ Content updates published within 1 week
- ⏱️ Zero content loss during updates
- ⏱️ 95% automated change detection

### User Experience
- 🎯 Search results in < 500ms
- 🎯 Mobile detail view loads in < 2s
- 🎯 Offline access to all downloaded content
- 🎯 3D models render smoothly

---

## Next Steps

### Immediate (This Week)
1. Create `/scripts` directory in project
2. Write PDF extraction script (`extract-mrm-cop.py`)
3. Test extraction on first 50 pages
4. Review output quality
5. Refine extraction prompts

### Week 2
1. Process all MRM COP chunks
2. Generate consolidated JSON output
3. Create database seed scripts
4. Import to development database
5. Manual QA of 20% sample

### Week 3-4
1. Build basic admin interface
2. Implement detail editor
3. Add CSV import feature
4. Test content editing workflow

---

## Conclusion

This strategy provides a clear pathway from the static MRM COP PDF to a dynamic, database-driven Master Roofers COP system. The phased approach allows for:

1. **Quick Start:** Extract metal content immediately
2. **Sustainable Updates:** Manage MRM quarterly releases
3. **Gradual Expansion:** Add substrates systematically  
4. **Quality Control:** Manual review at every stage
5. **Future Independence:** Build towards full ownership

The combination of automated extraction and CMS-powered management creates a system that is both efficient to populate initially and sustainable to maintain long-term.

**Recommended Starting Point:** Phase 1 extraction scripts, targeting metal roofing content only for initial database population.
