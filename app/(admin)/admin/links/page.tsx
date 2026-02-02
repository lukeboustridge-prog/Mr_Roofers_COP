'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Link2, ExternalLink, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable, Column } from '@/components/admin/DataTable';
import { Skeleton } from '@/components/ui/skeleton';

interface LinkData {
  id: string;
  primaryDetailId: string;
  primaryCode: string;
  primaryName: string;
  primarySourceId: string | null;
  supplementaryDetailId: string;
  supplementaryCode: string;
  supplementaryName: string;
  supplementarySourceId: string | null;
  linkType: 'installation_guide' | 'technical_supplement' | 'alternative';
  matchConfidence: 'exact' | 'partial' | 'related' | null;
  notes: string | null;
  createdAt: string;
}

function getConfidenceBadgeStyle(confidence: string | null) {
  switch (confidence) {
    case 'exact':
      return 'bg-green-100 text-green-700 border-green-300';
    case 'partial':
      return 'bg-amber-100 text-amber-700 border-amber-300';
    case 'related':
      return 'bg-slate-100 text-slate-600 border-slate-300';
    default:
      return 'bg-slate-100 text-slate-500 border-slate-200';
  }
}

function getLinkTypeBadgeStyle(linkType: string) {
  switch (linkType) {
    case 'installation_guide':
      return 'bg-blue-100 text-blue-700 border-blue-300';
    case 'technical_supplement':
      return 'bg-purple-100 text-purple-700 border-purple-300';
    case 'alternative':
      return 'bg-orange-100 text-orange-700 border-orange-300';
    default:
      return 'bg-slate-100 text-slate-500 border-slate-200';
  }
}

function formatLinkType(linkType: string) {
  return linkType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function AdminLinksPage() {
  const router = useRouter();
  const [links, setLinks] = useState<LinkData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLinks() {
      try {
        const response = await fetch('/api/admin/links');
        if (!response.ok) {
          throw new Error('Failed to fetch links');
        }
        const result = await response.json();
        setLinks(result.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load links');
      } finally {
        setIsLoading(false);
      }
    }

    fetchLinks();
  }, []);

  async function handleDelete(link: LinkData) {
    if (!confirm(`Delete link between "${link.primaryCode}" and "${link.supplementaryCode}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/links/${link.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete link');
      }

      // Remove from local state
      setLinks(prev => prev.filter(l => l.id !== link.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete link');
    }
  }

  const columns: Column<LinkData>[] = [
    {
      key: 'primary',
      header: 'Primary (Authoritative)',
      render: (item) => (
        <div>
          <span className="font-mono text-sm font-medium text-primary">
            {item.primaryCode}
          </span>
          <div className="text-sm text-slate-600 truncate max-w-[200px]">
            {item.primaryName}
          </div>
        </div>
      ),
    },
    {
      key: 'arrow',
      header: '',
      render: () => (
        <ArrowRight className="h-4 w-4 text-slate-400" />
      ),
      className: 'w-[40px]',
    },
    {
      key: 'supplementary',
      header: 'Supplementary',
      render: (item) => (
        <div>
          <span className="font-mono text-sm font-medium text-slate-700">
            {item.supplementaryCode}
          </span>
          <div className="text-sm text-slate-600 truncate max-w-[200px]">
            {item.supplementaryName}
          </div>
        </div>
      ),
    },
    {
      key: 'linkType',
      header: 'Type',
      render: (item) => (
        <Badge variant="outline" className={getLinkTypeBadgeStyle(item.linkType)}>
          {formatLinkType(item.linkType)}
        </Badge>
      ),
    },
    {
      key: 'confidence',
      header: 'Confidence',
      render: (item) => (
        <Badge variant="outline" className={getConfidenceBadgeStyle(item.matchConfidence)}>
          {item.matchConfidence || 'manual'}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (item) => (
        <span className="text-sm text-slate-500">
          {new Date(item.createdAt).toLocaleDateString()}
        </span>
      ),
      className: 'w-[100px]',
    },
  ];

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 lg:p-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Link2 className="h-6 w-6" />
            Content Links
          </h1>
          <p className="text-slate-600">
            Manage MRM to RANZ content links ({links.length} total)
          </p>
        </div>
        <Link href="/admin/links/suggestions">
          <Button>
            <ExternalLink className="h-4 w-4 mr-2" />
            Review Suggestions
          </Button>
        </Link>
      </div>

      <DataTable
        columns={columns}
        data={links}
        getRowKey={(item) => item.id}
        onDelete={handleDelete}
        viewHref={(item) => `/planner/${item.primarySourceId?.includes('mrm') ? 'profiled-metal' : 'profiled-metal'}/flashings/${item.primaryDetailId}`}
        emptyMessage="No content links yet. Review suggestions to create links between MRM and RANZ content."
      />
    </div>
  );
}
