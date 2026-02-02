/**
 * Audit metrics for content linking population
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

import { db } from '@/lib/db';
import { details, detailLinks, sources } from '@/lib/db/schema';
import { eq, sql, count, and, isNotNull, ne } from 'drizzle-orm';

async function getMetrics() {
  console.log('=== Database Metrics ===\n');

  // Total details by source
  const mrmCount = await db.select({ count: count() }).from(details).where(eq(details.sourceId, 'mrm-cop'));
  const ranzCount = await db.select({ count: count() }).from(details).where(eq(details.sourceId, 'ranz-guide'));

  console.log('Total MRM details:', mrmCount[0].count);
  console.log('Total RANZ details:', ranzCount[0].count);

  // RANZ details with 3D models
  const ranzWithModels = await db.select({ count: count() }).from(details)
    .where(and(
      eq(details.sourceId, 'ranz-guide'),
      isNotNull(details.modelUrl),
      ne(details.modelUrl, '')
    ));
  console.log('RANZ details with 3D models:', ranzWithModels[0].count);

  // Current link count
  const linkCount = await db.select({ count: count() }).from(detailLinks);
  console.log('Current link count:', linkCount[0].count);

  // Get link details
  const allLinks = await db.select().from(detailLinks);
  console.log('\nExisting links:');
  for (const link of allLinks) {
    console.log(`  - ${link.primaryDetailId} -> ${link.supplementaryDetailId} [${link.matchConfidence || 'manual'}]`);
  }

  // Sources
  const allSources = await db.select().from(sources);
  console.log('\nSources in database:');
  for (const src of allSources) {
    console.log(`  - ${src.id}: ${src.name} (${src.shortName})`);
  }
}

getMetrics()
  .then(() => process.exit(0))
  .catch(e => { console.error(e); process.exit(1); });
