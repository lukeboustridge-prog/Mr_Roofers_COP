# MRM COP Content Extraction

Quick start guide for extracting the MRM Code of Practice content into the Master Roofers COP database.

## Setup

1. **Install Python dependencies:**

```bash
pip install -r requirements.txt
```

2. **Set up your environment variables:**

Create a `.env` file with your Anthropic API key:

```bash
ANTHROPIC_API_KEY=sk-ant-...
```

## Usage

### Basic Extraction (with Claude API)

```bash
python extract_mrm_cop.py \
  --input /path/to/RoofingCOP_v25-12.pdf \
  --output ./extracted
```

This will:
1. Split the PDF into 50-page chunks
2. Extract text, tables, and structure from each chunk
3. Use Claude API to intelligently parse and structure the content
4. Generate JSON files and SQL seed scripts

### Rule-Based Extraction (no API key needed)

```bash
python extract_mrm_cop.py \
  --input /path/to/RoofingCOP_v25-12.pdf \
  --output ./extracted \
  --no-claude
```

Less accurate but doesn't require API access.

## Outputs

The script creates the following files in the output directory:

```
extracted/
├── chunks/                    # PDF chunks (50 pages each)
│   ├── chunk_0000_0050.pdf
│   ├── chunk_0050_0100.pdf
│   └── ...
├── details.json               # Extracted roofing details
├── standards.json             # Standards references
├── warnings.json              # Warnings and cautions
└── seed_data.sql             # SQL for database import
```

## Workflow

### Phase 1: Initial Extraction

```bash
# Extract MRM COP content
python extract_mrm_cop.py --input RoofingCOP_v25-12.pdf --output ./extracted

# Review extracted data
cat extracted/details.json | jq '.[] | {code, name, category}'

# Count details by category
cat extracted/details.json | jq '[.[].category] | group_by(.) | map({category: .[0], count: length})'
```

### Phase 2: Manual Review & Cleanup

The extraction won't be perfect. You'll need to:

1. **Review detail codes** - Assign consistent codes (F01, F02, P01, etc.)
2. **Check categories** - Ensure flashings, penetrations, etc. are correctly categorized
3. **Validate specifications** - Review min_pitch, wind zones, etc.
4. **Add missing ventilation** - Every detail needs ventilation requirements
5. **Link failure cases** - Connect to relevant LBP/MBIE cases

### Phase 3: Database Import

```bash
# Import into your Neon database
psql $DATABASE_URL -f extracted/seed_data.sql

# Or using a migration
cp extracted/seed_data.sql lib/db/migrations/001_seed_metal_content.sql
npm run db:migrate
```

## Tips

### Processing Time

- 500-page PDF split into 10 chunks
- ~3 minutes per chunk with Claude API
- Total: ~30-40 minutes
- Cost: ~$0.25 (Claude Sonnet 4)

### Improving Accuracy

If the automatic extraction misses details:

1. **Review the chunks** - Look at `chunks/` to see what sections were grouped together
2. **Adjust chunk size** - Smaller chunks (25 pages) may improve accuracy
3. **Target specific sections** - Extract flashings separately from penetrations

Example for flashings only:

```bash
# Extract pages 200-250 (flashings section) only
python extract_mrm_cop.py \
  --input RoofingCOP_v25-12.pdf \
  --output ./flashings \
  --start-page 200 \
  --end-page 250
```

### Common Issues

**Issue:** `ANTHROPIC_API_KEY not found`  
**Fix:** Create `.env` file with your API key

**Issue:** `ModuleNotFoundError: No module named 'fitz'`  
**Fix:** Install PyMuPDF: `pip install PyMuPDF`

**Issue:** Extraction produces empty results  
**Fix:** Try rule-based mode first: `--no-claude`

## Next Steps

After extraction:

1. **Load into dev database** - Test the seed data
2. **Build CMS interface** - Create admin tools for editing
3. **Manual enhancement** - Add ventilation, failure cases, 3D models
4. **Substrate expansion** - Start on membrane, tile, etc.

## Project Structure Integration

Copy the extraction outputs into your Next.js project:

```bash
# Copy to project
cp -r extracted/ ../master-roofers-cop/data/seed/

# Add to database migrations
cp extracted/seed_data.sql ../master-roofers-cop/lib/db/migrations/002_seed_metal_content.sql
```

Then import via Drizzle:

```typescript
// lib/db/seed.ts
import { db } from './index';
import seedData from '../../data/seed/details.json';

export async function seedDatabase() {
  for (const detail of seedData) {
    await db.insert(details).values({
      ...detail,
      created_at: new Date(),
      updated_at: new Date()
    });
  }
}
```

## Version Control

Keep track of which MRM version you extracted:

```bash
# Tag the extraction
git add extracted/
git commit -m "feat: Extract MRM COP v25.12 content"
git tag mrm-v25.12

# When new version comes out
python extract_mrm_cop.py \
  --input RoofingCOP_v26-03.pdf \
  --output ./extracted-v26-03

# Generate diff
python compare_versions.py \
  --old extracted/ \
  --new extracted-v26-03/ \
  --output diff-v25.12-to-v26.03.json
```

## Troubleshooting

### Memory Issues

If processing large PDFs causes memory issues:

```bash
# Process smaller chunks
python extract_mrm_cop.py \
  --input RoofingCOP_v25-12.pdf \
  --output ./extracted \
  --chunk-size 25  # Smaller chunks
```

### API Rate Limits

If you hit Claude API rate limits:

```bash
# Add delay between chunks
python extract_mrm_cop.py \
  --input RoofingCOP_v25-12.pdf \
  --output ./extracted \
  --delay 5  # Wait 5 seconds between chunks
```

## Support

Questions? Issues? Check:
- `MRM_Content_Migration_Strategy.md` - Full strategy document
- Project docs: `Master_Roofers_COP_Technical_Build_Spec.docx`
- Issues on GitHub

---

**Remember:** Extraction is just the first step. Manual review and enhancement is critical for quality.
