import Link from 'next/link';
import { Plus, Library, Edit, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getContentSourcesWithCounts } from '@/lib/db/queries';

export default async function AdminSourcesPage() {
  const sources = await getContentSourcesWithCounts();

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Content Sources</h1>
          <p className="text-slate-600">
            Manage content sources from different industry guides and codes of practice
          </p>
        </div>
        <Link href="/admin/sources/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Source
          </Button>
        </Link>
      </div>

      {sources.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Library className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-4 text-lg font-medium text-slate-900">
              No content sources yet
            </h3>
            <p className="mt-2 text-slate-500">
              Add your first content source to start organizing details by origin.
            </p>
            <Link href="/admin/sources/new">
              <Button className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Add Source
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sources.map((source) => (
            <Card key={source.id} className="relative group">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Library className="h-5 w-5 text-slate-500" />
                      {source.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {source.description || 'No description'}
                    </CardDescription>
                  </div>
                  <Link href={`/admin/sources/${source.id}`}>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Short Name</span>
                    <Badge variant="secondary">{source.shortName}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">ID</span>
                    <code className="text-sm bg-slate-100 px-2 py-0.5 rounded">
                      {source.id}
                    </code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Details</span>
                    <Badge variant="outline">
                      {source.detailCount} detail{source.detailCount !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  {source.websiteUrl && (
                    <div className="pt-2 border-t">
                      <a
                        href={source.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Website
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
