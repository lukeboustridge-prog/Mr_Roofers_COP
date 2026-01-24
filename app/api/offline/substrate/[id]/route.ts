import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { details, substrates, categories, detailFailureLinks } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { substrateIdSchema } from '@/lib/validations';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: rawId } = await params;
    const result = substrateIdSchema.safeParse(rawId);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Valid substrate ID is required' },
        { status: 400 }
      );
    }

    const substrateId = result.data;

    // Fetch substrate info
    const substrate = await db.query.substrates.findFirst({
      where: eq(substrates.id, substrateId),
    });

    if (!substrate) {
      return NextResponse.json(
        { error: 'Substrate not found' },
        { status: 404 }
      );
    }

    // Fetch all details for this substrate with related data
    const substrateDetails = await db.query.details.findMany({
      where: eq(details.substrateId, substrateId),
    });

    // Fetch all categories for this substrate
    const substrateCategories = await db.query.categories.findMany({
      where: eq(categories.substrateId, substrateId),
    });

    // Fetch steps for all details
    const detailIds = substrateDetails.map((d) => d.id);
    const allSteps = detailIds.length > 0
      ? await db.query.detailSteps.findMany({
          where: (steps, { inArray: inArrayFn }) => inArrayFn(steps.detailId, detailIds),
        })
      : [];

    // Fetch warnings for all details
    const allWarnings = detailIds.length > 0
      ? await db.query.warningConditions.findMany({
          where: (warnings, { inArray: inArrayFn }) => inArrayFn(warnings.detailId, detailIds),
        })
      : [];

    // Fetch failure links for all details
    const allFailureLinks = detailIds.length > 0
      ? await db
          .select()
          .from(detailFailureLinks)
          .where(inArray(detailFailureLinks.detailId, detailIds))
      : [];

    // Get unique failure case IDs
    const failureCaseIds = Array.from(new Set(allFailureLinks.map((l) => l.failureCaseId)));

    // Fetch failure cases
    const allFailureCases = failureCaseIds.length > 0
      ? await db.query.failureCases.findMany({
          where: (cases, { inArray: inArrayFn }) => inArrayFn(cases.id, failureCaseIds),
        })
      : [];

    // Combine data for each detail
    const enrichedDetails = substrateDetails.map((detail) => ({
      ...detail,
      steps: allSteps.filter((s) => s.detailId === detail.id),
      warnings: allWarnings.filter((w) => w.detailId === detail.id),
      failureLinks: allFailureLinks.filter((l) => l.detailId === detail.id),
    }));

    return NextResponse.json({
      data: {
        substrate,
        categories: substrateCategories,
        details: enrichedDetails,
        failureCases: allFailureCases,
        cachedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching substrate data for offline:', error);
    return NextResponse.json(
      { error: 'Failed to fetch substrate data' },
      { status: 500 }
    );
  }
}
