import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { failureCases } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';

// GET - Get latest 5 failure cases
export async function GET() {
  try {
    const latestCases = await db
      .select({
        id: failureCases.id,
        caseId: failureCases.caseId,
        summary: failureCases.summary,
        failureType: failureCases.failureType,
        outcome: failureCases.outcome,
        decisionDate: failureCases.decisionDate,
        substrateTags: failureCases.substrateTags,
        nzbcClauses: failureCases.nzbcClauses,
        createdAt: failureCases.createdAt,
      })
      .from(failureCases)
      .orderBy(desc(failureCases.decisionDate), desc(failureCases.createdAt))
      .limit(5);

    return NextResponse.json({
      success: true,
      data: latestCases.map((fc) => ({
        id: fc.id,
        caseId: fc.caseId,
        summary: fc.summary,
        failureType: fc.failureType,
        outcome: fc.outcome,
        decisionDate: fc.decisionDate,
        substrateTags: fc.substrateTags,
        nzbcClauses: fc.nzbcClauses,
      })),
      count: latestCases.length,
    });
  } catch (error) {
    console.error('Error fetching latest failure cases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch latest failure cases' },
      { status: 500 }
    );
  }
}
