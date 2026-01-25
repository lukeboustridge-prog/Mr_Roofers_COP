import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { substrates, categories, details, detailSteps, warningConditions, failureCases, detailFailureLinks } from './schema';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables for standalone script execution
import { config } from 'dotenv';
config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

// Types for extracted data
interface ExtractedStep {
  step: number;
  instruction: string;
  note: string | null;
}

interface ExtractedDetail {
  code: string;
  name: string;
  description: string;
  category: string;
  substrate: string;
  min_pitch: number | null;
  max_pitch: number | null;
  wind_zone_min: string | null;
  specifications: Record<string, string>;
  steps: ExtractedStep[];
  standards_refs: Array<{ code: string; clause?: string; title?: string }>;
  ventilation_checks: Array<{ check: string; required: boolean }>;
  images: string[];
  pdf_pages: number[];
  related_details: string[];
}

interface ExtractedWarning {
  detail_code: string;
  level: string;
  message: string;
  condition: Record<string, unknown>;
  nzbc_ref: string | null;
  pdf_page: number;
}

// Category mapping from extracted category names to database IDs
const categoryMapping: Record<string, { id: string; name: string; description: string; sortOrder: number }> = {
  'drainage': { id: 'lrm-drainage', name: 'Drainage', description: 'Roof drainage systems, gutters, downpipes, and capacity calculations', sortOrder: 1 },
  'flashings': { id: 'lrm-flashings', name: 'Flashings', description: 'Wall, barge, apron, step, parapet, and ridge flashings', sortOrder: 2 },
  'junctions': { id: 'lrm-junctions', name: 'Junctions', description: 'Roof-to-wall and roof-to-roof intersection details', sortOrder: 3 },
  'penetrations': { id: 'lrm-penetrations', name: 'Penetrations', description: 'Pipe, vent, skylight, and equipment penetrations', sortOrder: 4 },
  'ventilation': { id: 'lrm-ventilation', name: 'Ventilation', description: 'Roof space ventilation, condensation control, and underlay requirements', sortOrder: 5 },
};

// Substrate mapping
const substrateMapping: Record<string, string> = {
  'profiled-metal': 'long-run-metal',
};

/**
 * Clean description text by removing PDF artifacts
 */
function cleanDescription(description: string): string {
  if (!description) return '';

  // Remove page number patterns like "5 \n" at the start
  let cleaned = description.replace(/^\d+(\.\d+)*\s*\n/g, '');

  // Remove footer text about controlled document
  cleaned = cleaned.replace(/This is a controlled document\. This copy of the Code Of Practice was issued.*$/gm, '');

  // Remove "The Online version" footer text
  cleaned = cleaned.replace(/The Online version of this document is the most up-to-date.*$/gm, '');

  // Remove section headers like "5 ROOF DRAINAGE", "5.4.7 Gutter Capacity" etc
  cleaned = cleaned.replace(/\n\s*\d+\s+[A-Z][A-Z\s]+\n/g, '\n');
  cleaned = cleaned.replace(/\n\s*\d+\.\d+(\.\d+)?\s+[A-Z][A-Z\s]+\n/g, '\n');
  cleaned = cleaned.replace(/\n\s*\d+\s*\n/g, '\n');
  cleaned = cleaned.replace(/\n\s*\d+\.\d+(\.\d+)?\s*\n/g, '\n');

  // Remove standalone section numbers at end of description
  cleaned = cleaned.replace(/\s+\d+(\.\d+)*\s*$/gm, '');

  // Remove page numbers embedded in text (e.g., "169" on its own line)
  cleaned = cleaned.replace(/^\d{2,3}\s*$/gm, '');

  // Remove double spaces and normalize whitespace
  cleaned = cleaned.replace(/[ \t]+/g, ' ');
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  cleaned = cleaned.trim();

  return cleaned;
}

/**
 * Filter valid steps - remove malformed entries that are just section numbers
 */
function filterValidSteps(steps: ExtractedStep[]): ExtractedStep[] {
  return steps.filter(step => {
    const instruction = step.instruction.trim();

    // Skip steps that are just numbers (section references)
    if (/^\d+(\.\d+)*$/.test(instruction)) return false;

    // Skip steps that are just section headers
    if (/^[A-Z\s]+$/.test(instruction) && instruction.length < 30) return false;

    // Skip steps that reference other sections like "5.4.7 Gutter Capacity Calculator"
    if (/^\d+\.\d+(\.\d+)?\s+[A-Z]/.test(instruction) && instruction.length < 50) return false;

    // Skip very short instructions (less than 10 chars usually not helpful)
    if (instruction.length < 10) return false;

    return true;
  });
}

