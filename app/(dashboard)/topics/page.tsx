import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getTopicsWithCounts } from '@/lib/db/queries/topics';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import {
  Layers,
  Triangle,
  CircleDot,
  Droplets,
  Wind,
  FileText,
  Wrench,
  ArrowRight,
} from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Browse Topics | Master Roofers COP',
  description: 'Browse roofing topics across all sources - MRM Code of Practice and RANZ Installation Guide',
};

// Topic icons mapping
const topicIcons: Record<string, React.ReactNode> = {
  flashings: <Layers className="h-8 w-8" />,
  ridges: <Triangle className="h-8 w-8" />,
  hips: <Triangle className="h-8 w-8" />,
  'ridges-hips': <Triangle className="h-8 w-8" />,
  valleys: <Layers className="h-8 w-8" />,
  penetrations: <CircleDot className="h-8 w-8" />,
  gutters: <Droplets className="h-8 w-8" />,
  ventilation: <Wind className="h-8 w-8" />,
  junctions: <Wrench className="h-8 w-8" />,
  general: <FileText className="h-8 w-8" />,
};

export default async function TopicsPage() {
  const topics = await getTopicsWithCounts();

  const breadcrumbItems = [
    { label: 'Topics' },
  ];

  return (
    <div className="container max-w-6xl p-4 md:p-6 lg:p-8">
      {/* Breadcrumbs */}
      <Breadcrumbs items={breadcrumbItems} className="mb-4" />

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
          Browse by Topic
        </h1>
        <p className="mt-2 text-slate-600">
          Explore roofing details organized by topic, combining content from all sources
        </p>
      </div>

      {/* Empty State */}
      {topics.length === 0 && (
        <Card className="border-dashed">
          <CardHeader className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-slate-300" />
            <CardTitle className="mt-4 text-lg text-slate-700">
              No topics available
            </CardTitle>
            <CardDescription className="mt-2 max-w-md mx-auto">
              Topics are being prepared. In the meantime, you can browse details using the Planner view.
            </CardDescription>
            <div className="mt-6 flex justify-center gap-3">
              <Link href="/planner">
                <Button>
                  Go to Planner
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Topics Grid */}
      {topics.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map((topic) => (
            <Link key={topic.id} href={`/topics/${topic.id}`}>
              <Card className="h-full cursor-pointer transition-all hover:shadow-lg hover:border-primary/50">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      {topicIcons[topic.id] || <FileText className="h-8 w-8" />}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="secondary">
                        {topic.detailCount} detail{topic.detailCount !== 1 ? 's' : ''}
                      </Badge>
                      {topic.categoryCount > 0 && (
                        <span className="text-xs text-slate-500">
                          Across {topic.categoryCount} {topic.categoryCount === 1 ? 'category' : 'categories'}
                        </span>
                      )}
                    </div>
                  </div>
                  <CardTitle className="mt-4 text-lg">{topic.name}</CardTitle>
                  {topic.description && (
                    <CardDescription>{topic.description}</CardDescription>
                  )}
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Navigation hint */}
      {topics.length > 0 && (
        <div className="mt-8 text-center text-sm text-slate-500">
          <p>
            Prefer substrate-based navigation?{' '}
            <Link href="/planner" className="text-primary hover:underline">
              Use Planner mode
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}

// Force dynamic rendering for Clerk auth
export const dynamic = 'force-dynamic';
