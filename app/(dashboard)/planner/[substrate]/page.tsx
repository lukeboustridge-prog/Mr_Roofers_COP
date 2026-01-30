import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Layers,
  Triangle,
  Square,
  CircleDot,
  Droplets,
  Wind,
  FileText,
  ChevronRight,
  Search,
  LayoutGrid,
  Hexagon,
  Box,
  Wrench,
  Zap,
} from 'lucide-react';
import { getSubstrateById, getCategoriesBySubstrate } from '@/lib/db/queries';
import { Breadcrumbs, createBreadcrumbItems } from '@/components/navigation/Breadcrumbs';
import { db } from '@/lib/db';
import { details, warningConditions, detailFailureLinks } from '@/lib/db/schema';
import { eq, count } from 'drizzle-orm';

// Extended category icons
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

// Substrate icons
const substrateIcons: Record<string, React.ReactNode> = {
  'long-run-metal': <LayoutGrid className="h-8 w-8" />,
  'profiled-metal': <LayoutGrid className="h-8 w-8" />,
  membrane: <Layers className="h-8 w-8" />,
  'asphalt-shingle': <Square className="h-8 w-8" />,
  shingle: <Square className="h-8 w-8" />,
  'concrete-tile': <Hexagon className="h-8 w-8" />,
  'clay-tile': <CircleDot className="h-8 w-8" />,
  'pressed-metal-tile': <Triangle className="h-8 w-8" />,
  'pressed-metal': <Triangle className="h-8 w-8" />,
};

// Substrate descriptions
const substrateDescriptions: Record<string, string> = {
  'long-run-metal': 'Corrugated, trapezoidal, and standing seam metal roofing',
  'profiled-metal': 'Long-run, corrugated, standing seam metal roofing',
  membrane: 'Single-ply TPO, PVC, EPDM, torch-on, and liquid applied',
  'asphalt-shingle': 'Composition asphalt shingle systems',
  shingle: 'Composition asphalt shingle systems',
  'concrete-tile': 'Standard concrete roof tiles and accessories',
  'clay-tile': 'Traditional and modern clay tile installations',
  'pressed-metal-tile': 'Metal tiles mimicking clay or concrete profiles',
  'pressed-metal': 'Metal tiles mimicking clay or concrete profiles',
};

interface SubstratePageProps {
  params: { substrate: string };
}

async function getSubstrateStats(substrateId: string) {
  try {
    // Get total details count
    const [detailCount] = await db
      .select({ count: count() })
      .from(details)
      .where(eq(details.substrateId, substrateId));

    // Get details with warnings
    const detailsInSubstrate = await db
      .select({ id: details.id })
      .from(details)
      .where(eq(details.substrateId, substrateId));

    let warningCount = 0;
    let failureCount = 0;

    for (const detail of detailsInSubstrate) {
      const [warnings] = await db
        .select({ count: count() })
        .from(warningConditions)
        .where(eq(warningConditions.detailId, detail.id));
      if ((warnings?.count || 0) > 0) warningCount++;

      const [failures] = await db
        .select({ count: count() })
        .from(detailFailureLinks)
        .where(eq(detailFailureLinks.detailId, detail.id));
      if ((failures?.count || 0) > 0) failureCount++;
    }

    return {
      totalDetails: detailCount?.count || 0,
      detailsWithWarnings: warningCount,
      detailsWithFailures: failureCount,
    };
  } catch (error) {
    console.error('Error fetching substrate stats:', error);
    return {
      totalDetails: 0,
      detailsWithWarnings: 0,
      detailsWithFailures: 0,
    };
  }
}

