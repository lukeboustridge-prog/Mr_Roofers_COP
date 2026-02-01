'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import { SourceBadge, ContentCapabilityBadges } from '@/components/authority';
import { getAuthorityLevel } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface DetailCardProps {
  code: string;
  name: string;
  substrate: string;
  sourceId?: string | null;
  sourceShortName?: string;
  has3DModel?: boolean;
  hasSteps?: boolean;
  hasWarning?: boolean;
  warningCount?: number;
  failureCount?: number;
  href: string;
}

export function DetailCard({
  code,
  name,
  substrate,
  sourceId,
  sourceShortName,
  has3DModel = false,
  hasSteps = false,
  hasWarning = false,
  warningCount = 0,
  failureCount = 0,
  href,
}: DetailCardProps) {
  const authority = getAuthorityLevel(sourceId);
  const isAuthoritative = authority === 'authoritative';

  return (
    <Link href={href}>
      <Card
        className={cn(
          'cursor-pointer transition-all hover:shadow-md',
          isAuthoritative
            ? 'hover:border-primary/50'
            : 'hover:border-slate-300'
        )}
      >
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg',
                isAuthoritative
                  ? 'bg-primary/10'
                  : 'bg-slate-100'
              )}
            >
              <FileText
                className={cn(
                  'h-5 w-5',
                  isAuthoritative
                    ? 'text-primary'
                    : 'text-slate-600'
                )}
              />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                {sourceShortName && (
                  <SourceBadge
                    shortName={sourceShortName}
                    authority={authority}
                    size="sm"
                  />
                )}
                <Badge variant="outline" className="font-mono">
                  {code}
                </Badge>
                <span className="font-medium text-slate-900">{name}</span>
              </div>
              <p className="text-sm text-slate-500">{substrate}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ContentCapabilityBadges
              capabilities={{
                has3DModel: has3DModel,
                hasSteps: hasSteps,
                hasWarnings: warningCount > 0 || hasWarning === true,
                hasCaseLaw: failureCount > 0,
              }}
            />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
