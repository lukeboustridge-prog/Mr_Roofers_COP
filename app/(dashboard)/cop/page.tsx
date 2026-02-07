import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen } from 'lucide-react';
import type { CopChapterMeta } from '@/types/cop';

export default function CopPage() {
  // Load chapter metadata from all 19 chapter JSON files
  const chapters: CopChapterMeta[] = [];

  for (let i = 1; i <= 19; i++) {
    const chapterPath = path.join(process.cwd(), 'public', 'cop', `chapter-${i}.json`);
    const chapterData = JSON.parse(fs.readFileSync(chapterPath, 'utf-8'));

    // Extract only metadata (don't load full sections array)
    chapters.push({
      chapterNumber: chapterData.chapterNumber,
      title: chapterData.title,
      version: chapterData.version,
      sectionCount: chapterData.sectionCount,
    });
  }

  // Extract version from first chapter (all chapters share the same version)
  const version = chapters[0]?.version || 'v25.12';

  return (
    <div className="container max-w-6xl p-4 md:p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
          Code of Practice
        </h1>
        <p className="mt-2 text-slate-600">
          {version} — 1 December 2025
        </p>
        <p className="mt-1 text-sm text-slate-500">
          NZ Metal Roof and Wall Cladding Code of Practice
        </p>
      </div>

      {/* Chapter Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {chapters.map((chapter) => (
          <Link key={chapter.chapterNumber} href={`/cop/${chapter.chapterNumber}`}>
            <Card className="h-full cursor-pointer transition-all hover:shadow-lg hover:border-primary/50">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <BookOpen className="h-8 w-8" />
                  </div>
                  <Badge variant="secondary">
                    Chapter {chapter.chapterNumber}
                  </Badge>
                </div>
                <CardTitle className="mt-4 text-lg">{chapter.title}</CardTitle>
                <CardDescription>
                  {chapter.sectionCount} sections
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
