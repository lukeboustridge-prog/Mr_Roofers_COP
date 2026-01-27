import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import {
  substrates,
  categories,
  details,
  detailSteps,
  warningConditions,
  failureCases,
  detailFailureLinks,
} from '@/lib/db/schema';
import { asc } from 'drizzle-orm';

async function isAdmin(): Promise<boolean> {
  const user = await currentUser();
  if (!user) return false;
  const role = user.publicMetadata?.role as string | undefined;
  return role === 'admin';
}

// GET - Export data
export async function GET(request: NextRequest) {
  try {
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const includes = searchParams.getAll('include');

    // Default to all if none specified
    const includeItems = includes.length > 0
      ? includes
      : ['substrates', 'categories', 'details', 'steps', 'warnings', 'failures', 'links'];

    const exportData: Record<string, unknown> = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
    };

    if (includeItems.includes('substrates')) {
      exportData.substrates = await db
        .select()
        .from(substrates)
        .orderBy(asc(substrates.sortOrder));
    }

    if (includeItems.includes('categories')) {
      exportData.categories = await db
        .select()
        .from(categories)
        .orderBy(asc(categories.sortOrder));
    }

    if (includeItems.includes('details')) {
      exportData.details = await db
        .select()
        .from(details)
        .orderBy(asc(details.code));
    }

    if (includeItems.includes('steps')) {
      exportData.steps = await db
        .select()
        .from(detailSteps)
        .orderBy(asc(detailSteps.detailId), asc(detailSteps.stepNumber));
    }

    if (includeItems.includes('warnings')) {
      exportData.warnings = await db.select().from(warningConditions);
    }

    if (includeItems.includes('failures')) {
      exportData.failures = await db.select().from(failureCases);
    }

    if (includeItems.includes('links')) {
      exportData.links = await db.select().from(detailFailureLinks);
    }

    return NextResponse.json(exportData);
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}