/**
 * Generate detail ID from code
 */
function generateDetailId(code: string, substrateId: string): string {
  return `${substrateId.replace('long-run-', 'lrm-').replace('-metal', '')}-${code.toLowerCase()}`;
}

/**
 * Map warning level to severity
 */
function mapWarningSeverity(level: string): string {
  switch (level.toLowerCase()) {
    case 'critical': return 'critical';
    case 'warning': return 'warning';
    case 'caution': return 'warning';
    case 'info': return 'info';
    default: return 'info';
  }
}

async function importMrmData() {
  console.log('Starting MRM data import...\n');

  // Load extracted data
  const mrmExtractPath = path.join(process.cwd(), 'mrm_extract');

  console.log('Loading extracted data from:', mrmExtractPath);

  const detailsData: ExtractedDetail[] = JSON.parse(
    fs.readFileSync(path.join(mrmExtractPath, 'details.json'), 'utf-8')
  );
  const warningsData: ExtractedWarning[] = JSON.parse(
    fs.readFileSync(path.join(mrmExtractPath, 'warnings.json'), 'utf-8')
  );

  console.log(`Loaded ${detailsData.length} details and ${warningsData.length} warnings\n`);

  // Clear existing data
  console.log('Clearing existing data...');
  await db.delete(detailFailureLinks);
  await db.delete(detailSteps);
  await db.delete(warningConditions);
  await db.delete(failureCases);
  await db.delete(details);
  await db.delete(categories);
  await db.delete(substrates);
  console.log('Existing data cleared\n');

  // Seed Substrates (keeping structure consistent)
  console.log('Seeding substrates...');
  const substrateData = [
    { id: 'long-run-metal', name: 'Long-Run Metal', description: 'Corrugated, trapezoidal, and standing seam metal roofing systems', iconUrl: '/icons/substrates/metal.svg', sortOrder: 1 },
    { id: 'membrane', name: 'Membrane', description: 'TPO, PVC, EPDM, and other membrane roofing applications', iconUrl: '/icons/substrates/membrane.svg', sortOrder: 2 },
    { id: 'asphalt-shingle', name: 'Asphalt Shingle', description: 'Asphalt shingle installation and detailing', iconUrl: '/icons/substrates/shingle.svg', sortOrder: 3 },
    { id: 'concrete-tile', name: 'Concrete Tile', description: 'Concrete tile roofing systems and accessories', iconUrl: '/icons/substrates/concrete.svg', sortOrder: 4 },
    { id: 'clay-tile', name: 'Clay Tile', description: 'Traditional and modern clay tile installations', iconUrl: '/icons/substrates/clay.svg', sortOrder: 5 },
    { id: 'pressed-metal-tile', name: 'Pressed Metal Tile', description: 'Pressed metal tile systems including shake profiles', iconUrl: '/icons/substrates/pressed.svg', sortOrder: 6 },
  ];
  await db.insert(substrates).values(substrateData);
  console.log(`Seeded ${substrateData.length} substrates\n`);

  // Seed Categories based on extracted data
  console.log('Seeding categories...');
  const categoryData = Object.entries(categoryMapping).map(([, value]) => ({
    id: value.id,
    substrateId: 'long-run-metal',
    name: value.name,
    description: value.description,
    iconUrl: `/icons/categories/${value.id.replace('lrm-', '')}.svg`,
    sortOrder: value.sortOrder,
  }));
  await db.insert(categories).values(categoryData);
  console.log(`Seeded ${categoryData.length} categories\n`);

  // Process and import details
  console.log('Processing and importing details...');
  const processedDetails: Array<{
    id: string;
    code: string;
    name: string;
    description: string | null;
    substrateId: string;
    categoryId: string;
    minPitch: number | null;
    maxPitch: number | null;
    thumbnailUrl: string | null;
    specifications: Record<string, string> | null;
    standardsRefs: Array<{ code: string; clause?: string; title?: string }> | null;
    ventilationReqs: Array<{ check: string; required: boolean }> | null;
  }> = [];

  const processedSteps: Array<{
    id: string;
    detailId: string;
    stepNumber: number;
    instruction: string;
    cautionNote: string | null;
  }> = [];

  let skippedSteps = 0;
  let totalSteps = 0;

  for (const detail of detailsData) {
    const substrateId = substrateMapping[detail.substrate] || 'long-run-metal';
    const categoryInfo = categoryMapping[detail.category];

    if (!categoryInfo) {
      console.warn(`Unknown category: ${detail.category} for detail ${detail.code}`);
      continue;
    }

    const detailId = generateDetailId(detail.code, substrateId);

    // Process detail
    processedDetails.push({
      id: detailId,
      code: detail.code,
      name: detail.name,
      description: cleanDescription(detail.description) || null,
      substrateId,
      categoryId: categoryInfo.id,
      minPitch: detail.min_pitch,
      maxPitch: detail.max_pitch,
      thumbnailUrl: detail.images.length > 0 ? `/images/details/${detail.images[0]}` : null,
      specifications: Object.keys(detail.specifications).length > 0 ? detail.specifications : null,
      standardsRefs: detail.standards_refs.length > 0 ? detail.standards_refs : null,
      ventilationReqs: detail.ventilation_checks.length > 0 ? detail.ventilation_checks : null,
    });

    // Process valid steps only
    const validSteps = filterValidSteps(detail.steps);
    totalSteps += detail.steps.length;
    skippedSteps += detail.steps.length - validSteps.length;

    for (let i = 0; i < validSteps.length; i++) {
      const step = validSteps[i];
      processedSteps.push({
        id: `${detailId}-step-${i + 1}`,
        detailId,
        stepNumber: i + 1,
        instruction: step.instruction.trim(),
        cautionNote: step.note,
      });
    }
  }

  // Insert details in batches
  const BATCH_SIZE = 50;
  for (let i = 0; i < processedDetails.length; i += BATCH_SIZE) {
    const batch = processedDetails.slice(i, i + BATCH_SIZE);
    await db.insert(details).values(batch);
    console.log(`  Inserted details ${i + 1}-${Math.min(i + BATCH_SIZE, processedDetails.length)} of ${processedDetails.length}`);
  }
  console.log(`Imported ${processedDetails.length} details\n`);

  // Insert steps in batches
  if (processedSteps.length > 0) {
    console.log('Importing detail steps...');
    for (let i = 0; i < processedSteps.length; i += BATCH_SIZE) {
      const batch = processedSteps.slice(i, i + BATCH_SIZE);
      await db.insert(detailSteps).values(batch);
    }
    console.log(`Imported ${processedSteps.length} steps (skipped ${skippedSteps} malformed steps)\n`);
  }

  // Process and import warnings that have detail codes
  console.log('Processing and importing warnings...');

  // Create a set of valid detail codes for lookup
  const validDetailCodes = new Set(processedDetails.map(d => d.code));

  const processedWarnings: Array<{
    id: string;
    detailId: string;
    conditionType: string;
    conditionValue: string;
    warningText: string;
    severity: string;
    nzbcRef: string | null;
  }> = [];

  let warningIndex = 0;
  for (const warning of warningsData) {
    // Only import warnings that have a valid detail code
    if (warning.detail_code && validDetailCodes.has(warning.detail_code)) {
      const detailId = generateDetailId(warning.detail_code, 'long-run-metal');

      // Try to determine condition type from message content
      let conditionType = 'general';
      let conditionValue = 'all';

      const message = warning.message.toLowerCase();
      if (message.includes('wind') || message.includes('storm')) {
        conditionType = 'wind_zone';
        conditionValue = 'high';
      } else if (message.includes('corrosion') || message.includes('marine') || message.includes('coastal')) {
        conditionType = 'corrosion_zone';
        conditionValue = 'c';
      } else if (message.includes('pitch') || message.includes('slope')) {
        conditionType = 'pitch';
        conditionValue = 'varies';
      }

      processedWarnings.push({
        id: `w-${warning.detail_code.toLowerCase()}-${warningIndex++}`,
        detailId,
        conditionType,
        conditionValue,
        warningText: warning.message,
        severity: mapWarningSeverity(warning.level),
        nzbcRef: warning.nzbc_ref,
      });
    }
  }

  if (processedWarnings.length > 0) {
    for (let i = 0; i < processedWarnings.length; i += BATCH_SIZE) {
      const batch = processedWarnings.slice(i, i + BATCH_SIZE);
      await db.insert(warningConditions).values(batch);
    }
    console.log(`Imported ${processedWarnings.length} warnings (from ${warningsData.length} total, filtered by detail code)\n`);
  } else {
    console.log(`No warnings with valid detail codes to import (${warningsData.length} total had no matching detail)\n`);
  }

  // Summary
  console.log('Import complete!\n');
  console.log('Summary:');
  console.log(`  Substrates: ${substrateData.length}`);
  console.log(`  Categories: ${categoryData.length}`);
  console.log(`  Details: ${processedDetails.length}`);
  console.log(`  Detail Steps: ${processedSteps.length} (${skippedSteps} malformed steps skipped)`);
  console.log(`  Warnings: ${processedWarnings.length}`);
}

// Run the import
importMrmData()
  .then(() => {
    console.log('\nMRM data import completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Import failed:', error);
    process.exit(1);
  });
