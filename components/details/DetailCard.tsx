'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, AlertTriangle } from 'lucide-react';

interface DetailCardProps {
  code: string;
  name: string;
  substrate: string;
  hasWarning?: boolean;
  failureCount?: number;
  href: string;
}

export function DetailCard({
  code,
  name,
  substrate,
  hasWarning = false,
  failureCount = 0,
  href,
}: DetailCardProps) {
  return (
    <Link href={href}>
      <Card className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
              <FileText className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono">
                  {code}
                </Badge>
                <span className="font-medium text-slate-900">{name}</span>
              </div>
              <p className="text-sm text-slate-500">{substrate}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasWarning && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                <AlertTriangle className="mr-1 h-3 w-3" />
                Warning
              </Badge>
            )}
            {failureCount > 0 && (
              <Badge variant="secondary" className="bg-red-100 text-red-700">
                {failureCount} failure{failureCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
