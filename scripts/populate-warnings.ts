import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { warningConditions } from '../lib/db/schema';
import * as fs from 'fs';
import * as path from 'path';

import { config } from 'dotenv';
config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

interface EnhancedWarning {
  detailCode: string;
  conditionType: 'other' | 'wind_zone' | 'corrosion_zone' | 'pitch';
  conditionValue: string;
  warningText: string;
  severity: 'info' | 'warning';
}

async function populateWarnings() {
  console.log('Starting warnings population...\n');

  const mrmExtractPath = path.join(process.cwd(), 'mrm_extract');

  // Load warnings_enhanced.json
  const warningsPath = path.join(mrmExtractPath, 'warnings_enhanced.json');
  const warningsData: EnhancedWarning[] = JSON.parse(
    fs.readFileSync(warningsPath, 'utf-8')
  );

  console.log(`Loaded ${warningsData.length} enhanced warnings\n`);

  // Clear existing warning_conditions (idempotent)
  console.log('Clearing existing warning_conditions...');
  await db.delete(warningConditions);
  console.log('  ✓ Cleared\n');

  // Group warnings for batch insert
  const BATCH_SIZE = 50;
  const batches: any[][] = [];
  let currentBatch: any[] = [];
  let index = 0;

  const detailCodeSet = new Set<string>();
  const conditionTypeSet = new Set<string>();
  const severitySet = new Set<string>();

  for (const warning of warningsData) {
    const detailId = `lrm-${warning.detailCode.toLowerCase()}`;
    const warningId = `w-enh-${warning.detailCode.toLowerCase()}-${String(index).padStart(3, '0')}`;

    currentBatch.push({
      id: warningId,
      detailId: detailId,
      conditionType: warning.conditionType,
      conditionValue: warning.conditionValue,
      warningText: warning.warningText,
      severity: warning.severity,
      nzbcRef: null,
    });

    detailCodeSet.add(warning.detailCode);
    conditionTypeSet.add(warning.conditionType);
    severitySet.add(warning.severity);

    index++;

    if (currentBatch.length >= BATCH_SIZE) {
      batches.push(currentBatch);
      currentBatch = [];
    }
  }

  // Add remaining batch
  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }

  console.log(`Inserting ${warningsData.length} warnings in ${batches.length} batches...`);

  let insertedCount = 0;
  for (const [batchIndex, batch] of batches.entries()) {
    try {
      await db.insert(warningConditions).values(batch);
      insertedCount += batch.length;
      console.log(`  ✓ Batch ${batchIndex + 1}/${batches.length}: ${batch.length} warnings`);
    } catch (err) {
      console.error(`  ✗ Batch ${batchIndex + 1} failed:`, err);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('Population complete!\n');
  console.log(`Warnings inserted: ${insertedCount}`);
  console.log(`Detail codes covered: ${detailCodeSet.size} unique codes`);
  console.log(`\nCondition types (${conditionTypeSet.size}):`);
  [...conditionTypeSet].forEach(type => console.log(`  - ${type}`));
  console.log(`\nSeverity levels (${severitySet.size}):`);
  [...severitySet].forEach(severity => console.log(`  - ${severity}`));
  console.log(`${'='.repeat(60)}`);
}

populateWarnings()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Population failed:', error);
    process.exit(1);
  });
