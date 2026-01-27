import { DetailForm } from '@/components/admin/DetailForm';
import { db } from '@/lib/db';
import { substrates, categories, contentSources } from '@/lib/db/schema';
import { asc } from 'drizzle-orm';

async function getData() {
  const [allSubstrates, allCategories, allSources] = await Promise.all([
    db.select().from(substrates).orderBy(asc(substrates.sortOrder)),
    db.select().from(categories).orderBy(asc(categories.sortOrder)),
    db.select().from(contentSources).orderBy(asc(contentSources.sortOrder)),
  ]);

  return { substrates: allSubstrates, categories: allCategories, sources: allSources };
}

export default async function NewDetailPage() {
  const { substrates: allSubstrates, categories: allCategories, sources: allSources } = await getData();

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Add New Detail</h1>
        <p className="text-slate-600">Create a new Code of Practice detail entry</p>
      </div>

      <DetailForm
        substrates={allSubstrates}
        categories={allCategories}
        sources={allSources}
        isNew={true}
      />
    </div>
  );
}
