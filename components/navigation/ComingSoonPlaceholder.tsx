import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface ComingSoonPlaceholderProps {
  title: string;
  subtitle?: string;
  showBrowseButtons?: boolean;
  className?: string;
}

/**
 * Empty state placeholder for sections without content.
 * Used when a topic or substrate has no details available yet.
 * Provides navigation options to other sections.
 */
export function ComingSoonPlaceholder({
  title,
  subtitle,
  showBrowseButtons = true,
  className,
}: ComingSoonPlaceholderProps) {
  return (
    <Card className={cn('border-dashed', className)}>
      <CardContent className="p-12 text-center">
        <div className="mx-auto w-fit rounded-full bg-slate-100 p-4">
          <FileText className="h-12 w-12 text-slate-400" />
        </div>
        <h3 className="mt-6 text-lg font-semibold text-slate-900">
          Coming Soon
        </h3>
        <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
          {title} details are currently being prepared.
          {subtitle && ` ${subtitle}.`}
          {!subtitle && ' Check back soon or explore other areas.'}
        </p>
        {showBrowseButtons && (
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/planner">
              <Button variant="outline">Browse Topics</Button>
            </Link>
            <Link href="/search">
              <Button>Search All Details</Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
