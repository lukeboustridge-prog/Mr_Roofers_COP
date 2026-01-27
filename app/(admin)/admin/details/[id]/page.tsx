import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ListOrdered, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DetailForm } from '@/components/admin/DetailForm';
import { db } from '@/lib/db';
import { details, substrates, categories, contentSources } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';

interface DetailData {
  id: string;
  code: string;
  name: string;
  description: string | null;
  substrateId: string | null;
  categoryId: string | null;
  subcategoryId: string | null;
  sourceId: string | null;
  modelUrl: string | null;
  thumbnailUrl: string | null;
  minPitch: number | null;
  maxPitch: number | null;
  specifications: Record<string, string> | null;
  standardsRefs: Array<{ code: string; clause: string; title: string }> | null;
  ventilationReqs: Array<{ check: string; required: boolean }> | null;
}

async function getDetail(id: string): Promise<DetailData | null> {
  const [detail] = await db.select().from(details).where(eq(details.id, id)).limit(1);
  if (!detail) return null;

  return {
    ...detail,
    specifications: detail.specifications as Record<string, string> | null,
    standardsRefs: detail.standardsRefs as Array<{ code: string; clause: string; title: string }> | null,
    ventilationReqs: detail.ventilationReqs as Array<{ check: string; required: boolean }> | null,
  };
}

async function getData() {
  const [allSubstrates, allCategories, allSources] = await Promise.all([
    db.select().from(substrates).orderBy(asc(substrates.sortOrder)),
    db.select().from(categories).orderBy(asc(categories.sortOrder)),
    db.select().from(contentSources).orderBy(asc(contentSources.sortOrder)),
  ]);

  return { substrates: allSubstrates, categories: allCategories, sources: allSources };
}

export default async function EditDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getDetail(id);

  if (!detail) {
    notFound();
  }

  const { substrates: allSubstrates, categories: allCategories, sources: allSources } = await getData();

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <div className="mb-6">
        <Link
          href="/admin/details"
          className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Details
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Edit Detail: {detail.code}
            </h1>
            <p className="text-slate-600">{detail.name}</p>
          </div>
          <div className="flex gap-2">
            <Link href={`/admin/details/${id}/steps`}>
              <Button variant="outline">
                <ListOrdered className="h-4 w-4 mr-2" />
                Manage Steps
              </Button>
            </Link>
            <Link href={`/admin/details/${id}/warnings`}>
              <Button variant="outline">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Manage Warnings
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <DetailForm
        detail={detail}
        substrates={allSubstrates}
        categories={allCategories}
        sources={allSources}
      />
    </div>
  );
}
