'use client';

import Link from 'next/link';
import { Box, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SourceBadge } from '@/components/authority';
import type { SupplementaryDetail } from '@/types/cop';
import { cn } from '@/lib/utils';

interface SupplementaryDetailCardProps {
  detail: SupplementaryDetail;
}

/**
 * Renders a linked detail as a compact card inside a SupplementaryPanel.
 * Shows: detail code badge, name, description (truncated), 3D model indicator, source badge.
 */
export function SupplementaryDetailCard({ detail }: SupplementaryDetailCardProps) {
  return (
    <Link
      href={`/fixer/${detail.id}`}
      className={cn(
        'block rounded-lg border border-slate-200 bg-white p-3',
        'hover:border-slate-300 hover:shadow-sm transition-all',
        'group'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Header: Code badge + model indicator */}
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-xs font-mono">
              {detail.code}
            </Badge>
            {detail.modelUrl && (
              <Badge variant="secondary" className="text-xs">
                <Box className="h-3 w-3 mr-1" />
                3D
              </Badge>
            )}
          </div>

          {/* Title */}
          <h4 className="text-sm font-medium text-slate-900 mb-1 group-hover:text-primary transition-colors">
            {detail.name}
          </h4>

          {/* Description (2-line clamp) */}
          {detail.description && (
            <p className="text-xs text-slate-600 line-clamp-2 mb-2">
              {detail.description}
            </p>
          )}

          {/* Footer: Source badge + relationship type */}
          <div className="flex items-center gap-2">
            <SourceBadge
              shortName={detail.sourceName}
              authority="supplementary"
              size="sm"
            />
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 capitalize">
              {detail.relationshipType}
            </span>
          </div>
        </div>

        {/* Arrow icon */}
        <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
      </div>
    </Link>
  );
}
