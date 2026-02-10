import { config } from 'dotenv';
config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function check() {
  // Check content sources
  const sources = await sql`SELECT id, name, short_name FROM content_sources ORDER BY sort_order`;
  console.log('=== Content Sources ===');
  sources.forEach(s => console.log(`  ${s.id} | ${s.short_name} | ${s.name}`));

  // Check details by source
  const bySource = await sql`SELECT source_id, COUNT(*) as cnt FROM details GROUP BY source_id`;
  console.log('\n=== Details by Source ===');
  bySource.forEach(r => console.log(`  ${r.source_id}: ${r.cnt} details`));

  // Check what fixer results look like for a sample substrate
  const fixerSample = await sql`
    SELECT d.code, d.name, d.source_id, cs.short_name as source_name
    FROM details d
    LEFT JOIN content_sources cs ON d.source_id = cs.id
    WHERE d.substrate_id LIKE '%metal%'
    ORDER BY d.source_id, d.code
    LIMIT 20
  `;
  console.log('\n=== Sample Fixer Results (metal substrate) ===');
  fixerSample.forEach(r => console.log(`  ${r.code} | ${r.source_name} | ${r.name}`));

  // Check if fixer API has any source filtering
  const categories = await sql`
    SELECT c.id, c.name, c.substrate_id, c.source_id, cs.short_name
    FROM categories c
    LEFT JOIN content_sources cs ON c.source_id = cs.id
    ORDER BY c.source_id, c.substrate_id
    LIMIT 20
  `;
  console.log('\n=== Categories by Source ===');
  categories.forEach(c => console.log(`  ${c.id} | ${c.short_name} | ${c.substrate_id} | ${c.name}`));
}

check().catch(console.error);
