import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { details, detailLinks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { compareTwoStrings } from 'string-similarity';

export const dynamic = 'force-dynamic';

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

async function isAdmin(): Promise<boolean> {
  const user = await currentUser();
  if (!user) return false;
  const role = user.publicMetadata?.role as string | undefined;
  return role === 'admin';
}

/**
 * Normalize a code for comparison
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
 */
function extractCodePrefix(code: string): string {
  const match = normalizeCode(code).match(/^([A-Z]+)/);
  return match ? match[1] : '';
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
  const normMrmName = mrmName.toLowerCase().replace(/\b(the|a|an|of|to|and|for|with|in|on)\b/g, '').trim();
  const normRanzName = ranzName.toLowerCase().replace(/\b(the|a|an|of|to|and|for|with|in|on)\b/g, '').trim();
  const nameScore = compareTwoStrings(normMrmName, normRanzName);

  if (nameScore >= 0.6) {
    return { confidence: 'related', score: nameScore, reason: 'name similarity' };
  }

  // Also check if same code prefix family with moderate code similarity
  if (mrmPrefix === ranzPrefix && codeScore >= 0.5) {
    return { confidence: 'related', score: codeScore, reason: `${mrmPrefix} family code similarity` };
  }

  return { confidence: null, score: 0, reason: '' };
}

// GET - Generate link suggestions
export async function GET(request: NextRequest) {
  try {
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Parse minConfidence from query params
    const searchParams = request.nextUrl.searchParams;
    const minConfidenceParam = searchParams.get('minConfidence') as MatchConfidence | null;
    const minConfidence: MatchConfidence =
      minConfidenceParam && ['exact', 'partial', 'related'].includes(minConfidenceParam)
        ? minConfidenceParam
        : 'partial'; // Default to partial (excludes 'related')

    // Fetch MRM details
    const mrmDetails = await db
      .select({
        id: details.id,
        code: details.code,
        name: details.name,
      })
      .from(details)
      .where(eq(details.sourceId, 'mrm-cop'));

    // Fetch RANZ details
    const ranzDetails = await db
      .select({
        id: details.id,
        code: details.code,
        name: details.name,
        modelUrl: details.modelUrl,
      })
      .from(details)
      .where(eq(details.sourceId, 'ranz-guide'));

    // Get existing links to exclude
    const existingLinks = await db
      .select({
        primaryDetailId: detailLinks.primaryDetailId,
        supplementaryDetailId: detailLinks.supplementaryDetailId,
      })
      .from(detailLinks);

    const existingPairs = new Set(
      existingLinks.map(l => `${l.primaryDetailId}:${l.supplementaryDetailId}`)
    );

    // Confidence thresholds
    const confidenceThresholds: Record<MatchConfidence, number> = {
      exact: 3,
      partial: 2,
      related: 1,
    };
    const minThreshold = confidenceThresholds[minConfidence];

    // Generate suggestions
    const suggestions: LinkSuggestion[] = [];

    for (const mrm of mrmDetails) {
      for (const ranz of ranzDetails) {
        // Skip if link already exists
        const pairKey = `${mrm.id}:${ranz.id}`;
        if (existingPairs.has(pairKey)) {
          continue;
        }

        // Compute match
        const { confidence, score, reason } = computeMatch(mrm.code, mrm.name, ranz.code, ranz.name);
        if (!confidence) continue;

        // Check minimum confidence threshold
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

    // Sort by confidence (exact > partial > related), then by score
    suggestions.sort((a, b) => {
      const confOrder = confidenceThresholds[b.confidence] - confidenceThresholds[a.confidence];
      if (confOrder !== 0) return confOrder;
      return b.score - a.score;
    });

    // Group by confidence for summary
    const summary = {
      exact: suggestions.filter(s => s.confidence === 'exact').length,
      partial: suggestions.filter(s => s.confidence === 'partial').length,
      related: suggestions.filter(s => s.confidence === 'related').length,
      total: suggestions.length,
    };

    return NextResponse.json({
      data: suggestions,
      summary,
      minConfidence,
    });
  } catch (error) {
    console.error('Error generating suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}
