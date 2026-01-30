import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { WarningEditor } from '@/components/admin/WarningEditor';
import { db } from '@/lib/db';
import { details, warningConditions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

async function getDetail(id: string) {
  const [detail] = await db.select().from(details).where(eq(details.id, id)).limit(1);
  return detail || null;
}

async function getWarnings(detailId: string) {
  return db
    .select()
    .from(warningConditions)
    .where(eq(warningConditions.detailId, detailId));
}

export default async function WarningsPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const detail = await getDetail(id);

  if (!detail) {
    notFound();
  }

  const warnings = await getWarnings(id);

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
          Warnings: {detail.code}
        </h1>
        <p className="text-slate-600">{detail.name}</p>
      </div>

      <WarningEditor detailId={id} initialWarnings={warnings} />
    </div>
  );
}
