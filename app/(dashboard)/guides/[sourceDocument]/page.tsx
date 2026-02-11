import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, ArrowUpRight } from 'lucide-react';
import { getHtgGuidePages, getHtgPageWithCopLinks } from '@/lib/db/queries/htg-guides';

const GUIDE_META: Record<string, { title: string; topic: string }> = {
  flashings: { title: 'RANZ Metal Roof Flashings Guide', topic: 'Flashings' },
  penetrations: { title: 'RANZ Metal Roof Penetrations Guide', topic: 'Penetrations' },
  cladding: { title: 'RANZ Metal Wall Cladding Guide', topic: 'Cladding' },
};

interface Props {
  params: Promise<{ sourceDocument: string }>;
}

export default async function GuideDetailPage({ params }: Props) {
  const { sourceDocument } = await params;
  const meta = GUIDE_META[sourceDocument];
  if (!meta) notFound();

  const pages = await getHtgGuidePages(sourceDocument);
  if (pages.length === 0) notFound();

  // Fetch COP links for all pages in parallel
  const pagesWithLinks = await Promise.all(
    pages.map((page) => getHtgPageWithCopLinks(page.id))
  );

  return (
    <div className="container max-w-4xl p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/guides"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          All Guides
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
          {meta.title}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {pages.length} pages &middot; {meta.topic}
        </p>
      </div>

      {/* Page Navigation */}
      <nav className="mb-8 rounded-lg border bg-slate-50 p-4">
        <p className="text-sm font-medium text-slate-700 mb-3">Contents</p>
        <div className="flex flex-wrap gap-2">
          {pages.map((page) => (
            <a
              key={page.id}
              href={`#page-${page.pdfPage}`}
              className="inline-flex items-center gap-1 rounded-md border bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-colors"
            >
              <FileText className="h-3.5 w-3.5" />
              Page {page.pdfPage}
            </a>
          ))}
        </div>
      </nav>

      {/* Page Content */}
      <div className="space-y-6">
        {pagesWithLinks.map((page) => {
          if (!page) return null;

          return (
            <Card key={page.id} id={`page-${page.pdfPage}`} className="scroll-mt-20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="outline" className="font-mono text-xs">
                    Page {page.pdfPage}
                  </Badge>
                </div>

                {/* Content */}
                <div className="prose prose-sm prose-slate max-w-none">
                  {page.content ? (
                    page.content.split('\n').map((paragraph, i) => {
                      const trimmed = paragraph.trim();
                      if (!trimmed) return null;
                      return (
                        <p key={i} className="text-slate-700 leading-relaxed mb-3">
                          {trimmed}
                        </p>
                      );
                    })
                  ) : (
                    <p className="text-slate-400 italic">No content available for this page.</p>
                  )}
                </div>

                {/* COP Section Links */}
                {page.copLinks.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                      Related COP Sections
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {page.copLinks.map((link) => (
                        <Link
                          key={link.sectionId}
                          href={`/cop/${link.chapterNumber}#section-${link.sectionNumber}`}
                          className="inline-flex items-center gap-1 rounded-md border bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                        >
                          COP &sect;{link.sectionNumber}
                          {link.sectionTitle && (
                            <span className="text-blue-500 max-w-[200px] truncate">
                              &mdash; {link.sectionTitle}
                            </span>
                          )}
                          <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
