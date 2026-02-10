import { config } from 'dotenv';
config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';

const sql = neon(process.env.DATABASE_URL!);

async function fixModelUrls() {
  console.log('='.repeat(60));
  console.log(' Fix Model URLs: R2 CDN → Local Static Serving');
  console.log('='.repeat(60));

  // 1. Get all details with model_url set
  const rows = await sql`
    SELECT id, code, source_id, model_url
    FROM details
    WHERE model_url IS NOT NULL
  `;

  console.log(`\nFound ${rows.length} details with model URLs.\n`);

  if (rows.length === 0) {
    console.log('Nothing to update.');
    return;
  }

  const modelsDir = path.join(process.cwd(), 'public', 'models');
  let updated = 0;
  let skipped = 0;
  let alreadyLocal = 0;
  let missingFile = 0;

  for (const row of rows) {
    const currentUrl: string = row.model_url;

    // Already a local path — skip
    if (currentUrl.startsWith('/models/')) {
      alreadyLocal++;
      continue;
    }

    // Extract filename from R2 CDN URL or other URL
    // Expected pattern: https://pub-xxx.r2.dev/models/grf101.glb
    const filename = currentUrl.split('/').pop();
    if (!filename) {
      console.warn(`  SKIP ${row.code}: cannot extract filename from ${currentUrl}`);
      skipped++;
      continue;
    }

    // Verify file exists locally
    const localPath = path.join(modelsDir, filename);
    if (!fs.existsSync(localPath)) {
      console.warn(`  MISSING ${row.code}: ${filename} not found in public/models/`);
      missingFile++;
      continue;
    }

    const newUrl = `/models/${filename}`;
    await sql`
      UPDATE details
      SET model_url = ${newUrl}
      WHERE id = ${row.id}
    `;
    console.log(`  UPDATED ${row.code}: ${currentUrl} → ${newUrl}`);
    updated++;
  }

  console.log('\n' + '='.repeat(60));
  console.log(' Summary');
  console.log('='.repeat(60));
  console.log(`  Total with model_url: ${rows.length}`);
  console.log(`  Updated (R2 → local): ${updated}`);
  console.log(`  Already local:        ${alreadyLocal}`);
  console.log(`  Missing file:         ${missingFile}`);
  console.log(`  Skipped (bad URL):    ${skipped}`);
  console.log('='.repeat(60));

  if (missingFile > 0) {
    console.log('\nWARNING: Some model files are missing from public/models/.');
    console.log('These details still reference the old URL.');
  }
}

fixModelUrls().catch(console.error);
