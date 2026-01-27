import Link from 'next/link';
import { Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable, Column } from '@/components/admin/DataTable';
import { db } from '@/lib/db';
import { failureCases, detailFailureLinks } from '@/lib/db/schema';
import { eq, desc, ilike, or, count } from 'drizzle-orm';

interface FailureWithLinks {
  id: string;
  caseId: string;
  failureType: string | null;
  outcome: string | null;
  summary: string | null;
  decisionDate: Date | null;
  linkedDetailCount: number;
}

async function getFailureCases(search?: string): Promise<FailureWithLinks[]> {
  let whereClause;
  if (search) {
    const searchTerm = `%${search}%`;
    whereClause = or(
      ilike(failureCases.caseId, searchTerm),
      ilike(failureCases.summary, searchTerm)
    );
  }

  const cases = await db
    .select()
    .from(failureCases)
    .where(whereClause)
    .orderBy(desc(failureCases.decisionDate));

  const casesWithCounts = await Promise.all(
    cases.map(async (fc) => {
      const [linkCount] = await db
        .select({ count: count() })
        .from(detailFailureLinks)
        .where(eq(detailFailureLinks.failureCaseId, fc.id));

      return {
        ...fc,
        linkedDetailCount: Number(linkCount?.count) || 0,
      };
    })
  );

  return casesWithCounts;
}

export default async function AdminFailuresPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const search = params.q;
  const failuresList = await getFailureCases(search);

  const getOutcomeBadge = (outcome: string | null) => {
    switch (outcome) {
      case 'upheld':
        return <Badge className="bg-red-100 text-red-700">Upheld</Badge>;
      case 'partially-upheld':
        return <Badge className="bg-amber-100 text-amber-700">Partially Upheld</Badge>;
      case 'dismissed':
        return <Badge className="bg-green-100 text-green-700">Dismissed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const columns: Column<FailureWithLinks>[] = [
    {
      key: 'caseId',
      header: 'Case ID',
      render: (item) => (
        <span className="font-mono font-medium">{item.caseId}</span>
      ),
      className: 'w-[140px]',
    },
    {
      key: 'failureType',
      header: 'Type',
      render: (item) => item.failureType || '-',
    },
    {
      key: 'summary',
      header: 'Summary',
      render: (item) => (
        <div className="max-w-[300px] truncate text-sm text-slate-600">
          {item.summary || 'No summary'}
        </div>
      ),
    },
    {
      key: 'outcome',
      header: 'Outcome',
      render: (item) => getOutcomeBadge(item.outcome),
    },
    {
      key: 'decisionDate',
      header: 'Date',
      render: (item) =>
        item.decisionDate
          ? new Date(item.decisionDate).toLocaleDateString()
          : '-',
    },
    {
      key: 'linkedDetailCount',
      header: 'Links',
      render: (item) => (
        <Badge variant="outline">
          {item.linkedDetailCount} detail{item.linkedDetailCount !== 1 ? 's' : ''}
        </Badge>
      ),
    },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Failure Cases</h1>
          <p className="text-slate-600">
            Manage MBIE/LBP failure case references ({failuresList.length} total)
          </p>
        </div>
        <Link href="/admin/failures/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Failure Case
          </Button>
        </Link>
      </div>

      {/* Search */}
      <form className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            name="q"
            type="search"
            placeholder="Search by case ID or summary..."
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
        data={failuresList}
        getRowKey={(item) => item.id}
        editHref={(item) => `/admin/failures/${item.id}`}
        emptyMessage="No failure cases found. Add your first case to get started."
      />
    </div>
  );
}
