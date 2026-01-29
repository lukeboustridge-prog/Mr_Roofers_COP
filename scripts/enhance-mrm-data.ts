/**
 * MRM Data Enhancement Script
 *
 * Cleans and enhances MRM detail data:
 * 1. Removes PDF footer noise from descriptions
 * 2. Clears garbage steps (section numbers)
 * 3. Extracts specifications from descriptions
 * 4. Links standards references
 * 5. Adds warning conditions
 *
 * Usage: npx tsx scripts/enhance-mrm-data.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface MrmDetail {
  code: string;
  name: string;
  description: string;
  category: string;
  substrate: string;
  min_pitch: number | null;
  max_pitch: number | null;
  wind_zone_min: string | null;
  specifications: Record<string, string>;
  steps: Array<{ step: number; instruction: string; note: string | null }>;
  standards_refs: Array<{ code: string; clause: string; title: string }>;
  ventilation_checks: Array<{ check: string; required: boolean }>;
  images: string[];
  pdf_pages: number[];
  related_details: string[];
}

interface MrmWarning {
  detail_code: string;
  level: string;
  message: string;
  nzbc_ref: string;
}

// PDF footer patterns to remove
const PDF_FOOTER_PATTERNS = [
  /This is a controlled document\. This copy of the Code Of Practice was issued.*?prevails over any saved or printed version\./gs,
  /\d+\nThis is a controlled document.*$/gs,
  /The Online version of this document is the most up-to-date.*$/gs,
];

// Section number patterns (garbage steps)
const GARBAGE_STEP_PATTERNS = [
  /^\d+(\.\d+)*$/,                    // "5", "5.1", "5.1.1"
  /^\d+(\.\d+)*[A-Z]?$/,              // "5.1A"
  /^ROOF DRAINAGE$/i,
  /^ROOF JUNCTIONS$/i,
  /^PENETRATIONS$/i,
  /^FLASHINGS$/i,
  /^VENTILATION$/i,
  /^\d+ [A-Z]+$/,                     // "5 VALLEYS", "4 GUTTERS"
  /^\d+(\.\d+)* [A-Z]+$/,             // "5.3 ROOF DRAINAGE DESIGN"
];

// Standards to link
const STANDARDS_MAP: Record<string, { code: string; title: string }> = {
  'E1/AS1': { code: 'E1/AS1', title: 'Surface Water - Acceptable Solution' },
  'E2/AS1': { code: 'E2/AS1', title: 'External Moisture - Acceptable Solution' },
  'E3/AS1': { code: 'E3/AS1', title: 'Internal Moisture - Acceptable Solution' },
  'B1/AS1': { code: 'B1/AS1', title: 'Structure - Acceptable Solution' },
  'B2/AS1': { code: 'B2/AS1', title: 'Durability - Acceptable Solution' },
  'NZS 3604': { code: 'NZS 3604', title: 'Timber-framed Buildings' },
  'AS/NZS 1562': { code: 'AS/NZS 1562', title: 'Design and Installation of Sheet Roof and Wall Cladding' },
  'AS/NZS 2179': { code: 'AS/NZS 2179', title: 'Rainwater Goods' },
};

// Pitch extraction patterns
const PITCH_PATTERNS = [
  /minimum\s+(?:roof\s+)?pitch\s+(?:of\s+)?(\d+)\s*(?:deg|°|degrees)/gi,
  /(\d+)\s*(?:deg|°|degrees)\s+minimum/gi,
  /pitch\s+(?:of\s+)?(\d+)\s*(?:deg|°|degrees)/gi,
  /(\d+)\s*(?:deg|°|degrees)\s+pitch/gi,
];

function cleanDescription(desc: string): string {
  let cleaned = desc;

  // Remove PDF footer noise
  for (const pattern of PDF_FOOTER_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }

  // Clean up multiple newlines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  // Remove section numbers at start of lines
  cleaned = cleaned.replace(/^\s*\d+(\.\d+)*\s*\n/gm, '');

  return cleaned.trim();
}

function isGarbageStep(instruction: string): boolean {
  const trimmed = instruction.trim();

  // Check against garbage patterns
  for (const pattern of GARBAGE_STEP_PATTERNS) {
    if (pattern.test(trimmed)) {
      return true;
    }
  }

  // Too short to be useful
  if (trimmed.length < 10) {
    return true;
  }

  return false;
}

function extractPitchFromDescription(desc: string): { min: number | null; max: number | null } {
  const pitches: number[] = [];

  for (const pattern of PITCH_PATTERNS) {
    const matches = desc.matchAll(pattern);
    for (const match of matches) {
      const pitch = parseInt(match[1], 10);
      if (pitch > 0 && pitch < 90) {
        pitches.push(pitch);
      }
    }
  }

  if (pitches.length === 0) {
    return { min: null, max: null };
  }

  return {
    min: Math.min(...pitches),
    max: Math.max(...pitches),
  };
}

function extractStandardsFromDescription(desc: string): Array<{ code: string; clause: string; title: string }> {
  const refs: Array<{ code: string; clause: string; title: string }> = [];
  const found = new Set<string>();

  for (const [key, value] of Object.entries(STANDARDS_MAP)) {
    if (desc.includes(key) && !found.has(key)) {
      refs.push({
        code: value.code,
        clause: '',
        title: value.title,
      });
      found.add(key);
    }
  }

  return refs;
}

function determineWarningConditions(detail: MrmDetail): Array<{
  conditionType: string;
  conditionValue: string;
  warningText: string;
  severity: string;
}> {
  const warnings: Array<{
    conditionType: string;
    conditionValue: string;
    warningText: string;
    severity: string;
  }> = [];

  const desc = detail.description.toLowerCase();

  // Wind zone warnings
  if (desc.includes('wind') || desc.includes('cyclone') || desc.includes('exposed')) {
    warnings.push({
      conditionType: 'wind_zone',
      conditionValue: 'VH,EH',
      warningText: 'Additional fixing requirements may apply in Very High and Extra High wind zones',
      severity: 'warning',
    });
  }

  // Corrosion warnings
  if (desc.includes('corrosion') || desc.includes('coastal') || desc.includes('marine')) {
    warnings.push({
      conditionType: 'corrosion_zone',
      conditionValue: 'C,D,E',
      warningText: 'Enhanced corrosion protection required in severe marine environments',
      severity: 'warning',
    });
  }

  // Pitch warnings
  if (desc.includes('low pitch') || desc.includes('minimum pitch')) {
    warnings.push({
      conditionType: 'pitch',
      conditionValue: '<8',
      warningText: 'Low pitch roofs require specific drainage and waterproofing considerations',
      severity: 'warning',
    });
  }

  // Penetration warnings
  if (detail.category === 'penetrations') {
    warnings.push({
      conditionType: 'other',
      conditionValue: 'all',
      warningText: 'Ensure penetration flashing extends minimum 150mm under roof cladding on upslope side',
      severity: 'info',
    });
  }

  // Valley warnings
  if (desc.includes('valley')) {
    warnings.push({
      conditionType: 'other',
      conditionValue: 'all',
      warningText: 'Valley capacity must be calculated based on catchment area and rainfall intensity',
      severity: 'info',
    });
  }

  return warnings;
}

async function enhanceMrmData() {
  console.log('='.repeat(60));
  console.log(' MRM Data Enhancement');
  console.log('='.repeat(60));

  // Load details
  const detailsPath = path.join(process.cwd(), 'mrm_extract', 'details.json');
  const details: MrmDetail[] = JSON.parse(fs.readFileSync(detailsPath, 'utf-8'));

  console.log(`\n📂 Loaded ${details.length} details\n`);

  const stats = {
    descriptionsCleanged: 0,
    stepsRemoved: 0,
    stepsKept: 0,
    pitchExtracted: 0,
    standardsLinked: 0,
    warningsAdded: 0,
  };

  const enhanced: MrmDetail[] = [];
  const warningsToAdd: Array<{
    detailCode: string;
    conditionType: string;
    conditionValue: string;
    warningText: string;
    severity: string;
  }> = [];

  for (const detail of details) {
    // 1. Clean description
    const cleanedDesc = cleanDescription(detail.description);
    if (cleanedDesc !== detail.description) {
      stats.descriptionsCleanged++;
    }

    // 2. Filter garbage steps
    const validSteps = detail.steps.filter(s => !isGarbageStep(s.instruction));
    stats.stepsRemoved += detail.steps.length - validSteps.length;
    stats.stepsKept += validSteps.length;

    // 3. Extract pitch
    const pitch = extractPitchFromDescription(cleanedDesc);
    if (pitch.min !== null || pitch.max !== null) {
      stats.pitchExtracted++;
    }

    // 4. Extract standards
    const standards = extractStandardsFromDescription(cleanedDesc);
    stats.standardsLinked += standards.length;

    // 5. Determine warnings
    const warnings = determineWarningConditions({ ...detail, description: cleanedDesc });
    for (const w of warnings) {
      warningsToAdd.push({
        detailCode: detail.code,
        ...w,
      });
    }
    stats.warningsAdded += warnings.length;

    enhanced.push({
      ...detail,
      description: cleanedDesc,
      steps: validSteps.map((s, i) => ({ ...s, step: i + 1 })),
      min_pitch: pitch.min ?? detail.min_pitch,
      max_pitch: pitch.max ?? detail.max_pitch,
      standards_refs: standards.length > 0 ? standards : detail.standards_refs,
    });
  }

  // Save enhanced details
  const outputPath = path.join(process.cwd(), 'mrm_extract', 'details_enhanced.json');
  fs.writeFileSync(outputPath, JSON.stringify(enhanced, null, 2));
  console.log(`✅ Saved enhanced details to: ${outputPath}`);

  // Save warnings
  const warningsPath = path.join(process.cwd(), 'mrm_extract', 'warnings_enhanced.json');
  fs.writeFileSync(warningsPath, JSON.stringify(warningsToAdd, null, 2));
  console.log(`✅ Saved enhanced warnings to: ${warningsPath}`);

  // Print stats
  console.log('\n' + '='.repeat(60));
  console.log(' Enhancement Statistics');
  console.log('='.repeat(60));
  console.log(`\n   Descriptions cleaned: ${stats.descriptionsCleanged}`);
  console.log(`   Steps removed (garbage): ${stats.stepsRemoved}`);
  console.log(`   Steps kept (valid): ${stats.stepsKept}`);
  console.log(`   Pitch extracted: ${stats.pitchExtracted}`);
  console.log(`   Standards linked: ${stats.standardsLinked}`);
  console.log(`   Warnings generated: ${stats.warningsAdded}`);

  // Sample output
  console.log('\n' + '='.repeat(60));
  console.log(' Sample Enhanced Detail');
  console.log('='.repeat(60));
  const sample = enhanced.find(d => d.category === 'flashings') || enhanced[0];
  console.log(`\n   Code: ${sample.code}`);
  console.log(`   Name: ${sample.name}`);
  console.log(`   Category: ${sample.category}`);
  console.log(`   Steps: ${sample.steps.length}`);
  console.log(`   Pitch: ${sample.min_pitch || 'N/A'} - ${sample.max_pitch || 'N/A'}`);
  console.log(`   Standards: ${sample.standards_refs.length}`);
  console.log(`   Description preview: ${sample.description.substring(0, 200)}...`);

  console.log('\n✅ Enhancement complete!\n');
}

enhanceMrmData().catch(console.error);
