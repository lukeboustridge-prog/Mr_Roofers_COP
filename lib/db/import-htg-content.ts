/**
 * Import HTG content from RANZ PDF guides
 * Extracts text from Flashings, Penetrations, and Cladding PDFs into htg_content table
 */

// Load environment variables FIRST (before any other imports)
import { config } from 'dotenv';
config({ path: '.env.local' });

import { db } from './index';
import { htgContent, copSectionHtg } from './schema';
import { extractText } from 'unpdf';
import * as fs from 'fs';
import * as path from 'path';

interface HtgPdfEntry {
  file: string;
  sourceDocument: string;
  guideName: string;
}

// Define all HTG PDFs to process
const HTG_PDFS: HtgPdfEntry[] = [
  // Flashings (1 file)
  {
    file: 'HTG_content/Artwork/Flashings Guide Artwork 2020/wetransfer-acc95a/RANZ Metal Roof Flashings - Web Quality 20200703republish.pdf',
    sourceDocument: 'flashings',
    guideName: 'RANZ Metal Roof Flashings Guide',
  },
  // Penetrations (1 file)
  {
    file: 'HTG_content/Artwork/Penetrations Artwork/RANZ Metal Roof Penetrations - Press Quality 2020republish.pdf',
    sourceDocument: 'penetrations',
    guideName: 'RANZ Metal Roof Penetrations Guide',
  },
  // Cladding (3 files - process in order for sequential page numbers)
  {
    file: 'HTG_content/Artwork/Cladding guide artwork/174548 Metal Wall Cladding.Cover.1A.PDF',
    sourceDocument: 'cladding',
    guideName: 'RANZ Metal Wall Cladding Guide - Cover',
  },
  {
    file: 'HTG_content/Artwork/Cladding guide artwork/174548 Metal Wall Cladding.2pp.1A.PDF',
    sourceDocument: 'cladding',
    guideName: 'RANZ Metal Wall Cladding Guide - 2pp',
  },
  {
    file: 'HTG_content/Artwork/Cladding guide artwork/174548 Metal Wall Cladding.4 x 32pp.1A.PDF',
    sourceDocument: 'cladding',
    guideName: 'RANZ Metal Wall Cladding Guide - Main',
  },
];

/**
 * Main import function
 */
async function importHtgContent() {
  console.log('Starting HTG content import...\n');

  // Delete existing records (idempotent)
  console.log('Clearing existing HTG content...');
  await db.delete(copSectionHtg); // Delete child records first (FK constraint)
  await db.delete(htgContent);
  console.log('✓ Cleared existing records\n');

  // Track cumulative page offset per sourceDocument
  const pageOffsets = new Map<string, number>();

  let totalRecordsInserted = 0;
  const recordsBySource: Record<string, number> = {};

  // Process each PDF
  for (const pdf of HTG_PDFS) {
    console.log(`Processing: ${path.basename(pdf.file)}`);
    console.log(`  Source: ${pdf.sourceDocument}`);
    console.log(`  Guide: ${pdf.guideName}`);

    const pdfPath = path.join(process.cwd(), pdf.file);

    // Check if file exists
    if (!fs.existsSync(pdfPath)) {
      console.warn(`  ⚠ File not found, skipping: ${pdfPath}\n`);
      continue;
    }

    // Get file size for logging
    const stats = fs.statSync(pdfPath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`  File size: ${fileSizeMB} MB`);

    try {
      // Read PDF buffer and convert to Uint8Array (unpdf requirement)
      const pdfBuffer = fs.readFileSync(pdfPath);
      const pdfData = new Uint8Array(pdfBuffer);

      // Get current page offset for this sourceDocument
      const pageOffset = pageOffsets.get(pdf.sourceDocument) || 0;

      // Extract text from the entire PDF
      console.log(`  Extracting text...`);

      let totalPages = 0;
      let pageTexts: string[] = [];

      try {
        const result = await extractText(pdfData, { mergePages: false });

        // When mergePages: false, result.text is an array of strings (one per page)
        if (Array.isArray(result.text)) {
          pageTexts = result.text;
          totalPages = result.text.length;
        } else {
          pageTexts = [result.text || ''];
          totalPages = result.totalPages || 1;
        }

        console.log(`  Total pages: ${totalPages}`);
      } catch (extractError: unknown) {
        const errorMessage = extractError instanceof Error ? extractError.message : String(extractError);

        if (errorMessage.includes('memory') || errorMessage.includes('heap')) {
          console.error(`  ✗ Memory error extracting PDF. Try increasing Node.js heap:`);
          console.error(`    NODE_OPTIONS='--max-old-space-size=4096' npm run db:import-htg-content`);
          console.warn(`  Skipping this file\n`);
          continue;
        } else {
          throw extractError;
        }
      }

      // Create one record per page for granular linking
      const records: Array<{
        id: string;
        sourceDocument: string;
        guideName: string;
        content: string;
        images: null;
        pdfPage: number;
      }> = [];

      for (let idx = 0; idx < pageTexts.length; idx++) {
        const pageText = (pageTexts[idx] || '').trim();
        if (pageText.length === 0) continue; // Skip empty pages (image-only)

        const pageNum = pageOffset + idx + 1;
        records.push({
          id: `${pdf.sourceDocument}-p${pageNum}`,
          sourceDocument: pdf.sourceDocument,
          guideName: `${pdf.guideName} - Page ${pageNum}`,
          content: pageText,
          images: null,
          pdfPage: pageNum,
        });
      }

      // Update page offset for this sourceDocument
      pageOffsets.set(pdf.sourceDocument, pageOffset + totalPages);

      // Insert records in batches
      if (records.length > 0) {
        const batchSize = 50;
        let insertedCount = 0;

        for (let i = 0; i < records.length; i += batchSize) {
          const batch = records.slice(i, i + batchSize);
          await db.insert(htgContent).values(batch);
          insertedCount += batch.length;
        }

        console.log(`  ✓ Inserted ${insertedCount} record(s)`);
        totalRecordsInserted += insertedCount;
        recordsBySource[pdf.sourceDocument] = (recordsBySource[pdf.sourceDocument] || 0) + insertedCount;
      } else {
        console.log(`  ⚠ No text content extracted (likely image-only pages)`);
      }

      console.log('');
    } catch (error) {
      console.error(`  ✗ Error processing PDF:`, error);
      console.log('');
      continue;
    }
  }

  // Final summary
  console.log('═══════════════════════════════════════════════════════');
  console.log('HTG CONTENT IMPORT COMPLETE');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Total records inserted: ${totalRecordsInserted}`);
  console.log('\nBreakdown by source:');

  for (const [source, count] of Object.entries(recordsBySource)) {
    console.log(`  ${source}: ${count} record(s)`);
  }

  if (totalRecordsInserted === 0) {
    console.warn('\n⚠ No records were inserted. Check PDF file locations and extraction.');
  }

  console.log('\n✓ Import complete!\n');
}

// Run import
importHtgContent()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('Import failed:', err);
    process.exit(1);
  });
