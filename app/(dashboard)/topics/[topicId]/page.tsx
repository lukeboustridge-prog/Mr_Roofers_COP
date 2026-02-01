import { notFound } from 'next/navigation';
import { getTopicById, getDetailsByTopic } from '@/lib/db/queries/topics';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { TopicDetailsClient } from './topic-client';
import type { Metadata } from 'next';

interface TopicPageProps {
  params: Promise<{ topicId: string }>;
  searchParams: Promise<{ source?: string; capabilities?: string }>;
}

export async function generateMetadata({ params }: TopicPageProps): Promise<Metadata> {
  const { topicId } = await params;
  const topic = await getTopicById(topicId);

  if (!topic) {
    return {
      title: 'Topic Not Found | Master Roofers COP',
    };
  }

  return {
    title: `${topic.name} | Master Roofers COP`,
    description: topic.description || `Browse ${topic.name} details from all sources`,
  };
}

export default async function TopicPage({ params, searchParams }: TopicPageProps) {
  const { topicId } = await params;
  const { source: sourceFilter } = await searchParams;

  // Fetch topic data
  const topic = await getTopicById(topicId);

  if (!topic) {
    notFound();
  }

  // Fetch details with optional source filter
  const detailsResult = await getDetailsByTopic(topicId, {
    sourceId: sourceFilter && sourceFilter !== 'all' ? sourceFilter : undefined,
    limit: 100,
  });

  // Get counts for all sources (for tab badges)
  const allDetailsResult = await getDetailsByTopic(topicId, { limit: 100 });
  const mrmDetailsResult = await getDetailsByTopic(topicId, { sourceId: 'mrm-cop', limit: 100 });
  const ranzDetailsResult = await getDetailsByTopic(topicId, { sourceId: 'ranz-guide', limit: 100 });

  const breadcrumbItems = [
    { label: 'Topics', href: '/topics' },
    { label: topic.name },
  ];

  return (
    <div className="container max-w-6xl p-4 md:p-6 lg:p-8 pb-24">
      {/* Breadcrumbs */}
      <Breadcrumbs items={breadcrumbItems} className="mb-4" />

      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
          {topic.name}
        </h1>
        {topic.description && (
          <p className="mt-2 text-slate-600">{topic.description}</p>
        )}
      </div>

      {/* Client Component for Interactive Details */}
      <TopicDetailsClient
        topic={topic}
        details={detailsResult.data}
        initialSourceFilter={sourceFilter || 'all'}
        sourceCounts={{
          all: allDetailsResult.total,
          'mrm-cop': mrmDetailsResult.total,
          'ranz-guide': ranzDetailsResult.total,
        }}
      />
    </div>
  );
}

// Force dynamic rendering for Clerk auth and searchParams
export const dynamic = 'force-dynamic';
