import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { StepEditor } from '@/components/admin/StepEditor';
import { db } from '@/lib/db';
import { details, detailSteps } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';

async function getDetail(id: string) {
  const [detail] = await db.select().from(details).where(eq(details.id, id)).limit(1);
  return detail || null;
}

async function getSteps(detailId: string) {
  return db
    .select()
    .from(detailSteps)
    .where(eq(detailSteps.detailId, detailId))
    .orderBy(asc(detailSteps.stepNumber));
}

export default async function StepsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getDetail(id);

  if (!detail) {
    notFound();
  }

  const steps = await getSteps(id);

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <div className="mb-6">
        <Link
          href={`/admin/details/${id}`}
          className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Detail
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">
          Installation Steps: {detail.code}
        </h1>
        <p className="text-slate-600">{detail.name}</p>
      </div>

      <StepEditor detailId={id} initialSteps={steps} />
    </div>
  );
}
