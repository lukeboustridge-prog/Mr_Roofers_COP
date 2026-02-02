import { db } from '@/lib/db';
import { detailLinks, details, contentSources, detailSteps } from '@/lib/db/schema';
import { eq, or } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export type LinkType = 'installation_guide' | 'technical_supplement' | 'alternative';
export type MatchConfidence = 'exact' | 'partial' | 'related';

export interface DetailLink {
  id: string;
  primaryDetailId: string;
  supplementaryDetailId: string;
  linkType: LinkType;
  matchConfidence: MatchConfidence | null;
  notes: string | null;
  createdAt: Date;
}

export interface LinkedDetail {
  id: string;
  code: string;
  name: string;
  description: string | null;
  thumbnailUrl: string | null;
  modelUrl: string | null;
  sourceId: string | null;
  sourceName: string | null;
  linkType: LinkType;
  matchConfidence: MatchConfidence | null;
  steps?: Array<{
    id: string;
    stepNumber: number;
    instruction: string;
    imageUrl?: string | null;
    cautionNote?: string | null;
  }>;
}

export interface DetailWithLinks {
  id: string;
  code: string;
  name: string;
  description: string | null;
  thumbnailUrl: string | null;
  modelUrl: string | null;
  sourceId: string | null;
  categoryId: string | null;
  substrateId: string | null;
  minPitch: number | null;
  maxPitch: number | null;
  specifications: unknown;
  standardsRefs: unknown;
  ventilationReqs: unknown;
  supplements: LinkedDetail[];    // Content this detail links TO (as primary)
  supplementsTo: LinkedDetail[];  // Content that links TO this detail (as supplementary)
}

/**
 * Get detail with all linked content (both directions)
 * Returns MRM detail with linked RANZ guides, or RANZ guide with linked MRM specs
 */
export async function getDetailWithLinks(detailId: string): Promise<DetailWithLinks | null> {
  // Get base detail
  const [detail] = await db
    .select({
      id: details.id,
      code: details.code,
      name: details.name,
      description: details.description,
      thumbnailUrl: details.thumbnailUrl,
      modelUrl: details.modelUrl,
      sourceId: details.sourceId,
      categoryId: details.categoryId,
      substrateId: details.substrateId,
      minPitch: details.minPitch,
      maxPitch: details.maxPitch,
      specifications: details.specifications,
      standardsRefs: details.standardsRefs,
      ventilationReqs: details.ventilationReqs,
    })
    .from(details)
    .where(eq(details.id, detailId))
    .limit(1);

  if (!detail) return null;

  // Get supplementary content (where this detail is primary)
  const supplements = await db
    .select({
      id: details.id,
      code: details.code,
      name: details.name,
      description: details.description,
      thumbnailUrl: details.thumbnailUrl,
      modelUrl: details.modelUrl,
      sourceId: details.sourceId,
      sourceName: contentSources.shortName,
      linkType: detailLinks.linkType,
      matchConfidence: detailLinks.matchConfidence,
    })
    .from(detailLinks)
    .innerJoin(details, eq(detailLinks.supplementaryDetailId, details.id))
    .leftJoin(contentSources, eq(details.sourceId, contentSources.id))
    .where(eq(detailLinks.primaryDetailId, detailId));

  // Fetch steps for each supplement
  const supplementsWithSteps = await Promise.all(
    supplements.map(async (linked) => {
      const steps = await db
        .select({
          id: detailSteps.id,
          stepNumber: detailSteps.stepNumber,
          instruction: detailSteps.instruction,
          imageUrl: detailSteps.imageUrl,
          cautionNote: detailSteps.cautionNote,
        })
        .from(detailSteps)
        .where(eq(detailSteps.detailId, linked.id))
        .orderBy(detailSteps.stepNumber);

      return {
        ...linked,
        steps: steps.length > 0 ? steps : undefined,
      };
    })
  );

  // Get primary content (where this detail is supplementary)
  const supplementsTo = await db
    .select({
      id: details.id,
      code: details.code,
      name: details.name,
      description: details.description,
      thumbnailUrl: details.thumbnailUrl,
      modelUrl: details.modelUrl,
      sourceId: details.sourceId,
      sourceName: contentSources.shortName,
      linkType: detailLinks.linkType,
      matchConfidence: detailLinks.matchConfidence,
    })
    .from(detailLinks)
    .innerJoin(details, eq(detailLinks.primaryDetailId, details.id))
    .leftJoin(contentSources, eq(details.sourceId, contentSources.id))
    .where(eq(detailLinks.supplementaryDetailId, detailId));

  return {
    ...detail,
    supplements: supplementsWithSteps as LinkedDetail[],
    supplementsTo: supplementsTo as LinkedDetail[],
  };
}

/**
 * Create a link between two details
 * Primary = authoritative (typically MRM), Supplementary = enriching (typically RANZ)
 */
export async function createDetailLink(
  primaryDetailId: string,
  supplementaryDetailId: string,
  linkType: LinkType,
  matchConfidence?: MatchConfidence,
  notes?: string
): Promise<DetailLink> {
  const id = nanoid();

  const [link] = await db
    .insert(detailLinks)
    .values({
      id,
      primaryDetailId,
      supplementaryDetailId,
      linkType,
      matchConfidence: matchConfidence ?? null,
      notes: notes ?? null,
    })
    .returning();

  return link as unknown as DetailLink;
}

/**
 * Get all links for a detail (both directions)
 */
export async function getLinksForDetail(detailId: string) {
  return db
    .select()
    .from(detailLinks)
    .where(
      or(
        eq(detailLinks.primaryDetailId, detailId),
        eq(detailLinks.supplementaryDetailId, detailId)
      )
    );
}

/**
 * Delete a link between details
 */
export async function deleteDetailLink(linkId: string) {
  return db
    .delete(detailLinks)
    .where(eq(detailLinks.id, linkId));
}
