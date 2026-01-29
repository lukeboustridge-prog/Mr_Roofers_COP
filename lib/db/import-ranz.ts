/**
 * RANZ Roofing Guide Data Import Script
 *
 * Imports step-by-step installation guides from roofguide.co.nz
 * with 3D model stage synchronization data.
 *
 * Usage: npx tsx lib/db/import-ranz.ts
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { db } from './index';
import { details, detailSteps, contentSources, categories } from './schema';
import { eq } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

// Types for RANZ stories data
interface RanzLabel {
  m: string;      // Marker letter (a, b, c...)
  c: string;      // Short text
  C: string;      // Full text
  p: { x: number; y: number; z: number };  // 3D position
  n: { x: number; y: number; z: number };  // Normal vector
  f: boolean;     // Featured flag
  u: string;      // UUID
}

interface RanzAction {
  c: string;      // Layer name(s)
  o?: string[];   // Layers to operate on
  u: string;      // UUID
  p?: string;     // Operation type (reveal, etc.)
  d?: number;     // Delay
  y?: string;     // Type (delay, etc.)
}

interface RanzViewport {
  l: [number, number, number];  // Camera location [x, y, z]
  c: [number, number, number];  // Camera target [x, y, z]
  a: boolean;                   // Auto-focus flag
}

interface RanzStage {
  l: RanzLabel[];    // Labels (instructions)
  a: RanzAction[];   // Actions (layer visibility)
  v: RanzViewport | Record<string, never>;  // Viewport (camera)
  j: string;         // Notes
  c?: string;        // Stage title
  t?: string;        // Stage title (alternate)
  p?: string;        // Procedure notes (HTML)
  b?: string;        // Base notes
}

interface RanzGuide {
  c: string;         // Title
  r: string;         // Reference code (F01, C02, etc.)
  s: RanzStage[];    // Stages array
}

interface RanzStoriesData {
  [key: string]: RanzGuide[];
}

// Category mapping based on guide key prefix
const CATEGORY_MAP: Record<string, { categoryId: string; substrateId: string; categoryName: string }> = {
  'grf': { categoryId: 'ranz-flashings', substrateId: 'long-run-metal', categoryName: 'Flashings' },
  'gpc': { categoryId: 'ranz-penetrations-corrugated', substrateId: 'long-run-metal', categoryName: 'Penetrations (Corrugated)' },
  'gpr': { categoryId: 'ranz-penetrations-rib', substrateId: 'long-run-metal', categoryName: 'Penetrations (Rib)' },
  'gch': { categoryId: 'ranz-cladding-horizontal', substrateId: 'long-run-metal', categoryName: 'Cladding (Horizontal)' },
  'gcv': { categoryId: 'ranz-cladding-vertical', substrateId: 'long-run-metal', categoryName: 'Cladding (Vertical)' },
};

// Get category info from guide key
function getCategoryInfo(guideKey: string) {
  const prefix = guideKey.substring(0, 3);
  return CATEGORY_MAP[prefix] || { categoryId: 'ranz-other', substrateId: 'long-run-metal', categoryName: 'Other' };
}

// Clean HTML entities and tags from text
function cleanText(text: string | null | undefined): string {
  if (!text || typeof text !== 'string') {
    return '';
  }
  return text
    .replace(/&deg;/g, '°')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&empty;/g, 'ø')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .trim();
}

// Transform RANZ stage to our step format
function transformStageToStep(
  stage: RanzStage,
  stageIndex: number,
  detailId: string
): {
  id: string;
  detailId: string;
  stepNumber: number;
  instruction: string;
  cautionNote: string | null;
  stageMetadata: {
    camera: RanzViewport | null;
    actions: RanzAction[];
    labels: Array<{
      marker: string;
      text: string;
      position: { x: number; y: number; z: number };
    }>;
  };
} {
  // Combine all label texts into instruction
  const instructions = stage.l
    .filter(label => label.c && label.c !== '...enter text here...')
    .map(label => {
      const marker = label.m ? `(${label.m}) ` : '';
      return marker + cleanText(label.C || label.c);
    });

  const instruction = instructions.join('\n\n') || `Stage ${stageIndex + 1}`;

  // Extract any caution notes from procedure notes
  let cautionNote: string | null = null;
  if (stage.p) {
    const cleanedNotes = cleanText(stage.p);
    if (cleanedNotes.toLowerCase().includes('note:') || cleanedNotes.toLowerCase().includes('caution')) {
      cautionNote = cleanedNotes;
    }
  }

  // Build stage metadata for 3D sync
  // Check if viewport has camera data (l property = camera location)
  const hasValidCamera = stage.v && 'l' in stage.v && Array.isArray((stage.v as RanzViewport).l);
  const stageMetadata = {
    camera: hasValidCamera ? (stage.v as RanzViewport) : null,
    actions: stage.a || [],
    labels: stage.l
      .filter(label => label.c && label.c !== '...enter text here...')
      .map(label => ({
        marker: label.m,
        text: cleanText(label.c),
        position: label.p,
      })),
  };

  return {
    id: `${detailId}-step-${stageIndex + 1}`,
    detailId,
    stepNumber: stageIndex + 1,
    instruction,
    cautionNote,
    stageMetadata,
  };
}

// Check if guide is valid (not test data)
function isValidGuide(key: string, guide: RanzGuide): boolean {
  // Skip test/placeholder entries
  if (key.startsWith('ahaha') || key.startsWith('test')) return false;
  if (guide.c === '[New Story]') return false;
  if (!guide.r || guide.r.trim() === '') return false;

  // Must have at least one stage with real content
  const hasRealContent = guide.s.some(stage =>
    stage.l.some(label =>
      label.c &&
      label.c !== '...enter text here...' &&
      label.c.length > 3
    )
  );

  return hasRealContent;
}

// Main import function
async function importRanzData() {
  console.log('='.repeat(60));
  console.log(' RANZ Roofing Guide Import');
  console.log('='.repeat(60));

  // Load stories data
  const storiesPath = path.join(__dirname, '../../ranz_extract/ranz_stories.json');

  if (!fs.existsSync(storiesPath)) {
    console.error('ERROR: ranz_stories.json not found at', storiesPath);
    console.error('Please download from roofguide.co.nz first.');
    process.exit(1);
  }

  console.log('\n📂 Loading ranz_stories.json...');
  const storiesData: RanzStoriesData = JSON.parse(fs.readFileSync(storiesPath, 'utf-8'));

  const guideKeys = Object.keys(storiesData);
  console.log(`   Found ${guideKeys.length} total entries`);

  // Filter valid guides
  const validGuides: Array<{ key: string; guide: RanzGuide }> = [];
  for (const key of guideKeys) {
    const guideArray = storiesData[key];
    if (guideArray && guideArray.length > 0 && isValidGuide(key, guideArray[0])) {
      validGuides.push({ key, guide: guideArray[0] });
    }
  }

  console.log(`   Valid guides: ${validGuides.length}`);

  // Ensure RANZ source exists
  console.log('\n📝 Ensuring RANZ content source exists...');
  const existingSource = await db.select().from(contentSources).where(eq(contentSources.id, 'ranz-guide'));

  if (existingSource.length === 0) {
    await db.insert(contentSources).values({
      id: 'ranz-guide',
      name: 'RANZ Roofing Guide',
      shortName: 'RANZ Guide',
      description: 'Interactive 3D installation guides from the Roofing Association of New Zealand',
      websiteUrl: 'https://www.roofguide.co.nz',
      sortOrder: 2,
    });
    console.log('   Created RANZ content source');
  } else {
    console.log('   RANZ content source already exists');
  }

  // Ensure RANZ categories exist
  console.log('\n📁 Ensuring RANZ categories exist...');

  const ranzCategories = [
    { id: 'ranz-flashings', name: 'Flashings', description: 'RANZ Guide: Roofing flashings and edge details', sortOrder: 1 },
    { id: 'ranz-penetrations-corrugated', name: 'Penetrations (Corrugated)', description: 'RANZ Guide: Penetrations for corrugated roofing', sortOrder: 2 },
    { id: 'ranz-penetrations-rib', name: 'Penetrations (Rib)', description: 'RANZ Guide: Penetrations for rib profile roofing', sortOrder: 3 },
    { id: 'ranz-cladding-horizontal', name: 'Cladding (Horizontal)', description: 'RANZ Guide: Horizontal wall cladding details', sortOrder: 4 },
    { id: 'ranz-cladding-vertical', name: 'Cladding (Vertical)', description: 'RANZ Guide: Vertical wall cladding details', sortOrder: 5 },
  ];

  for (const cat of ranzCategories) {
    const existing = await db.select().from(categories).where(eq(categories.id, cat.id));
    if (existing.length === 0) {
      await db.insert(categories).values({
        id: cat.id,
        substrateId: 'long-run-metal',
        name: cat.name,
        description: cat.description,
        sortOrder: cat.sortOrder,
        sourceId: 'ranz-guide',
      });
      console.log(`   Created category: ${cat.name}`);
    } else {
      console.log(`   Category exists: ${cat.name}`);
    }
  }

  // Track statistics
  const stats = {
    detailsCreated: 0,
    detailsUpdated: 0,
    stepsCreated: 0,
    errors: 0,
  };

  // Process each guide
  console.log('\n🔄 Processing guides...\n');

  for (const { key, guide } of validGuides) {
    try {
      const rawCode = guide.r.trim();
      // Prefix code to avoid conflicts with MRM codes (both use F01, F02, etc.)
      const code = `RANZ-${rawCode}`;
      const title = cleanText(guide.c);
      const categoryInfo = getCategoryInfo(key);

      // Generate detail ID
      const detailId = `ranz-${rawCode.toLowerCase()}`;

      // Check for GLB model - use R2 CDN URL for production
      const modelFileName = `${key}.glb`;
      const modelPath = path.join(__dirname, '../../public/models', modelFileName);
      const hasModel = fs.existsSync(modelPath);
      const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://pub-5f4c0432c70b4389a92d23c5a0047e17.r2.dev';
      const modelUrl = hasModel ? `${R2_PUBLIC_URL}/models/${modelFileName}` : null;

      console.log(`   ${code}: ${title.substring(0, 40)}...`);
      console.log(`      Key: ${key}, Model: ${hasModel ? '✓' : '✗'}, Stages: ${guide.s.length}`);

      // Check if detail already exists
      const existing = await db.select().from(details).where(eq(details.id, detailId));

      // Transform stages to steps
      const steps = guide.s
        .map((stage, index) => transformStageToStep(stage, index, detailId))
        .filter(step => step.instruction.length > 10); // Filter empty stages

      // Build stage metadata JSON for the detail (saved to separate file at end)
      const _stageMetadataArray = steps.map(step => step.stageMetadata);
      void _stageMetadataArray; // Used indirectly via steps

      if (existing.length === 0) {
        // Create new detail
        await db.insert(details).values({
          id: detailId,
          code: code,
          name: title,
          description: `RANZ Roofing Guide: ${title}. Interactive 3D installation guide with ${steps.length} stages.`,
          sourceId: 'ranz-guide',
          substrateId: categoryInfo.substrateId,
          categoryId: categoryInfo.categoryId,
          modelUrl: modelUrl,
          specifications: {
            guideKey: key,
            stageCount: guide.s.length,
            hasInteractive3D: true,
            source: 'roofguide.co.nz',
          },
          // Store stage metadata for 3D synchronization
          ventilationReqs: [], // Will be populated if applicable
          standardsRefs: [],
        });
        stats.detailsCreated++;
      } else {
        // Update existing detail
        await db.update(details)
          .set({
            modelUrl: modelUrl,
            specifications: {
              guideKey: key,
              stageCount: guide.s.length,
              hasInteractive3D: true,
              source: 'roofguide.co.nz',
            },
          })
          .where(eq(details.id, detailId));
        stats.detailsUpdated++;
      }

      // Delete existing steps for this detail
      await db.delete(detailSteps).where(eq(detailSteps.detailId, detailId));

      // Insert new steps
      if (steps.length > 0) {
        for (const step of steps) {
          await db.insert(detailSteps).values({
            id: step.id,
            detailId: step.detailId,
            stepNumber: step.stepNumber,
            instruction: step.instruction,
            cautionNote: step.cautionNote,
            // Note: stageMetadata would go here if we add the column
          });
          stats.stepsCreated++;
        }
      }

    } catch (error) {
      console.error(`   ❌ Error processing ${key}:`, error);
      stats.errors++;
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log(' Import Complete');
  console.log('='.repeat(60));
  console.log(`\n   Details created: ${stats.detailsCreated}`);
  console.log(`   Details updated: ${stats.detailsUpdated}`);
  console.log(`   Steps created:   ${stats.stepsCreated}`);
  console.log(`   Errors:          ${stats.errors}`);

  // Save stage metadata to separate file for 3D sync
  console.log('\n📄 Saving stage metadata for 3D synchronization...');
  const metadataOutput: Record<string, unknown> = {};

  for (const { key, guide } of validGuides) {
    const code = guide.r.trim();
    const detailId = `ranz-${code.toLowerCase()}`;

    metadataOutput[detailId] = {
      guideKey: key,
      code: code,
      title: cleanText(guide.c),
      modelFile: `${key}.glb`,
      stages: guide.s.map((stage, index) => ({
        number: index + 1,
        camera: stage.v && 'l' in stage.v ? {
          position: stage.v.l,
          target: stage.v.c,
        } : null,
        actions: stage.a.map(action => ({
          layers: action.c,
          operation: action.p || 'show',
        })),
        labels: stage.l
          .filter(l => l.c && l.c !== '...enter text here...')
          .map(l => ({
            marker: l.m,
            text: cleanText(l.c),
            position: l.p,
          })),
      })),
    };
  }

  const metadataPath = path.join(__dirname, '../../ranz_extract/stage_metadata.json');
  fs.writeFileSync(metadataPath, JSON.stringify(metadataOutput, null, 2));
  console.log(`   Saved to: ${metadataPath}`);

  console.log('\n✅ Import complete!\n');
}

// Run import
importRanzData().catch(console.error);
