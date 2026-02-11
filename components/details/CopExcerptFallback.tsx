'use client';

import Link from 'next/link';
import { BookOpen, ArrowUpRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { CopExcerptData } from '@/lib/cop-excerpt';
import { cn } from '@/lib/utils';

interface CopExcerptFallbackProps {
  excerpts: CopExcerptData[];
  className?: string;
}

export function CopExcerptFallback({ excerpts, className }: CopExcerptFallbackProps) {
  // Return null if no excerpts (DetailViewer handles fallback)
  if (excerpts.length === 0) {
    return null;
  }

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          COP Reference Sections
        </CardTitle>
        <CardDescription>
          This detail references the following Code of Practice sections
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {excerpts.map((excerpt) => (
          <div
            key={excerpt.sectionNumber}
            className="rounded-lg border bg-white p-4 space-y-2"
          >
            {/* Section header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <Badge variant="outline" className="font-mono mb-1">
                  Section {excerpt.sectionNumber}
                </Badge>
                <h4 className="font-medium text-slate-900">{excerpt.title}</h4>
                <p className="text-xs text-slate-500">
                  Chapter {excerpt.chapterNumber}: {excerpt.chapterTitle}
                </p>
              </div>
            </div>

            {/* Excerpt text */}
            <p className="text-sm text-slate-600 leading-relaxed">
              {excerpt.excerpt}
            </p>

            {/* Deep-link button */}
            <Link href={excerpt.deepLinkUrl}>
              <Button variant="outline" size="sm" className="mt-2">
                <BookOpen className="h-4 w-4 mr-2" />
                Read full section in COP
                <ArrowUpRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
