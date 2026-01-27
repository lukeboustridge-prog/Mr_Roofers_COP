import Link from 'next/link';
import { Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable, Column } from '@/components/admin/DataTable';
import { db } from '@/lib/db';
import { details, substrates, categories, warningConditions, detailFailureLinks } from '@/lib/db/schema';
import { eq, asc, ilike, or, count } from 'drizzle-orm';

interface DetailWithRelations {
  id: string;
  code: string;
  name: string;
  description: string | null;
  substrateId: string | null;
  categoryId: string | null;
  thumbnailUrl: string | null;
  substrate: { id: string; name: string } | null;
  category: { id: string; name: string } | null;
  warningCount: number;
  failureCount: number;
}

async function getDetailsWithRelations(search?: string): Promise<DetailWithRelations[]> {
  let whereClause;
  if (search) {
    const searchTerm = `%${search}%`;
    whereClause = or(
      ilike(details.name, searchTerm),
      ilike(details.code, searchTerm),
      ilike(details.description, searchTerm)
    );
  }

  const allDetails = await db
    .select()
    .from(details)
    .where(whereClause)
    .orderBy(asc(details.code));

  const allSubstrates = await db.select().from(substrates);
  const allCategories = await db.select().from(categories);

  const detailsWithRelations = await Promise.all(
    allDetails.map(async (detail) => {
      const [warningCount] = await db
        .select({ count: count() })
        .from(warningConditions)
        .where(eq(warningConditions.detailId, detail.id));

      const [failureCount] = await db
        .select({ count: count() })
        .from(detailFailureLinks)
        .where(eq(detailFailureLinks.detailId, detail.id));

      const substrate = allSubstrates.find((s) => s.id === detail.substrateId);
      const category = allCategories.find((c) => c.id === detail.categoryId);

      return {
        ...detail,
        substrate: substrate ? { id: substrate.id, name: substrate.name } : null,
        category: category ? { id: category.id, name: category.name } : null,
        warningCount: Number(warningCount?.count) || 0,
        failureCount: Number(failureCount?.count) || 0,
      };
    })
  );

  return detailsWithRelations;
}

export default async function AdminDetailsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const search = params.q;
  const detailsList = await getDetailsWithRelations(search);

  const columns: Column<DetailWithRelations>[] = [
    {
      key: 'code',
      header: 'Code',
      render: (item) => (
        <span className="font-mono font-medium">{item.code}</span>
      ),
      className: 'w-[80px]',
    },
    {
      key: 'name',
      header: 'Name',
      render: (item) => (
        <div>
          <div className="font-medium">{item.name}</div>
          {item.description && (
            <div className="text-xs text-slate-500 truncate max-w-[300px]">
              {item.description}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'substrate',
      header: 'Substrate',
      render: (item) => item.substrate?.name || '-',
    },
    {
      key: 'category',
      header: 'Category',
      render: (item) => item.category?.name || '-',
    },
    {
      key: 'counts',
      header: 'Linked',
      render: (item) => (
        <div className="flex gap-2">
          {item.warningCount > 0 && (
            <Badge variant="outline" className="text-amber-600 border-amber-300">
              {item.warningCount} warning{item.warningCount !== 1 ? 's' : ''}
            </Badge>
          )}
          {item.failureCount > 0 && (
            <Badge variant="outline" className="text-red-600 border-red-300">
              {item.failureCount} failure{item.failureCount !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Details</h1>
          <p className="text-slate-600">
            Manage Code of Practice details ({detailsList.length} total)
          </p>
        </div>
        <Link href="/admin/details/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Detail
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <form className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            name="q"
            type="search"
            placeholder="Search by code, name, or description..."
            defaultValue={search}
            className="pl-10"
          />
        </div>
        <Button type="submit" variant="secondary">
          <Filter className="h-4 w-4 mr-2" />
          Search
        </Button>
      </form>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={detailsList}
        getRowKey={(item) => item.id}
        editHref={(item) => `/admin/details/${item.id}`}
        viewHref={(item) => `/planner/${item.substrateId}/${item.categoryId}/${item.id}`}
        emptyMessage="No details found. Create your first detail to get started."
      />
    </div>
  );
}
