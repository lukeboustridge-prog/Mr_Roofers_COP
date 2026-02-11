/**
 * Enhance generic case law summaries with meaningful descriptions.
 *
 * Replaces placeholder summaries like "MBIE Determination XXXX - Roofing related
 * building code compliance matter." with descriptions that include the failure type,
 * outcome, and NZBC clauses.
 *
 * Usage: npx tsx scripts/enhance-case-summaries.ts
 */

import { db } from '@/lib/db';
import { failureCases, detailFailureLinks, details } from '@/lib/db/schema';
import { eq, sql, like, or } from 'drizzle-orm';

const GENERIC_PATTERNS = [
  'Roofing related building code compliance matter',
  'roofing related building code compliance matter',
  'No summary available',
];

const FAILURE_DESCRIPTIONS: Record<string, string> = {
  'water-ingress': 'water ingress through the roofing system',
  structural: 'structural failure or inadequacy in the roof framing or cladding',
  'design-error': 'design errors in the roofing specification or detailing',
  workmanship: 'poor workmanship during roof installation',
  durability: 'premature deterioration or durability failure of roofing materials',
};

const OUTCOME_PHRASES: Record<string, string> = {
  upheld: 'The complaint was upheld',
  'partially-upheld': 'The complaint was partially upheld',
  dismissed: 'The complaint was dismissed',
  'not-upheld': 'The complaint was not upheld',
};

const CLAUSE_DESCRIPTIONS: Record<string, string> = {
  E2: 'External Moisture (E2)',
  E1: 'Surface Water (E1)',
  E3: 'Internal Moisture (E3)',
  B1: 'Structure (B1)',
  B2: 'Durability (B2)',
};

async function enhanceSummaries() {
  console.log('Fetching cases with generic summaries...');

  const allCases = await db.select().from(failureCases);

  const genericCases = allCases.filter((c) => {
    if (!c.summary) return true;
    return GENERIC_PATTERNS.some((p) => c.summary!.includes(p));
  });

  console.log(`Found ${genericCases.length} cases with generic/empty summaries out of ${allCases.length} total.`);

  if (genericCases.length === 0) {
    console.log('No cases need enhancement.');
    return;
  }

  let updated = 0;

  for (const caseRecord of genericCases) {
    // Get linked detail names for context
    const linkedDetails = await db
      .select({ name: details.name, code: details.code })
      .from(detailFailureLinks)
      .innerJoin(details, eq(detailFailureLinks.detailId, details.id))
      .where(eq(detailFailureLinks.failureCaseId, caseRecord.id));

    const detailNames = linkedDetails.map((d) => d.name).slice(0, 3);
    const clauses = (caseRecord.nzbcClauses as string[] | null) || [];
    const substrates = (caseRecord.substrateTags as string[] | null) || [];

    // Build meaningful summary
    const parts: string[] = [];

    // Type prefix
    const typeLabel = caseRecord.caseType === 'determination'
      ? `MBIE Determination ${caseRecord.caseId}`
      : `LBP Complaint ${caseRecord.caseId}`;

    // Failure description
    const failureDesc = caseRecord.failureType
      ? FAILURE_DESCRIPTIONS[caseRecord.failureType] || caseRecord.failureType
      : 'building code non-compliance';

    parts.push(`${typeLabel} concerning ${failureDesc}`);

    // Substrate context
    if (substrates.length > 0) {
      parts.push(`on ${substrates.join('/')} roofing`);
    }

    // Detail context
    if (detailNames.length > 0) {
      parts.push(`relating to ${detailNames.join(', ')}`);
    }

    // NZBC clauses
    if (clauses.length > 0) {
      const clauseDescs = clauses
        .map((c) => CLAUSE_DESCRIPTIONS[c] || c)
        .join(', ');
      parts.push(`under NZBC ${clauseDescs}`);
    }

    // Outcome
    if (caseRecord.outcome) {
      const outcomePhrase = OUTCOME_PHRASES[caseRecord.outcome] || `Outcome: ${caseRecord.outcome}`;
      parts.push(outcomePhrase);
    }

    const newSummary = parts.join('. ') + '.';

    await db
      .update(failureCases)
      .set({ summary: newSummary })
      .where(eq(failureCases.id, caseRecord.id));

    updated++;
    console.log(`  Updated: ${caseRecord.caseId} → ${newSummary.substring(0, 80)}...`);
  }

  console.log(`\nDone. Enhanced ${updated} case summaries.`);
}

enhanceSummaries().catch(console.error);
