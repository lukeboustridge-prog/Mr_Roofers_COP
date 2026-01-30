import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  FileText,
  Search,
  Layers,
  Triangle,
  Square,
  CircleDot,
  Droplets,
  Wind,
  Box,
  Wrench,
  Zap,
} from 'lucide-react';
import { getDetailsByCategory, getCategoryById, getSubstrateById } from '@/lib/db/queries';
import { CategoryDetailsClient } from './category-client';
import { Breadcrumbs, createBreadcrumbItems } from '@/components/navigation/Breadcrumbs';

// Category icons
const categoryIcons: Record<string, React.ReactNode> = {
  flashings: <Layers className="h-6 w-6" />,
  'wall-flashings': <Layers className="h-6 w-6" />,
  'apron-flashings': <Layers className="h-6 w-6" />,
  ridges: <Triangle className="h-6 w-6" />,
  'ridges-hips': <Triangle className="h-6 w-6" />,
  hips: <Triangle className="h-6 w-6" />,
  valleys: <Square className="h-6 w-6" />,
  penetrations: <CircleDot className="h-6 w-6" />,
  pipes: <CircleDot className="h-6 w-6" />,
  vents: <CircleDot className="h-6 w-6" />,
  skylights: <Box className="h-6 w-6" />,
  gutters: <Droplets className="h-6 w-6" />,
  'internal-gutters': <Droplets className="h-6 w-6" />,
  'eaves-gutters': <Droplets className="h-6 w-6" />,
  ventilation: <Wind className="h-6 w-6" />,
  'roof-ventilation': <Wind className="h-6 w-6" />,
  junctions: <Wrench className="h-6 w-6" />,
  'wall-junctions': <Wrench className="h-6 w-6" />,
  general: <FileText className="h-6 w-6" />,
  accessories: <Zap className="h-6 w-6" />,
};

interface CategoryPageProps {
  params: { substrate: string; category: string };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { substrate: substrateId, category: categoryId } = params;

  const [substrate, category, detailsResult] = await Promise.all([
    getSubstrateById(substrateId),
    getCategoryById(categoryId),
    getDetailsByCategory(categoryId, { limit: 100 }),
  ]);

  if (!substrate) {
    notFound();
  }

  const categoryName = category?.name || categoryId
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const categoryDescription = category?.description || `Browse ${categoryName.toLowerCase()} details for ${substrate.name}`;
  const icon = categoryIcons[categoryId] || <Layers className="h-6 w-6" />;

  // Calculate stats
  const stats = {
    total: detailsResult.total,
    withWarnings: detailsResult.details.filter((d) => d.warningCount > 0).length,
    withFailures: detailsResult.details.filter((d) => d.failureCount > 0).length,
  };

  return (
    <div className="container max-w-6xl p-4 md:p-6 lg:p-8 pb-24">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={createBreadcrumbItems('planner', {
          substrate: { id: substrateId, name: substrate.name },
          category: { id: categoryId, name: categoryName },
        })}
        className="mb-4"
      />

      {/* Back Button */}
      <Link href={`/planner/${substrateId}`}>
        <Button variant="ghost" className="mb-4 -ml-2 min-h-[48px]">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {substrate.name}
        </Button>
      </Link>

      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary flex-shrink-0">
            {icon}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
              {categoryName}
            </h1>
            <p className="mt-1 text-slate-600">{categoryDescription}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-primary">{stats.total}</p>
          <p className="text-xs text-slate-500 uppercase tracking-wide">Details</p>
        </Card>
        <Card className={`p-3 text-center ${stats.withWarnings > 0 ? 'border-amber-200 bg-amber-50' : ''}`}>
          <p className={`text-2xl font-bold ${stats.withWarnings > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
            {stats.withWarnings}
          </p>
          <p className="text-xs text-slate-500 uppercase tracking-wide">Warnings</p>
        </Card>
        <Card className={`p-3 text-center ${stats.withFailures > 0 ? 'border-red-200 bg-red-50' : ''}`}>
          <p className={`text-2xl font-bold ${stats.withFailures > 0 ? 'text-red-600' : 'text-slate-400'}`}>
            {stats.withFailures}
          </p>
          <p className="text-xs text-slate-500 uppercase tracking-wide">Failures</p>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Link href={`/search?substrate=${substrateId}&category=${categoryId}`}>
          <Button variant="outline" className="min-h-[48px]">
            <Search className="mr-2 h-4 w-4" />
            Search {categoryName}
          </Button>
        </Link>
      </div>

      {/* Details List with Client-Side Interactions */}
      <CategoryDetailsClient
        details={detailsResult.details}
        substrateId={substrateId}
        categoryId={categoryId}
        substrateName={substrate.name}
        categoryName={categoryName}
      />
    </div>
  );
}

// Force dynamic rendering
export const dynamic = 'force-dynamic';
