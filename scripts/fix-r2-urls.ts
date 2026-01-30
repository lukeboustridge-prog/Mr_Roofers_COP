import { config } from 'dotenv';
config({ path: '.env.local' });

import { db } from '../lib/db';
import { failureCases } from '../lib/db/schema';
import { like, or, isNotNull } from 'drizzle-orm';

const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!;

async function fixR2Urls() {
  console.log('Fixing remaining local PDF URLs to R2 URLs...\n');

  // Get all cases with local pdfUrls
  const cases = await db
    .select()
    .from(failureCases)
    .where(
      or(
        like(failureCases.pdfUrl, '/determinations/%'),
        like(failureCases.pdfUrl, '/upheld_complaints/%')
      )
    );

  console.log(`Found ${cases.length} cases with local PDF URLs to fix\n`);

  let fixed = 0;
  for (const caseItem of cases) {
    if (!caseItem.pdfUrl) continue;

    let r2Url: string;

    if (caseItem.pdfUrl.startsWith('/determinations/')) {
      // Determinations - simple path
      const filename = caseItem.pdfUrl.replace('/determinations/', '');
      r2Url = `${R2_PUBLIC_URL}/case-law/determinations/${filename}`;
    } else {
      // LBP complaints - need to decode and sanitize
      const encoded = caseItem.pdfUrl.replace('/upheld_complaints/', '');
      const decoded = decodeURIComponent(encoded);
      const sanitized = decoded.replace(/\s+/g, '-').replace(/[()]/g, '');
      r2Url = `${R2_PUBLIC_URL}/case-law/lbp-complaints/${sanitized}`;
    }

    try {
      await db.update(failureCases)
        .set({ pdfUrl: r2Url })
        .where(like(failureCases.id, caseItem.id));

      console.log(`✓ ${caseItem.caseId}: ${r2Url}`);
      fixed++;
    } catch (error) {
      console.error(`✗ ${caseItem.caseId}: ${error}`);
    }
  }

  console.log(`\n✅ Fixed ${fixed} URLs`);
  process.exit(0);
}

fixR2Urls().catch((error) => {
  console.error('Fix failed:', error);
  process.exit(1);
});
