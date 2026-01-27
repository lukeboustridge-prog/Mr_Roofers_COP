import { DetailForm } from '@/components/admin/DetailForm';
import { db } from '@/lib/db';
import { substrates, categories } from '@/lib/db/schema';
import { asc } from 'drizzle-orm';

async function getData() {
  const allSubstrates = await db.select().from(substrates).orderBy(asc(substrates.sortOrder));
  const allCategories = await db.select().from(categories).orderBy(asc(categories.sortOrder));

  return { substrates: allSubstrates, categories: allCategories };
}

export default async function NewDetailPage() {
  const { substrates: allSubstrates, categories: allCategories } = await getData();

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Add New Detail</h1>
        <p className="text-slate-600">Create a new Code of Practice detail entry</p>
      </div>

      <DetailForm
        substrates={allSubstrates}
        categories={allCategories}
        isNew={true}
      />
    </div>
  );
}
