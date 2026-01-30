import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  AlertTriangle,
  ExternalLink,
  Calendar,
  FileText,
} from 'lucide-react';
import { getFailureCaseById } from '@/lib/db/queries';

interface FailureCasePageProps {
  params: { caseId: string };
}

export default async function FailureCaseDetailPage({ params }: FailureCasePageProps) {
  const { caseId } = params;
  const caseData = await getFailureCaseById(caseId);

  if (!caseData) {
    notFound();
  }
  return (
    <div className="container max-w-4xl p-4 md:p-6 lg:p-8">
      {/* Back Button */}
      <Link href="/failures">
        <Button variant="ghost" className="mb-4 -ml-2">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Failure Cases
        </Button>
      </Link>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <Badge variant="outline" className="font-mono text-lg">
            {caseData.caseId}
          </Badge>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">
          {caseData.summary}
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {caseData.outcome && (
            <Badge className="bg-red-100 text-red-800 border-red-200">
              {caseData.outcome}
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
        {/* Description */}
        <Card>
          <CardHeader>
            <CardTitle>Case Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 whitespace-pre-line">
              {caseData.summary}
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

        {/* Related Details */}
        {caseData.relatedDetails && caseData.relatedDetails.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Related Details</CardTitle>
              <CardDescription>
                COP details relevant to this failure case
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

        {/* Source Link */}
        {caseData.sourceUrl && (
          <a
            href={caseData.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-lg border p-4 text-primary hover:bg-slate-50"
          >
            <ExternalLink className="h-4 w-4" />
            View Original Decision
          </a>
        )}
      </div>
    </div>
  );
}
