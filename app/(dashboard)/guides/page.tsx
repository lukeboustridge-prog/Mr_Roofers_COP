import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import { getHtgGuideOverviews } from '@/lib/db/queries/htg-guides';

const GUIDE_META: Record<string, { title: string; description: string; topic: string }> = {
  flashings: {
    title: 'Metal Roof Flashings Guide',
    description: 'Installation guidance for roof flashings including ridges, valleys, barges, and wall junctions',
    topic: 'Flashings',
  },
  penetrations: {
    title: 'Metal Roof Penetrations Guide',
    description: 'Installation guidance for roof penetrations including pipes, vents, skylights, and chimneys',
    topic: 'Penetrations',
  },
  cladding: {
    title: 'Metal Wall Cladding Guide',
    description: 'Installation guidance for metal wall cladding systems including fixing, flashings, and weathertightness',
    topic: 'Cladding',
  },
};

export default async function GuidesPage() {
  const guides = await getHtgGuideOverviews();

  return (
    <div className="container max-w-6xl p-4 md:p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
          How-To Guides
        </h1>
        <p className="mt-2 text-slate-600">
          RANZ Metal Roofing Installation Guides
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Practical installation guidance organized by topic — Metal substrate
        </p>
      </div>

      {/* Guide Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {guides.map((guide) => {
          const meta = GUIDE_META[guide.sourceDocument];
          if (!meta) return null;

          return (
            <Link key={guide.sourceDocument} href={`/guides/${guide.sourceDocument}`}>
              <Card className="h-full cursor-pointer transition-all hover:shadow-lg hover:border-primary/50">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <FileText className="h-8 w-8" />
                    </div>
                    <Badge variant="secondary">
                      {meta.topic}
                    </Badge>
                  </div>
                  <CardTitle className="mt-4 text-lg">{meta.title}</CardTitle>
                  <CardDescription>
                    {guide.pageCount} pages &middot; {meta.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
