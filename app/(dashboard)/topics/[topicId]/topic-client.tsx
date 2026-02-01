'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DetailCard } from '@/components/details/DetailCard';
import { FileText, Search, ArrowRight } from 'lucide-react';

interface TopicDetail {
  id: string;
  code: string;
  name: string;
  description: string | null;
  thumbnailUrl: string | null;
  modelUrl: string | null;
  categoryId: string | null;
  sourceId: string | null;
  sourceName: string | null;
}

interface Topic {
  id: string;
  name: string;
  description: string | null;
}

interface TopicDetailsClientProps {
  topic: Topic;
  details: TopicDetail[];
  initialSourceFilter: string;
  sourceCounts: {
    all: number;
    'mrm-cop': number;
    'ranz-guide': number;
  };
}

export function TopicDetailsClient({
  topic,
  details,
  initialSourceFilter: _initialSourceFilter,
  sourceCounts,
}: TopicDetailsClientProps) {
  // initialSourceFilter is passed from server but we use URL as source of truth
  void _initialSourceFilter;

  const router = useRouter();
  const searchParams = useSearchParams();
  const activeSource = searchParams.get('source') || 'all';

  const handleSourceChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') {
      params.delete('source');
    } else {
      params.set('source', value);
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  // Determine substrate name for DetailCard
  const getSubstrateName = (): string => {
    // Use topic name as substrate context for unified view
    return topic.name;
  };

  // Generate href for detail
  const getDetailHref = (detail: TopicDetail): string => {
    // For now, link to planner route if we have category info
    // Future: could link to a unified /topics/[topicId]/[detailId] route
    if (detail.categoryId) {
      // We need substrate info - for now use a generic search link
      return `/search?q=${encodeURIComponent(detail.code)}`;
    }
    return `/search?q=${encodeURIComponent(detail.code)}`;
  };

  return (
    <div>
      {/* Source Filter Tabs */}
      <Tabs value={activeSource} onValueChange={handleSourceChange} className="mb-6">
        <TabsList className="w-full justify-start flex-wrap h-auto gap-1">
          <TabsTrigger value="all" className="gap-2 min-h-[40px]">
            All Sources
            <Badge variant="secondary" className="ml-1">
              {sourceCounts.all}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="mrm-cop" className="gap-2 min-h-[40px]">
            MRM COP
            <Badge variant="secondary" className="ml-1">
              {sourceCounts['mrm-cop']}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="ranz-guide" className="gap-2 min-h-[40px]">
            RANZ Guide
            <Badge variant="secondary" className="ml-1">
              {sourceCounts['ranz-guide']}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeSource} className="mt-4">
          {/* Results count */}
          <div className="mb-4 text-sm text-slate-500">
            {details.length} detail{details.length !== 1 ? 's' : ''}{' '}
            {activeSource === 'all' ? 'from all sources' : `from ${activeSource === 'mrm-cop' ? 'MRM COP' : 'RANZ Guide'}`}
          </div>

          {/* Empty State */}
          {details.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center">
                <div className="mx-auto w-fit rounded-full bg-slate-100 p-4">
                  <FileText className="h-12 w-12 text-slate-400" />
                </div>
                <h3 className="mt-6 text-lg font-semibold text-slate-900">
                  No Details Found
                </h3>
                <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
                  {activeSource === 'all'
                    ? `No details are currently available for ${topic.name}. Check back soon or explore other topics.`
                    : `No details from ${activeSource === 'mrm-cop' ? 'MRM COP' : 'RANZ Guide'} are available for ${topic.name}. Try viewing all sources.`}
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  {activeSource !== 'all' && (
                    <Button variant="outline" onClick={() => handleSourceChange('all')}>
                      View All Sources
                    </Button>
                  )}
                  <Link href="/topics">
                    <Button variant="outline">Browse Topics</Button>
                  </Link>
                  <Link href="/search">
                    <Button>
                      <Search className="mr-2 h-4 w-4" />
                      Search All
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Details List */}
          {details.length > 0 && (
            <div className="space-y-3">
              {details.map((detail) => (
                <DetailCard
                  key={detail.id}
                  code={detail.code}
                  name={detail.name}
                  substrate={getSubstrateName()}
                  sourceId={detail.sourceId}
                  sourceShortName={detail.sourceName || undefined}
                  has3DModel={detail.modelUrl !== null}
                  hasSteps={false} // Will be enhanced in future plans
                  hasWarning={false} // Will be enhanced in future plans
                  warningCount={0}
                  failureCount={0}
                  href={getDetailHref(detail)}
                />
              ))}
            </div>
          )}

          {/* Summary */}
          {details.length > 0 && (
            <div className="mt-8 text-center">
              <p className="text-sm text-slate-500 mb-4">
                Viewing {details.length} of {sourceCounts.all} total details in {topic.name}
              </p>
              <Link href={`/search?q=${encodeURIComponent(topic.name)}`}>
                <Button variant="outline">
                  Search in {topic.name}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
