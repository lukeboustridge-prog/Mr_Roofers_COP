#!/usr/bin/env python3
"""
MRM Code of Practice Content Extraction Pipeline

This script extracts structured content from the MRM COP PDF and transforms it
into a format suitable for importing into the Master Roofers COP database.

Usage:
    python extract_mrm_cop.py --input RoofingCOP_v25-12.pdf --output ./extracted

Requirements:
    pip install PyMuPDF pdfplumber anthropic python-dotenv
"""

import fitz  # PyMuPDF
import pdfplumber
import json
import re
from pathlib import Path
from typing import Dict, List, Any
from dataclasses import dataclass, asdict
from anthropic import Anthropic
import os
from dotenv import load_dotenv

load_dotenv()

@dataclass
class Detail:
    """Represents a roofing detail"""
    code: str
    name: str
    description: str = ""
    category: str = ""
    substrate: str = "profiled-metal"
    min_pitch: float = None
    max_pitch: float = None
    specifications: Dict[str, Any] = None
    steps: List[Dict[str, str]] = None
    standards_refs: List[Dict[str, str]] = None
    ventilation_checks: List[Dict[str, Any]] = None
    
    def __post_init__(self):
        if self.specifications is None:
            self.specifications = {}
        if self.steps is None:
            self.steps = []
        if self.standards_refs is None:
            self.standards_refs = []
        if self.ventilation_checks is None:
            self.ventilation_checks = []

@dataclass
class Standard:
    """Represents a standards reference"""
    code: str
    title: str
    clause: str = ""
    url: str = ""

@dataclass
class Warning:
    """Represents a warning or caution"""
    detail_code: str
    level: str  # 'caution', 'warning', 'failure'
    message: str
    condition: Dict[str, Any] = None
    nzbc_ref: str = ""
    
    def __post_init__(self):
        if self.condition is None:
            self.condition = {}

