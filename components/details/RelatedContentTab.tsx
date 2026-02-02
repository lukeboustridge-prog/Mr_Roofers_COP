'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SourceBadge } from '@/components/authority';
import { Box, ArrowRight } from 'lucide-react';
import type { LinkedDetail } from '@/lib/db/queries/detail-links';

interface RelatedContentTabProps {
  supplements: LinkedDetail[]; // RANZ guides linked to this MRM spec
  supplementsTo: LinkedDetail[]; // MRM specs this RANZ guide supports
}

export function RelatedContentTab({ supplements, supplementsTo }: RelatedContentTabProps) {
  const hasSupplements = (supplements?.length ?? 0) > 0;
  const hasSupplementsTo = (supplementsTo?.length ?? 0) > 0;

  // Return null if no linked content in either direction
  if (!hasSupplements && !hasSupplementsTo) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Section 1: Installation Guides & Supplements */}
      {hasSupplements && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Installation Guides & Supplements</h3>
          <div className="grid gap-4">
            {supplements.map((linked) => (
              <Card key={linked.id} className="hover:border-slate-300 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <SourceBadge
                        shortName={linked.sourceName || 'RANZ'}
                        authority="supplementary"
                        size="sm"
                      />
                      <h4 className="font-semibold mt-2 text-slate-900">{linked.name}</h4>
                      {linked.description && (
                        <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                          {linked.description}
                        </p>
                      )}
                      {linked.modelUrl && (
                        <Badge variant="outline" className="mt-2">
                          <Box className="h-3 w-3 mr-1" />
                          3D Model Available
                        </Badge>
                      )}
                    </div>
                    <Link href={`/detail/${linked.id}`}>
                      <Button variant="outline" size="sm" className="flex-shrink-0">
                        View Guide
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Section 2: Related Specifications */}
      {hasSupplementsTo && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Related Specifications</h3>
          <div className="grid gap-4">
            {supplementsTo.map((linked) => (
              <Card key={linked.id} className="border-primary/20 hover:border-primary/40 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <SourceBadge
                        shortName={linked.sourceName || 'MRM'}
                        authority="authoritative"
                        size="sm"
                      />
                      <h4 className="font-semibold mt-2 text-slate-900">{linked.name}</h4>
                      {linked.description && (
                        <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                          {linked.description}
                        </p>
                      )}
                    </div>
                    <Link href={`/detail/${linked.id}`}>
                      <Button variant="outline" size="sm" className="flex-shrink-0">
                        View Spec
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