export default async function SubstratePage({ params }: SubstratePageProps) {
  const { substrate: substrateId } = params;

  const [substrate, categories, stats] = await Promise.all([
    getSubstrateById(substrateId),
    getCategoriesBySubstrate(substrateId),
    getSubstrateStats(substrateId),
  ]);

  if (!substrate) {
    notFound();
  }

  const description = substrateDescriptions[substrateId] || substrate.description || '';
  const icon = substrateIcons[substrateId] || <LayoutGrid className="h-8 w-8" />;

  return (
    <div className="container max-w-6xl p-4 md:p-6 lg:p-8 pb-24">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={createBreadcrumbItems('planner', { substrate: { id: substrateId, name: substrate.name } })}
        className="mb-4"
      />

      {/* Back Button */}
      <Link href="/planner">
        <Button variant="ghost" className="mb-4 -ml-2 min-h-[48px]">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Substrates
        </Button>
      </Link>

      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary flex-shrink-0">
            {icon}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
              {substrate.name}
            </h1>
            <p className="mt-1 text-slate-600">{description}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-primary">{stats.totalDetails}</p>
          <p className="text-xs text-slate-500 uppercase tracking-wide">Details</p>
        </Card>
        <Card className={`p-3 text-center ${stats.detailsWithWarnings > 0 ? 'border-amber-200 bg-amber-50' : ''}`}>
          <p className={`text-2xl font-bold ${stats.detailsWithWarnings > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
            {stats.detailsWithWarnings}
          </p>
          <p className="text-xs text-slate-500 uppercase tracking-wide">With Warnings</p>
        </Card>
        <Card className={`p-3 text-center ${stats.detailsWithFailures > 0 ? 'border-red-200 bg-red-50' : ''}`}>
          <p className={`text-2xl font-bold ${stats.detailsWithFailures > 0 ? 'text-red-600' : 'text-slate-400'}`}>
            {stats.detailsWithFailures}
          </p>
          <p className="text-xs text-slate-500 uppercase tracking-wide">With Failures</p>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Link href={`/search?substrate=${substrateId}`}>
          <Button variant="outline" className="min-h-[48px]">
            <Search className="mr-2 h-4 w-4" />
            Search {substrate.name}
          </Button>
        </Link>
        <Link href={`/fixer?substrate=${substrateId}`}>
          <Button variant="outline" className="min-h-[48px]">
            <Wrench className="mr-2 h-4 w-4" />
            Quick Lookup
          </Button>
        </Link>
      </div>

      {/* Section Title */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">
          Categories
        </h2>
        {categories.length > 0 && (
          <Badge variant="secondary">
            {categories.length} categor{categories.length !== 1 ? 'ies' : 'y'}
          </Badge>
        )}
      </div>

      {/* Categories Grid */}
      {categories.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => {
            const catIcon = categoryIcons[category.id] || <Layers className="h-6 w-6" />;

            return (
              <Link
                key={category.id}
                href={`/planner/${substrateId}/${category.id}`}
              >
                <Card className="h-full cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 active:scale-[0.99] touch-manipulation">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        {catIcon}
                      </div>
                      <Badge variant="secondary">
                        {category.detailCount} detail{category.detailCount !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <CardTitle className="mt-4 text-lg">{category.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {category.description || 'Browse details in this category'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center text-sm text-primary font-medium">
                      View Details
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Layers className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-4 font-medium text-slate-700">No categories yet</h3>
            <p className="mt-1 text-sm text-slate-500">
              Categories for {substrate.name} will be added in a future update.
            </p>
            <p className="mt-4 text-sm text-slate-400">
              Try running the database seed script to add sample data.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link href="/planner">
                <Button variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Substrates
                </Button>
              </Link>
              <Link href="/search">
                <Button>
                  <Search className="mr-2 h-4 w-4" />
                  Search All Details
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Helpful Tip */}
      {categories.length > 0 && (
        <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 flex-shrink-0">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <p className="font-medium text-blue-900">Tip: Three-Click Navigation</p>
              <p className="mt-1 text-sm text-blue-700">
                Select a category above, then choose a specific detail to view full installation guidance,
                3D models, and related failure cases.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Force dynamic rendering - don't generate static params at build time
export const dynamic = 'force-dynamic';