class MRMExtractor:
    """Extract and structure content from MRM COP PDF"""
    
    def __init__(self, pdf_path: str, output_dir: str, use_claude: bool = True):
        self.pdf_path = Path(pdf_path)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.use_claude = use_claude
        
        if use_claude:
            api_key = os.getenv('ANTHROPIC_API_KEY')
            if not api_key:
                raise ValueError("ANTHROPIC_API_KEY not found in environment")
            self.client = Anthropic(api_key=api_key)
        
        self.details: List[Detail] = []
        self.standards: List[Standard] = []
        self.warnings: List[Warning] = []
        
    def run(self):
        """Execute full extraction pipeline"""
        print(f"🔍 Starting extraction of {self.pdf_path}")
        
        # Step 1: Split PDF into manageable chunks
        print("📄 Splitting PDF into chunks...")
        chunks = self.split_pdf(chunk_size=50)
        print(f"   Created {len(chunks)} chunks")
        
        # Step 2: Process each chunk
        print("⚙️  Processing chunks...")
        for i, chunk_path in enumerate(chunks):
            print(f"   Processing chunk {i+1}/{len(chunks)}: {chunk_path.name}")
            chunk_data = self.extract_chunk(chunk_path)
            self.merge_chunk_data(chunk_data)
        
        # Step 3: Post-process and validate
        print("✅ Validating extracted data...")
        self.validate_data()
        
        # Step 4: Save outputs
        print("💾 Saving extracted data...")
        self.save_outputs()
        
        print(f"✨ Extraction complete!")
        print(f"   Details: {len(self.details)}")
        print(f"   Standards: {len(self.standards)}")
        print(f"   Warnings: {len(self.warnings)}")
        print(f"   Output directory: {self.output_dir}")
        
    def split_pdf(self, chunk_size: int = 50) -> List[Path]:
        """Split PDF into manageable chunks"""
        doc = fitz.open(self.pdf_path)
        total_pages = len(doc)
        
        chunks_dir = self.output_dir / "chunks"
        chunks_dir.mkdir(exist_ok=True)
        
        chunks = []
        for i in range(0, total_pages, chunk_size):
            end_page = min(i + chunk_size, total_pages)
            chunk_doc = fitz.open()
            chunk_doc.insert_pdf(doc, from_page=i, to_page=end_page-1)
            
            chunk_path = chunks_dir / f"chunk_{i:04d}_{end_page:04d}.pdf"
            chunk_doc.save(chunk_path)
            chunk_doc.close()
            chunks.append(chunk_path)
        
        doc.close()
        return chunks
    
    def extract_chunk(self, chunk_path: Path) -> Dict[str, Any]:
        """Extract structured content from a PDF chunk"""
        
        # Extract text with layout preservation
        text_content = self._extract_text_with_layout(chunk_path)
        
        # Extract tables
        tables = self._extract_tables(chunk_path)
        
        # Detect section structure
        sections = self._detect_sections(text_content)
        
        # Use Claude to structure if enabled
        if self.use_claude:
            structured = self._structure_with_claude(text_content, tables, sections)
        else:
            structured = self._structure_with_rules(text_content, tables, sections)
        
        return structured
    
    def _extract_text_with_layout(self, pdf_path: Path) -> str:
        """Extract text preserving layout structure"""
        doc = fitz.open(pdf_path)
        text_blocks = []
        
        for page_num in range(len(doc)):
            page = doc[page_num]
            
            # Get text with structure
            blocks = page.get_text("dict")["blocks"]
            
            for block in blocks:
                if block.get("type") == 0:  # Text block
                    for line in block.get("lines", []):
                        line_text = ""
                        for span in line.get("spans", []):
                            line_text += span.get("text", "")
                        if line_text.strip():
                            text_blocks.append(line_text.strip())
        
        doc.close()
        return "\n".join(text_blocks)
    
    def _extract_tables(self, pdf_path: Path) -> List[Dict]:
        """Extract tables from PDF"""
        tables = []
        
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                page_tables = page.extract_tables()
                for table in page_tables:
                    if table and len(table) > 1:  # Has header + data
                        tables.append({
                            'headers': table[0],
                            'rows': table[1:],
                            'page': page.page_number
                        })
        
        return tables
    
    def _detect_sections(self, text: str) -> List[Dict[str, str]]:
        """Detect section hierarchy from text"""
        sections = []
        
        # Pattern for section numbers like "8.5.4" or "8-5-4"
        section_pattern = r'^(\d+[\.-]\d+[\.-]\d+)\s+(.+)$'
        
        lines = text.split('\n')
        current_section = None
        current_content = []
        
        for line in lines:
            match = re.match(section_pattern, line)
            if match:
                # Save previous section
                if current_section:
                    sections.append({
                        'code': current_section['code'],
                        'title': current_section['title'],
                        'content': '\n'.join(current_content)
                    })
                
                # Start new section
                current_section = {
                    'code': match.group(1).replace('-', '.'),
                    'title': match.group(2).strip()
                }
                current_content = []
            elif current_section:
                current_content.append(line)
        
        # Save last section
        if current_section:
            sections.append({
                'code': current_section['code'],
                'title': current_section['title'],
                'content': '\n'.join(current_content)
            })
        
        return sections
    
    def _structure_with_claude(self, text: str, tables: List[Dict], 
                                sections: List[Dict]) -> Dict[str, Any]:
        """Use Claude API to parse and structure content"""
        
        # Truncate text if too long
        max_chars = 15000
        if len(text) > max_chars:
            text = text[:max_chars] + "\n... [truncated]"
        
        prompt = f"""Parse this section of the MRM Metal Roof and Wall Cladding Code of Practice.

Extract structured data for:

1. **Roofing Details** - Specific installation details (e.g., flashings, penetrations)
   - Assign codes like F01, F02 for flashings, P01, P02 for penetrations
   - Extract specifications, requirements, and installation steps
   
2. **Standards References** - Citations to NZS, AS/NZS standards
   - Include clause numbers where mentioned
   
3. **Warnings** - Safety cautions, limitations, or failure conditions
   - Classify as 'caution', 'warning', or 'critical'

4. **Technical Specifications** - Minimum pitch, wind zones, clearances, etc.

Sections detected:
{json.dumps(sections, indent=2)}

Content:
{text}

Tables found: {len(tables)}

Return JSON matching this schema:
{{
  "details": [
    {{
      "code": "F07",
      "name": "Ridge Flashing",
      "category": "flashings",
      "description": "...",
      "min_pitch": 3.0,
      "specifications": {{"material": "0.55mm steel", "coverage": "150mm each side"}},
      "steps": [{{"step": 1, "instruction": "...", "note": "..."}}],
      "standards_refs": [{{"code": "AS/NZS 2728", "clause": "2.8"}}],
      "ventilation_checks": [{{"check": "Ensure ridge vent installed", "required": true}}]
    }}
  ],
  "standards": [
    {{
      "code": "AS/NZS 2728",
      "title": "Prefinished/prepainted sheet metal products",
      "clause": "Section 2.8"
    }}
  ],
  "warnings": [
    {{
      "detail_code": "F07",
      "level": "warning",
      "message": "Do not seal ridge vent - ventilation required",
      "nzbc_ref": "E2/AS1"
    }}
  ]
}}

Return ONLY valid JSON, no explanation text."""

        try:
            response = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=8000,
                messages=[{"role": "user", "content": prompt}]
            )
            
            # Extract JSON from response
            content = response.content[0].text
            
            # Try to find JSON in response
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
            else:
                return json.loads(content)
                
        except Exception as e:
            print(f"⚠️  Claude API error: {e}")
            return {"details": [], "standards": [], "warnings": []}
    
    def _structure_with_rules(self, text: str, tables: List[Dict],
                               sections: List[Dict]) -> Dict[str, Any]:
        """Fallback: structure using pattern matching rules"""
        
        # Simple rule-based extraction
        details = []
        standards = []
        warnings = []
        
        # Extract standards references
        standard_pattern = r'(AS/NZS|NZS|AS)\s+(\d+[:\-]?\d*)'
        for match in re.finditer(standard_pattern, text):
            standards.append({
                "code": match.group(0),
                "title": "",
                "clause": ""
            })
        
        # Extract warnings (look for keywords)
        warning_keywords = ['warning', 'caution', 'must not', 'do not', 'failure']
        for line in text.split('\n'):
            line_lower = line.lower()
            if any(kw in line_lower for kw in warning_keywords):
                warnings.append({
                    "detail_code": "",
                    "level": "caution",
                    "message": line.strip(),
                    "nzbc_ref": ""
                })
        
        return {
            "details": details,
            "standards": standards,
            "warnings": warnings
        }
    
    def merge_chunk_data(self, chunk_data: Dict[str, Any]):
        """Merge data from a chunk into main collections"""
        
        # Add details
        for detail_data in chunk_data.get('details', []):
            detail = Detail(**detail_data)
            self.details.append(detail)
        
        # Add standards (deduplicate by code)
        for standard_data in chunk_data.get('standards', []):
            standard = Standard(**standard_data)
            if not any(s.code == standard.code for s in self.standards):
                self.standards.append(standard)
        
        # Add warnings
        for warning_data in chunk_data.get('warnings', []):
            warning = Warning(**warning_data)
            self.warnings.append(warning)
    
    def validate_data(self):
        """Validate and clean extracted data"""
        
        # Remove duplicate details by code
        seen_codes = set()
        unique_details = []
        for detail in self.details:
            if detail.code and detail.code not in seen_codes:
                seen_codes.add(detail.code)
                unique_details.append(detail)
        self.details = unique_details
        
        # Validate detail codes format
        for detail in self.details:
            if detail.code and not re.match(r'^[A-Z]+\d+$', detail.code):
                print(f"⚠️  Invalid detail code format: {detail.code}")
        
        print(f"✓ Validated {len(self.details)} unique details")
    
    def save_outputs(self):
        """Save extracted data to JSON files"""
        
        # Save details
        details_file = self.output_dir / 'details.json'
        with open(details_file, 'w') as f:
            json.dump([asdict(d) for d in self.details], f, indent=2, default=str)
        print(f"   Saved {len(self.details)} details to {details_file}")
        
        # Save standards
        standards_file = self.output_dir / 'standards.json'
        with open(standards_file, 'w') as f:
            json.dump([asdict(s) for s in self.standards], f, indent=2)
        print(f"   Saved {len(self.standards)} standards to {standards_file}")
        
        # Save warnings
        warnings_file = self.output_dir / 'warnings.json'
        with open(warnings_file, 'w') as f:
            json.dump([asdict(w) for w in self.warnings], f, indent=2, default=str)
        print(f"   Saved {len(self.warnings)} warnings to {warnings_file}")
        
        # Generate SQL seed file
        self._generate_sql_seed()
    
    def _generate_sql_seed(self):
        """Generate SQL seed file for database import"""
        
        sql_file = self.output_dir / 'seed_data.sql'
        
        with open(sql_file, 'w') as f:
            f.write("-- Master Roofers COP - Seed Data\n")
            f.write("-- Extracted from MRM Code of Practice\n\n")
            
            # Insert details
            f.write("-- Details\n")
            for detail in self.details:
                f.write(f"""
INSERT INTO details (id, code, name, description, substrate_id, category_id, 
                     min_pitch, max_pitch, specifications, steps, 
                     standards_refs, ventilation_checks, is_published)
VALUES (
    '{detail.code}',
    '{detail.code}',
    {self._sql_string(detail.name)},
    {self._sql_string(detail.description)},
    'profiled-metal',
    {self._sql_string(detail.category)},
    {detail.min_pitch or 'NULL'},
    {detail.max_pitch or 'NULL'},
    '{json.dumps(detail.specifications)}'::jsonb,
    '{json.dumps(detail.steps)}'::jsonb,
    '{json.dumps(detail.standards_refs)}'::jsonb,
    '{json.dumps(detail.ventilation_checks)}'::jsonb,
    true
);
""")
            
            # Insert standards
            f.write("\n-- Standards\n")
            for standard in self.standards:
                f.write(f"""
INSERT INTO standards (code, title, clause)
VALUES (
    {self._sql_string(standard.code)},
    {self._sql_string(standard.title)},
    {self._sql_string(standard.clause)}
)
ON CONFLICT (code) DO NOTHING;
""")
        
        print(f"   Generated SQL seed file: {sql_file}")
    
    def _sql_string(self, value: str) -> str:
        """Format string for SQL insertion"""
        if not value:
            return 'NULL'
        # Escape single quotes
        escaped = value.replace("'", "''")
        return f"'{escaped}'"


def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Extract structured content from MRM COP PDF'
    )
    parser.add_argument(
        '--input',
        required=True,
        help='Path to MRM COP PDF file'
    )
    parser.add_argument(
        '--output',
        default='./extracted',
        help='Output directory for extracted data'
    )
    parser.add_argument(
        '--no-claude',
        action='store_true',
        help='Use rule-based extraction instead of Claude API'
    )
    
    args = parser.parse_args()
    
    # Validate input file
    if not Path(args.input).exists():
        print(f"❌ Error: Input file not found: {args.input}")
        return 1
    
    # Run extraction
    try:
        extractor = MRMExtractor(
            pdf_path=args.input,
            output_dir=args.output,
            use_claude=not args.no_claude
        )
        extractor.run()
        return 0
    except Exception as e:
        print(f"❌ Error during extraction: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == '__main__':
    exit(main())
