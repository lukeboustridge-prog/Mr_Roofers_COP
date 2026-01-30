import { config } from 'dotenv';
config({ path: '.env.local' });

import { db } from '../lib/db';
import { failureCases, details, detailFailureLinks } from '../lib/db/schema';
import { eq, like, or, ilike } from 'drizzle-orm';

// Keywords to match case law to detail categories
const KEYWORD_MAPPINGS: Record<string, string[]> = {
  // Flashing-related keywords
  'flashings': ['flashing', 'apron', 'barge', 'ridge', 'valley', 'parapet', 'abutment', 'junction'],
  // Penetration-related keywords
  'penetrations': ['penetration', 'pipe', 'vent', 'boot', 'chimney', 'skylight', 'antenna'],
  // Drainage-related keywords
  'drainage': ['gutter', 'downpipe', 'drain', 'overflow', 'spreader', 'sumps', 'rainwater'],
  // Cladding/roofing general
  'cladding': ['cladding', 'roofing', 'corrugated', 'profiled', 'metal', 'membrane', 'tile'],
  // Durability/corrosion
  'durability': ['corrosion', 'rust', 'durability', 'coating', 'galvanized', 'zinc'],
  // Ventilation
  'ventilation': ['ventilation', 'condensation', 'moisture', 'airflow', 'underlay'],
  // Fasteners
  'fasteners': ['fastener', 'screw', 'fixing', 'nail', 'washer', 'sealant'],
  // Weathertightness
  'weathertightness': ['leak', 'water ingress', 'weathertight', 'weather-tight', 'moisture'],
};

// Building code clause mappings
const NZBC_DETAIL_MAPPINGS: Record<string, string[]> = {
  'E2': ['flashings', 'penetrations', 'cladding', 'weathertightness'],
  'E1': ['drainage'],
  'B2': ['durability', 'fasteners'],
  'E3': ['ventilation'],
};

interface CaseLaw {
  id: string;
  caseId: string;
  summary: string | null;
  failureType: string | null;
  nzbcClauses: string[] | null;
  substrateTags: string[] | null;
}

interface Detail {
  id: string;
  code: string;
  name: string;
  categoryId: string | null;
  substrateId: string | null;
  description: string | null;
}

function findMatchingKeywords(text: string): string[] {
  const lowerText = text.toLowerCase();
  const matches: string[] = [];

  for (const [category, keywords] of Object.entries(KEYWORD_MAPPINGS)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        matches.push(category);
        break; // Only add category once
      }
    }
  }

  return matches;
}

function scoreMatch(caseLaw: CaseLaw, detail: Detail): number {
  let score = 0;
  const caseText = `${caseLaw.summary || ''} ${caseLaw.failureType || ''}`.toLowerCase();
  const detailText = `${detail.name} ${detail.description || ''} ${detail.categoryId || ''}`.toLowerCase();

  // Direct keyword matches in both texts
  for (const keywords of Object.values(KEYWORD_MAPPINGS)) {
    for (const keyword of keywords) {
      const kw = keyword.toLowerCase();
      if (caseText.includes(kw) && detailText.includes(kw)) {
        score += 3; // Strong match
      }
    }
  }

  // Category match
  const caseCategories = findMatchingKeywords(caseText);
  if (detail.categoryId && caseCategories.includes(detail.categoryId)) {
    score += 5;
  }

  // Failure type match
  if (caseLaw.failureType) {
    if (caseLaw.failureType === 'water-ingress' &&
        (detailText.includes('flashing') || detailText.includes('valley') ||
         detailText.includes('penetration') || detailText.includes('gutter'))) {
      score += 4;
    }
    if (caseLaw.failureType === 'workmanship' &&
        (detailText.includes('fixing') || detailText.includes('fastener') ||
         detailText.includes('installation'))) {
      score += 3;
    }
    if (caseLaw.failureType === 'durability' &&
        (detailText.includes('corrosion') || detailText.includes('coating') ||
         detailText.includes('material'))) {
      score += 4;
    }
  }

  // Substrate match
  if (caseLaw.substrateTags && detail.substrateId) {
    const substrateTags = caseLaw.substrateTags as string[];
    if (substrateTags.some(tag =>
      detail.substrateId?.toLowerCase().includes(tag.toLowerCase()) ||
      tag.toLowerCase().includes(detail.substrateId?.toLowerCase() || '')
    )) {
      score += 3;
    }
  }

  return score;
}

async function linkCaseLawToDetails() {
  console.log('Linking case law to relevant COP details...\n');

  // Get all case law
  const allCases = await db.select().from(failureCases);
  console.log(`Found ${allCases.length} case law entries\n`);

  // Get all details
  const allDetails = await db.select().from(details);
  console.log(`Found ${allDetails.length} COP details\n`);

  // Clear existing links
  console.log('Clearing existing links...');
  await db.delete(detailFailureLinks);

  let totalLinks = 0;
  const MIN_SCORE = 5; // Minimum score to create a link
  const MAX_LINKS_PER_CASE = 10; // Limit links per case

  for (const caseLaw of allCases) {
    const scores: Array<{ detail: Detail; score: number }> = [];

    // Score each detail
    for (const detail of allDetails) {
      const score = scoreMatch(caseLaw as CaseLaw, detail as Detail);
      if (score >= MIN_SCORE) {
        scores.push({ detail: detail as Detail, score });
      }
    }

    // Sort by score and take top matches
    scores.sort((a, b) => b.score - a.score);
    const topMatches = scores.slice(0, MAX_LINKS_PER_CASE);

    if (topMatches.length > 0) {
      console.log(`\n${caseLaw.caseId} (${caseLaw.failureType || 'unknown type'}):`);

      for (const match of topMatches) {
        try {
          await db.insert(detailFailureLinks).values({
            detailId: match.detail.id,
            failureCaseId: caseLaw.id,
          });
          console.log(`  → ${match.detail.code}: ${match.detail.name} (score: ${match.score})`);
          totalLinks++;
        } catch (error) {
          // Link might already exist
          console.log(`  - ${match.detail.code}: already linked`);
        }
      }
    }
  }

  console.log('\n✅ Linking complete!');
  console.log(`   Total links created: ${totalLinks}`);
  console.log(`   Cases with links: ${allCases.filter(c =>
    allDetails.some(d => scoreMatch(c as CaseLaw, d as Detail) >= MIN_SCORE)
  ).length}`);

  process.exit(0);
}

linkCaseLawToDetails().catch((error) => {
  console.error('Linking failed:', error);
  process.exit(1);
});
