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
  images: string[] | null;
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
      images: details.images,
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

  // Fetch supplements and supplementsTo in parallel
  const [supplements, supplementsTo] = await Promise.all([
    db.select({
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
      .where(eq(detailLinks.primaryDetailId, detailId)),
    db.select({
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
      .where(eq(detailLinks.supplementaryDetailId, detailId)),
  ]);

  // Fetch all supplement steps in one query instead of N+1
  const supplementIds = supplements.map(s => s.id);
  const allSupplementSteps = supplementIds.length > 0
    ? await db
        .select({
          id: detailSteps.id,
          detailId: detailSteps.detailId,
          stepNumber: detailSteps.stepNumber,
          instruction: detailSteps.instruction,
          imageUrl: detailSteps.imageUrl,
          cautionNote: detailSteps.cautionNote,
        })
        .from(detailSteps)
        .where(or(...supplementIds.map(id => eq(detailSteps.detailId, id))))
        .orderBy(detailSteps.stepNumber)
    : [];

  // Group steps by detail ID
  const stepsByDetailId = new Map<string, typeof allSupplementSteps>();
  for (const step of allSupplementSteps) {
    const existing = stepsByDetailId.get(step.detailId!) || [];
    existing.push(step);
    stepsByDetailId.set(step.detailId!, existing);
  }

  const supplementsWithSteps = supplements.map(linked => ({
    ...linked,
    steps: stepsByDetailId.get(linked.id) || undefined,
  }));

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

/**
 * Get a single link by ID
 */
export async function getDetailLinkById(linkId: string): Promise<DetailLink | null> {
  const [link] = await db
    .select()
    .from(detailLinks)
    .where(eq(detailLinks.id, linkId))
    .limit(1);

  return link ? (link as unknown as DetailLink) : null;
}

/**
 * Get all links with primary and supplementary detail info
 */
export async function getAllLinks(): Promise<Array<{
  id: string;
  primaryDetailId: string;
  primaryCode: string;
  primaryName: string;
  primarySourceId: string | null;
  supplementaryDetailId: string;
  supplementaryCode: string;
  supplementaryName: string;
  supplementarySourceId: string | null;
  linkType: LinkType;
  matchConfidence: MatchConfidence | null;
  notes: string | null;
  createdAt: Date;
}>> {
  // Need to join details twice - once for primary, once for supplementary
  // Using raw SQL alias approach since Drizzle doesn't support aliased self-joins well

  // First get all links
  const links = await db.select().from(detailLinks);

  // Then get all detail info we need
  const detailIds = new Set<string>();
  for (const link of links) {
    detailIds.add(link.primaryDetailId);
    detailIds.add(link.supplementaryDetailId);
  }

  const allDetails = await db
    .select({
      id: details.id,
      code: details.code,
      name: details.name,
      sourceId: details.sourceId,
    })
    .from(details);

  const detailMap = new Map(allDetails.map(d => [d.id, d]));

  return links.map(link => {
    const primary = detailMap.get(link.primaryDetailId);
    const supplementary = detailMap.get(link.supplementaryDetailId);

    return {
      id: link.id,
      primaryDetailId: link.primaryDetailId,
      primaryCode: primary?.code ?? 'Unknown',
      primaryName: primary?.name ?? 'Unknown',
      primarySourceId: primary?.sourceId ?? null,
      supplementaryDetailId: link.supplementaryDetailId,
      supplementaryCode: supplementary?.code ?? 'Unknown',
      supplementaryName: supplementary?.name ?? 'Unknown',
      supplementarySourceId: supplementary?.sourceId ?? null,
      linkType: link.linkType as LinkType,
      matchConfidence: link.matchConfidence as MatchConfidence | null,
      notes: link.notes,
      createdAt: link.createdAt!,
    };
  }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * Update a link
 */
export async function updateDetailLink(
  linkId: string,
  data: { linkType?: LinkType; matchConfidence?: MatchConfidence; notes?: string }
): Promise<DetailLink | null> {
  const updateData: Partial<typeof detailLinks.$inferInsert> = {};

  if (data.linkType !== undefined) {
    updateData.linkType = data.linkType;
  }
  if (data.matchConfidence !== undefined) {
    updateData.matchConfidence = data.matchConfidence;
  }
  if (data.notes !== undefined) {
    updateData.notes = data.notes;
  }

  if (Object.keys(updateData).length === 0) {
    // No updates to make
    return getDetailLinkById(linkId);
  }

  const [updated] = await db
    .update(detailLinks)
    .set(updateData)
    .where(eq(detailLinks.id, linkId))
    .returning();

  return updated ? (updated as unknown as DetailLink) : null;
}
