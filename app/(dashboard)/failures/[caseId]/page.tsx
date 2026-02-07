import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Scale,
  FileText,
  Calendar,
  Gavel,
  ClipboardList,
  ExternalLink,
} from 'lucide-react';
import { getFailureCaseById } from '@/lib/db/queries';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { createBreadcrumbItems } from '@/lib/breadcrumb-utils';

interface CaseLawPageProps {
  params: { caseId: string };
}

const outcomeColors: Record<string, string> = {
  'upheld': 'bg-red-100 text-red-800 border-red-200',
  'partially-upheld': 'bg-amber-100 text-amber-800 border-amber-200',
  'dismissed': 'bg-green-100 text-green-800 border-green-200',
  'not-upheld': 'bg-green-100 text-green-800 border-green-200',
};

export default async function CaseLawDetailPage({ params }: CaseLawPageProps) {
  const { caseId } = params;
  const caseData = await getFailureCaseById(caseId);

  if (!caseData) {
    notFound();
  }

  const caseType = (caseData as unknown as { caseType?: string }).caseType || 'determination';
  const pdfUrl = (caseData as unknown as { pdfUrl?: string }).pdfUrl;
  const CaseIcon = caseType === 'determination' ? Gavel : ClipboardList;
  const caseTypeLabel = caseType === 'determination' ? 'MBIE Determination' : 'LBP Complaint Decision';

  return (
    <div className="container max-w-4xl p-4 md:p-6 lg:p-8 pb-24">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={createBreadcrumbItems('failures', {
          failureCase: { id: caseId, caseId: caseData.caseId },
        })}
        className="mb-4"
      />

      {/* Back Button */}
      <Link href="/failures">
        <Button variant="ghost" className="mb-4 -ml-2">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Case Law
        </Button>
      </Link>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <CaseIcon className="h-5 w-5 text-primary" />
          <Badge variant="outline" className="font-mono text-lg">
            {caseData.caseId}
          </Badge>
          <Badge variant="secondary">
            {caseTypeLabel}
          </Badge>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {caseData.outcome && (
            <Badge className={outcomeColors[caseData.outcome] || 'bg-slate-100'}>
              {caseData.outcome.replace('-', ' ')}
            </Badge>
          )}
          {caseData.decisionDate && (
            <div className="flex items-center gap-1 text-sm text-slate-500">
              <Calendar className="h-4 w-4" />
              {new Date(caseData.decisionDate).toLocaleDateString('en-NZ', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Executive Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              Executive Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 whitespace-pre-line leading-relaxed">
              {caseData.summary || 'No summary available for this case.'}
            </p>
            {caseData.failureType && (
              <div className="mt-4">
                <Badge variant="secondary" className="capitalize">
                  {caseData.failureType.replace('-', ' ')}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* View Full PDF */}
        {pdfUrl && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-3">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Full Decision Document</p>
                    <p className="text-sm text-slate-500">View the complete {caseTypeLabel.toLowerCase()}</p>
                  </div>
                </div>
                <Link href={pdfUrl} target="_blank" rel="noopener noreferrer">
                  <Button className="w-full sm:w-auto">
                    <FileText className="mr-2 h-4 w-4" />
                    View PDF
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Related Details */}
        {caseData.relatedDetails && caseData.relatedDetails.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Related Details</CardTitle>
              <CardDescription>
                COP details relevant to this case
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {caseData.relatedDetails.map((detail) => (
                <Link
                  key={detail.id}
                  href={`/planner/${detail.substrateId}/${detail.categoryId}/${detail.id}`}
                  className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-slate-50"
                >
                  <FileText className="h-5 w-5 text-slate-500" />
                  <Badge variant="outline" className="font-mono">
                    {detail.code}
                  </Badge>
                  <span className="text-sm text-slate-600">
                    {detail.name}
                  </span>
                </Link>
              ))}
            </CardContent>
          </Card>
        )}

        {/* References */}
        {((caseData.nzbcClauses as string[] | null)?.length || (caseData.substrateTags as string[] | null)?.length) && (
          <Card>
            <CardHeader>
              <CardTitle>References</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(caseData.nzbcClauses as string[] | null)?.map((clause) => (
                  <Badge key={clause} variant="secondary">
                    Clause {clause}
                  </Badge>
                ))}
                {(caseData.substrateTags as string[] | null)?.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Original Source Link (fallback if no PDF) */}
        {!pdfUrl && caseData.sourceUrl && (
          <a
            href={caseData.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-lg border p-4 text-primary hover:bg-slate-50"
          >
            <ExternalLink className="h-4 w-4" />
            View Original Decision on MBIE Website
          </a>
        )}
      </div>
    </div>
  );
}
