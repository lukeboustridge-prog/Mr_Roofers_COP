import { db } from '@/lib/db';
import {
  copSections,
  copSectionDetails,
  copSectionHtg,
  details,
  detailFailureLinks,
  failureCases,
  htgContent,
} from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/** HTG guide content block for inline "Practical Guidance" rendering */
export interface HtgGuidanceBlock {
  id: string;
  guideName: string;
  sourceDocument: string;
  content: string | null;
  pdfPage: number | null;
  relevance: string | null;
}

/** Failure case for inline case law callout rendering */
export interface InlineCaseLaw {
  id: string;
  caseId: string;
  caseType: string;
  summary: string | null;
  outcome: string | null;
  pdfUrl: string | null;
  failureType: string | null;
}

/**
 * Fetches full HTG content text for all COP sections in a given chapter.
 *
 * Query path: copSectionHtg -> copSections (filter by chapterNumber) -> htgContent
 *
 * Returns a Map keyed by section ID (e.g., "cop-8.5.4") where each value
 * is an array of HtgGuidanceBlock with the full text content field.
 *
 * Deduplicates: same HTG guide shown only once per section.
 */
export async function getHtgContentForChapter(
  chapterNumber: number
): Promise<Map<string, HtgGuidanceBlock[]>> {
  const results = await db
    .select({
      sectionId: copSections.id,
      htgId: htgContent.id,
      guideName: htgContent.guideName,
      sourceDocument: htgContent.sourceDocument,
      content: htgContent.content,
      pdfPage: htgContent.pdfPage,
      relevance: copSectionHtg.relevance,
    })
    .from(copSectionHtg)
    .innerJoin(copSections, eq(copSectionHtg.sectionId, copSections.id))
    .innerJoin(htgContent, eq(copSectionHtg.htgId, htgContent.id))
    .where(eq(copSections.chapterNumber, chapterNumber));

  const htgMap = new Map<string, HtgGuidanceBlock[]>();

  for (const row of results) {
    if (!htgMap.has(row.sectionId)) {
      htgMap.set(row.sectionId, []);
    }
    const blocks = htgMap.get(row.sectionId)!;

    // Deduplicate: skip if this HTG guide ID already exists in this section
    if (blocks.some((b) => b.id === row.htgId)) {
      continue;
    }

    blocks.push({
      id: row.htgId,
      guideName: row.guideName,
      sourceDocument: row.sourceDocument,
      content: row.content,
      pdfPage: row.pdfPage,
      relevance: row.relevance,
    });
  }

  return htgMap;
}

/**
 * Fetches failure cases linked to COP sections in a given chapter.
 *
 * Query path: copSections (filter by chapterNumber) -> copSectionDetails ->
 *             details -> detailFailureLinks -> failureCases
 *
 * Returns a Map keyed by section ID (e.g., "cop-8.5.4") where each value
 * is an array of InlineCaseLaw with case summary and outcome.
 *
 * Deduplicates: same failure case shown only once per section even if
 * linked through multiple details.
 */
export async function getFailureCasesForChapter(
  chapterNumber: number
): Promise<Map<string, InlineCaseLaw[]>> {
  const results = await db
    .select({
      sectionId: copSections.id,
      failureCaseId: failureCases.id,
      caseId: failureCases.caseId,
      caseType: failureCases.caseType,
      summary: failureCases.summary,
      outcome: failureCases.outcome,
      pdfUrl: failureCases.pdfUrl,
      failureType: failureCases.failureType,
    })
    .from(copSections)
    .innerJoin(copSectionDetails, eq(copSectionDetails.sectionId, copSections.id))
    .innerJoin(details, eq(copSectionDetails.detailId, details.id))
    .innerJoin(detailFailureLinks, eq(detailFailureLinks.detailId, details.id))
    .innerJoin(failureCases, eq(detailFailureLinks.failureCaseId, failureCases.id))
    .where(eq(copSections.chapterNumber, chapterNumber));

  const caseLawMap = new Map<string, InlineCaseLaw[]>();

  for (const row of results) {
    if (!caseLawMap.has(row.sectionId)) {
      caseLawMap.set(row.sectionId, []);
    }
    const cases = caseLawMap.get(row.sectionId)!;

    // Deduplicate: skip if this failure case ID already exists in this section
    if (cases.some((c) => c.id === row.failureCaseId)) {
      continue;
    }

    cases.push({
      id: row.failureCaseId,
      caseId: row.caseId,
      caseType: row.caseType,
      summary: row.summary,
      outcome: row.outcome,
      pdfUrl: row.pdfUrl,
      failureType: row.failureType,
    });
  }

  return caseLawMap;
}
