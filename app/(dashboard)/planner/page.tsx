import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getSubstratesWithCounts } from '@/lib/db/queries';
import {
  LayoutGrid,
  Layers,
  Square,
  CircleDot,
  Hexagon,
  Triangle
} from 'lucide-react';

const substrateIcons: Record<string, React.ReactNode> = {
  'long-run-metal': <LayoutGrid className="h-8 w-8" />,
  'membrane': <Layers className="h-8 w-8" />,
  'asphalt-shingle': <Square className="h-8 w-8" />,
  'concrete-tile': <Hexagon className="h-8 w-8" />,
  'clay-tile': <CircleDot className="h-8 w-8" />,
  'pressed-metal-tile': <Triangle className="h-8 w-8" />,
};

const substrateDescriptions: Record<string, string> = {
  'long-run-metal': 'Corrugated, trapezoidal, and standing seam metal roofing systems',
  'membrane': 'TPO, PVC, EPDM, and other membrane roofing applications',
  'asphalt-shingle': 'Asphalt shingle installation and detailing',
  'concrete-tile': 'Concrete tile roofing systems and accessories',
  'clay-tile': 'Traditional and modern clay tile installations',
  'pressed-metal-tile': 'Pressed metal tile systems including shake profiles',
};

export default async function PlannerPage() {
  const substrates = await getSubstratesWithCounts();

  return (
    <div className="container max-w-6xl p-4 md:p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
          Planner Mode
        </h1>
        <p className="mt-2 text-slate-600">
          Browse all roofing substrates and their installation details
        </p>
      </div>

      {/* Substrate Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {substrates.map((substrate) => (
          <Link key={substrate.id} href={`/planner/${substrate.id}`}>
            <Card className="h-full cursor-pointer transition-all hover:shadow-lg hover:border-primary/50">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    {substrateIcons[substrate.id] || <LayoutGrid className="h-8 w-8" />}
                  </div>
                  <Badge variant="secondary">
                    {substrate.detailCount} details
                  </Badge>
                </div>
                <CardTitle className="mt-4 text-lg">{substrate.name}</CardTitle>
                <CardDescription>
                  {substrateDescriptions[substrate.id] || substrate.description}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
