import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { getContentSourceById } from '@/lib/db/queries';
import { db } from '@/lib/db';
import { details } from '@/lib/db/schema';
import { eq, count } from 'drizzle-orm';
import { SourceEditForm } from './source-edit-form';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getSourceWithCount(id: string) {
  const source = await getContentSourceById(id);
  if (!source) return null;

  const [detailCount] = await db
    .select({ count: count() })
    .from(details)
    .where(eq(details.sourceId, id));

  return {
    ...source,
    detailCount: Number(detailCount?.count) || 0,
  };
}

export default async function EditSourcePage({ params }: PageProps) {
  const { id } = await params;
  const source = await getSourceWithCount(id);

  if (!source) {
    notFound();
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <Link
          href="/admin/sources"
          className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900 mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Sources
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Edit Content Source</h1>
        <p className="text-slate-600">
          Update source information for &ldquo;{source.name}&rdquo;
        </p>
      </div>

      <SourceEditForm source={source} />
    </div>
  );
}
