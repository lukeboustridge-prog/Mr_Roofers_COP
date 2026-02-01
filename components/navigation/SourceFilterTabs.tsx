'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Library } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SourceFilterTabsProps {
  allCount: number;
  mrmCount: number;
  ranzCount: number;
  children: React.ReactNode;
  className?: string;
}

/**
 * Source filter tabs component for unified navigation.
 * Allows filtering content by source (All / MRM COP / RANZ Guide).
 * Syncs active tab state to URL searchParams for shareable links.
 */
export function SourceFilterTabs({
  allCount,
  mrmCount,
  ranzCount,
  children,
  className,
}: SourceFilterTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeSource = searchParams.get('source') || 'all';

  const handleSourceChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') {
      params.delete('source');
    } else {
      params.set('source', value);
    }
    const queryString = params.toString();
    router.replace(`${pathname}${queryString ? `?${queryString}` : ''}`, { scroll: false });
  };

  return (
    <Tabs
      value={activeSource}
      onValueChange={handleSourceChange}
      className={cn('w-full', className)}
    >
      <TabsList className="w-full justify-start flex-wrap h-auto gap-1 bg-slate-100 p-1">
        <TabsTrigger
          value="all"
          className="gap-2 data-[state=active]:bg-white"
          aria-label={`All Sources, ${allCount} items`}
        >
          All Sources
          <Badge variant="secondary" className="ml-1 bg-slate-200 text-slate-700">
            {allCount}
          </Badge>
        </TabsTrigger>
        <TabsTrigger
          value="mrm-cop"
          className="gap-2 data-[state=active]:bg-white"
          aria-label={`MRM COP authoritative content, ${mrmCount} items`}
        >
          <BookOpen className="h-4 w-4 text-blue-500" />
          MRM COP
          <Badge variant="secondary" className="ml-1 bg-blue-100 text-blue-700">
            {mrmCount}
          </Badge>
        </TabsTrigger>
        <TabsTrigger
          value="ranz-guide"
          className="gap-2 data-[state=active]:bg-white"
          aria-label={`RANZ Guide supplementary content, ${ranzCount} items`}
        >
          <Library className="h-4 w-4 text-slate-500" />
          RANZ Guide
          <Badge variant="secondary" className="ml-1 bg-slate-200 text-slate-700">
            {ranzCount}
          </Badge>
        </TabsTrigger>
      </TabsList>
      <TabsContent value={activeSource} className="mt-4">
        {children}
      </TabsContent>
    </Tabs>
  );
}
