/**
 * Auto-suggest detail links based on code similarity
 *
 * Compares MRM detail codes with RANZ detail codes to suggest potential links.
 * Uses string-similarity to compute similarity scores.
 *
 * Matching strategies:
 * 1. Exact code match (after normalizing - stripping RANZ- prefix)
 * 2. Partial code match (similarity >= 0.7 on normalized codes)
 * 3. Related by name similarity (when codes differ but names similar)
 *
 * Usage:
 *   npx tsx scripts/suggest-detail-links.ts --dry-run     # Preview suggestions
 *   npx tsx scripts/suggest-detail-links.ts --apply       # Insert suggested links
 *   npx tsx scripts/suggest-detail-links.ts --min-confidence=exact  # Only exact matches
 *
 * Run: npx tsx scripts/suggest-detail-links.ts
 */

// Load environment variables for standalone script execution
import { config } from 'dotenv';
config({ path: '.env.local' });

import { db } from '@/lib/db';
import { details, detailLinks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { compareTwoStrings } from 'string-similarity';
import { nanoid } from 'nanoid';

type MatchConfidence = 'exact' | 'partial' | 'related';

interface LinkSuggestion {
  mrmDetailId: string;
  mrmCode: string;
  mrmName: string;
  ranzDetailId: string;
  ranzCode: string;
  ranzName: string;
  ranzHasModel: boolean;
  confidence: MatchConfidence;
  score: number;
  matchReason: string;
}

/**
 * Normalize a code for comparison
 * Strips common prefixes like 'RANZ-', 'MRM-' and converts to uppercase
 */
function normalizeCode(code: string): string {
  return code
    .toUpperCase()
    .replace(/^RANZ-/, '')
    .replace(/^MRM-/, '')
    .trim();
}

/**
 * Extract the code category prefix (letter part)
 * e.g., 'V20' -> 'V', 'D03' -> 'D', 'C01' -> 'C'
 */
function extractCodePrefix(code: string): string {
  const match = normalizeCode(code).match(/^([A-Z]+)/);
  return match ? match[1] : '';
}

/**
 * Get existing link pairs to exclude from suggestions
 */
async function getExistingLinkPairs(): Promise<Set<string>> {
  const links = await db
    .select({
      primaryDetailId: detailLinks.primaryDetailId,
      supplementaryDetailId: detailLinks.supplementaryDetailId,
    })
    .from(detailLinks);

  const pairs = new Set<string>();
  for (const link of links) {
    pairs.add(`${link.primaryDetailId}:${link.supplementaryDetailId}`);
  }
  return pairs;
}

/**
 * Compute match score and classify confidence
 */
function computeMatch(
  mrmCode: string,
  mrmName: string,
  ranzCode: string,
  ranzName: string
): { confidence: MatchConfidence | null; score: number; reason: string } {
  const normMrm = normalizeCode(mrmCode);
  const normRanz = normalizeCode(ranzCode);

  // Strategy 1: Exact code match (after normalization)
  if (normMrm === normRanz) {
    return { confidence: 'exact', score: 1.0, reason: 'exact code match' };
  }

  // Strategy 2: High code similarity (same prefix family)
  const mrmPrefix = extractCodePrefix(mrmCode);
  const ranzPrefix = extractCodePrefix(ranzCode);
  const codeScore = compareTwoStrings(normMrm.toLowerCase(), normRanz.toLowerCase());

  if (mrmPrefix === ranzPrefix && codeScore >= 0.7) {
    return { confidence: 'partial', score: codeScore, reason: `code similarity (${mrmPrefix} family)` };
  }

  // Strategy 3: Name-based matching (for related content)
  // Normalize names: lowercase, remove common words, compare
  const normMrmName = mrmName.toLowerCase().replace(/\b(the|a|an|of|to|and|for|with|in|on)\b/g, '').trim();
  const normRanzName = ranzName.toLowerCase().replace(/\b(the|a|an|of|to|and|for|with|in|on)\b/g, '').trim();
  const nameScore = compareTwoStrings(normMrmName, normRanzName);

  // If names are highly similar (>= 0.6), consider them related
  if (nameScore >= 0.6) {
    return { confidence: 'related', score: nameScore, reason: 'name similarity' };
  }

  // Also check if same code prefix family with moderate code similarity
  if (mrmPrefix === ranzPrefix && codeScore >= 0.5) {
    return { confidence: 'related', score: codeScore, reason: `${mrmPrefix} family code similarity` };
  }

  // No match
  return { confidence: null, score: 0, reason: '' };
}

/**
 * Generate link suggestions by comparing MRM and RANZ detail codes
 */
async function generateSuggestions(minConfidence: MatchConfidence = 'related'): Promise<LinkSuggestion[]> {
  console.log('Fetching MRM details...');
  const mrmDetails = await db
    .select({
      id: details.id,
      code: details.code,
      name: details.name,
    })
    .from(details)
    .where(eq(details.sourceId, 'mrm-cop'));

  console.log(`Found ${mrmDetails.length} MRM details`);

  console.log('Fetching RANZ details...');
  const ranzDetails = await db
    .select({
      id: details.id,
      code: details.code,
      name: details.name,
      modelUrl: details.modelUrl,
    })
    .from(details)
    .where(eq(details.sourceId, 'ranz-guide'));

  console.log(`Found ${ranzDetails.length} RANZ details`);

  // Get existing links to exclude
  console.log('Fetching existing links...');
  const existingPairs = await getExistingLinkPairs();
  console.log(`Found ${existingPairs.size} existing link pairs to exclude`);

  // Define confidence threshold for filtering
  const confidenceThresholds: Record<MatchConfidence, number> = {
    exact: 3,
    partial: 2,
    related: 1,
  };
  const minThreshold = confidenceThresholds[minConfidence];

  // Generate suggestions
  console.log('\nComparing code pairs...');
  const suggestions: LinkSuggestion[] = [];
  let compared = 0;
  const totalPairs = mrmDetails.length * ranzDetails.length;

  for (const mrm of mrmDetails) {
    for (const ranz of ranzDetails) {
      compared++;
      if (compared % 5000 === 0) {
        process.stdout.write(`\rCompared ${compared}/${totalPairs} pairs...`);
      }

      // Skip if link already exists
      const pairKey = `${mrm.id}:${ranz.id}`;
      if (existingPairs.has(pairKey)) {
        continue;
      }

      // Compute match
      const { confidence, score, reason } = computeMatch(mrm.code, mrm.name, ranz.code, ranz.name);
      if (!confidence) continue;

      // Check if meets minimum confidence threshold
      const confScore = confidenceThresholds[confidence];
      if (confScore < minThreshold) continue;

      suggestions.push({
        mrmDetailId: mrm.id,
        mrmCode: mrm.code,
        mrmName: mrm.name,
        ranzDetailId: ranz.id,
        ranzCode: ranz.code,
        ranzName: ranz.name,
        ranzHasModel: !!ranz.modelUrl,
        confidence,
        score: Math.round(score * 100) / 100,
        matchReason: reason,
      });
    }
  }

  console.log(`\nGenerated ${suggestions.length} suggestions`);

  // Sort by confidence (exact > partial > related), then by score
  suggestions.sort((a, b) => {
    const confOrder = confidenceThresholds[b.confidence] - confidenceThresholds[a.confidence];
    if (confOrder !== 0) return confOrder;
    return b.score - a.score;
  });

  return suggestions;
}

/**
 * Apply suggestions by inserting links into the database
 */
async function applySuggestions(suggestions: LinkSuggestion[]): Promise<void> {
  console.log(`\nApplying ${suggestions.length} suggestions...`);

  let created = 0;
  let errors = 0;

  for (const suggestion of suggestions) {
    try {
      await db.insert(detailLinks).values({
        id: nanoid(),
        primaryDetailId: suggestion.mrmDetailId,
        supplementaryDetailId: suggestion.ranzDetailId,
        linkType: 'installation_guide', // Default type for auto-suggested links
        matchConfidence: suggestion.confidence,
        notes: `Auto-suggested: ${suggestion.matchReason} (score: ${suggestion.score})`,
      }).onConflictDoNothing();

      created++;
      console.log(`Created: ${suggestion.mrmCode} (MRM) -> ${suggestion.ranzCode} (RANZ) [${suggestion.confidence}] - ${suggestion.matchReason}`);
    } catch (error) {
      errors++;
      console.error(`Failed to create link ${suggestion.mrmCode} -> ${suggestion.ranzCode}:`, error);
    }
  }

  console.log(`\nDone! Created ${created} links, ${errors} errors`);
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const apply = args.includes('--apply');

  // Parse min-confidence flag
  let minConfidence: MatchConfidence = 'related';
  const minConfArg = args.find(a => a.startsWith('--min-confidence='));
  if (minConfArg) {
    const value = minConfArg.split('=')[1] as MatchConfidence;
    if (['exact', 'partial', 'related'].includes(value)) {
      minConfidence = value;
    }
  }

  console.log('=== Detail Link Suggestion Script ===\n');
  console.log(`Mode: ${dryRun ? 'DRY RUN' : apply ? 'APPLY' : 'PREVIEW'}`);
  console.log(`Minimum confidence: ${minConfidence}\n`);

  if (!dryRun && !apply) {
    console.log('Use --dry-run to preview suggestions or --apply to insert links\n');
  }

  const suggestions = await generateSuggestions(minConfidence);

  // Group by confidence for summary
  const byConfidence = {
    exact: suggestions.filter(s => s.confidence === 'exact'),
    partial: suggestions.filter(s => s.confidence === 'partial'),
    related: suggestions.filter(s => s.confidence === 'related'),
  };

  console.log('\n=== Summary ===');
  console.log(`Exact matches:   ${byConfidence.exact.length}`);
  console.log(`Partial matches: ${byConfidence.partial.length}`);
  console.log(`Related matches: ${byConfidence.related.length}`);
  console.log(`Total:           ${suggestions.length}`);

  if (dryRun || (!dryRun && !apply)) {
    // Output suggestions as JSON
    console.log('\n=== Suggestions ===');
    console.log(JSON.stringify(suggestions, null, 2));
  }

  if (apply) {
    await applySuggestions(suggestions);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
