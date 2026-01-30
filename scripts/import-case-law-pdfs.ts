import { config } from 'dotenv';
config({ path: '.env.local' });

import { db } from '../lib/db';
import { failureCases } from '../lib/db/schema';
import { eq } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

// Helper to generate unique ID
function generateId(): string {
  return `case-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Extract case ID from determination filename (e.g., "2024-035.pdf" -> "2024-035")
function extractDeterminationCaseId(filename: string): string {
  return filename.replace('.pdf', '');
}

// Extract case ID from LBP complaint filename
function extractLbpCaseId(filename: string): { caseId: string; name: string; year: string } {
  // Examples:
  // barton-2022-cb25980-final-decision.pdf -> CB25980
  // aarts-2023-cb26121-not-upheld-decision (1).pdf -> CB26121

  const nameMatch = filename.match(/^([a-z-]+)-(\d{4})/i);
  const caseMatch = filename.match(/cb(\d+)/i) || filename.match(/bpb-?(\d+)/i);

  const name = nameMatch ? nameMatch[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Unknown';
  const year = nameMatch ? nameMatch[2] : '2024';
  const caseNum = caseMatch ? caseMatch[1] : filename.split('-')[0];

  return {
    caseId: `CB${caseNum}`,
    name,
    year
  };
}

// Determine outcome from filename
function extractOutcome(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.includes('not-upheld') || lower.includes('not upheld')) return 'not-upheld';
  if (lower.includes('penalty')) return 'upheld'; // Penalty decisions mean complaint was upheld
  if (lower.includes('upheld')) return 'upheld';
  if (lower.includes('dismissed')) return 'dismissed';
  return 'upheld'; // Default for final decisions
}

async function importCaseLaw() {
  console.log('Starting Case Law PDF import...\n');

  const publicDir = path.join(process.cwd(), 'public');
  const determinationsDir = path.join(publicDir, 'determinations');
  const complaintsDir = path.join(publicDir, 'upheld_complaints');

  let determinationsImported = 0;
  let complaintsImported = 0;
  let skipped = 0;

  // Import Determinations
  console.log('📋 Importing MBIE Determinations...');
  if (fs.existsSync(determinationsDir)) {
    const files = fs.readdirSync(determinationsDir).filter(f => f.endsWith('.pdf'));

    for (const file of files) {
      const caseId = extractDeterminationCaseId(file);
      const pdfUrl = `/determinations/${file}`;

      // Check if already exists
      const existing = await db.select().from(failureCases).where(eq(failureCases.caseId, caseId)).limit(1);

      if (existing.length > 0) {
        // Update existing with PDF URL
        await db.update(failureCases)
          .set({ pdfUrl, caseType: 'determination' })
          .where(eq(failureCases.caseId, caseId));
        console.log(`  Updated: ${caseId}`);
        skipped++;
      } else {
        // Create new entry
        const year = caseId.split('-')[0];
        await db.insert(failureCases).values({
          id: generateId(),
          caseId,
          caseType: 'determination',
          pdfUrl,
          summary: `MBIE Determination ${caseId} - Roofing related building code compliance matter.`,
          outcome: 'upheld',
          decisionDate: new Date(`${year}-01-01`),
          failureType: 'water-ingress',
        });
        console.log(`  Created: ${caseId}`);
        determinationsImported++;
      }
    }
  }

  // Import LBP Complaints
  console.log('\n📋 Importing LBP Complaint Decisions...');
  if (fs.existsSync(complaintsDir)) {
    const files = fs.readdirSync(complaintsDir).filter(f => f.endsWith('.pdf'));

    for (const file of files) {
      const { caseId, name, year } = extractLbpCaseId(file);
      const pdfUrl = `/upheld_complaints/${encodeURIComponent(file)}`;
      const outcome = extractOutcome(file);

      // Check if already exists
      const existing = await db.select().from(failureCases).where(eq(failureCases.caseId, caseId)).limit(1);

      if (existing.length > 0) {
        // Update existing with PDF URL
        await db.update(failureCases)
          .set({ pdfUrl, caseType: 'lbp-complaint', outcome })
          .where(eq(failureCases.caseId, caseId));
        console.log(`  Updated: ${caseId} (${name})`);
        skipped++;
      } else {
        // Create new entry
        await db.insert(failureCases).values({
          id: generateId(),
          caseId,
          caseType: 'lbp-complaint',
          pdfUrl,
          summary: `LBP Complaint Decision - ${name} (${year}). Building Practitioners Board decision regarding licensed building practitioner conduct.`,
          outcome,
          decisionDate: new Date(`${year}-01-01`),
          failureType: 'workmanship',
        });
        console.log(`  Created: ${caseId} (${name})`);
        complaintsImported++;
      }
    }
  }

  console.log('\n✅ Import complete!');
  console.log(`   Determinations imported: ${determinationsImported}`);
  console.log(`   LBP Complaints imported: ${complaintsImported}`);
  console.log(`   Updated existing: ${skipped}`);
  console.log(`   Total case law entries: ${determinationsImported + complaintsImported + skipped}`);

  process.exit(0);
}

importCaseLaw().catch((error) => {
  console.error('Import failed:', error);
  process.exit(1);
});
