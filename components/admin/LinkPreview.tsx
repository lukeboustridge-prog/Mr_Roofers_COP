'use client';

import { ArrowRight, Box, BookOpen, Library } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface LinkPreviewProps {
  primary: {
    code: string;
    name: string;
    sourceId: string;
  };
  supplementary: {
    code: string;
    name: string;
    sourceId: string;
    hasModel?: boolean;
  };
}

function getSourceBadge(sourceId: string) {
  const isMRM = sourceId === 'mrm-cop';
  return {
    label: isMRM ? 'MRM' : 'RANZ',
    icon: isMRM ? BookOpen : Library,
    className: isMRM
      ? 'bg-primary/10 text-primary border-primary/20'
      : 'bg-slate-100 text-slate-600 border-slate-200',
  };
}

export function LinkPreview({ primary, supplementary }: LinkPreviewProps) {
  const primarySource = getSourceBadge(primary.sourceId);
  const supplementarySource = getSourceBadge(supplementary.sourceId);
  const PrimaryIcon = primarySource.icon;
  const SupplementaryIcon = supplementarySource.icon;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border">
      {/* Primary Detail */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="outline" className={primarySource.className}>
            <PrimaryIcon className="h-3 w-3 mr-1" />
            {primarySource.label}
          </Badge>
          <span className="font-mono text-sm font-medium">{primary.code}</span>
        </div>
        <p className="text-sm text-slate-600 truncate">{primary.name}</p>
      </div>

      {/* Arrow */}
      <ArrowRight className="h-5 w-5 text-slate-400 flex-shrink-0" />

      {/* Supplementary Detail */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="outline" className={supplementarySource.className}>
            <SupplementaryIcon className="h-3 w-3 mr-1" />
            {supplementarySource.label}
          </Badge>
          <span className="font-mono text-sm font-medium">{supplementary.code}</span>
          {supplementary.hasModel && (
            <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
              <Box className="h-3 w-3 mr-1" />
              3D
            </Badge>
          )}
        </div>
        <p className="text-sm text-slate-600 truncate">{supplementary.name}</p>
      </div>
    </div>
  );
}
