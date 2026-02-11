import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ClipboardCheck } from 'lucide-react';
import { getDetailById, getSubstrateById, getCategoryById } from '@/lib/db/queries';
import { getDetailWithLinks } from '@/lib/db/queries/detail-links';
import { DetailViewer } from '@/components/details/DetailViewer';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { createBreadcrumbItems } from '@/lib/breadcrumb-utils';
import { getStageMetadataForLinkedGuide } from '@/lib/stage-metadata';
import { resolveCopExcerpts } from '@/lib/cop-excerpt';

interface DetailPageProps {
  params: { substrate: string; category: string; detailId: string };
}

export default async function DetailPage({ params }: DetailPageProps) {
  const { substrate: substrateId, category: categoryId, detailId } = params;

  // Fetch detail with all related data INCLUDING linked content
  const [detail, detailWithLinks] = await Promise.all([
    getDetailById(detailId),
    getDetailWithLinks(detailId),
  ]);

  if (!detail) {
    notFound();
  }

  // Fetch substrate and category for back navigation (in case detail doesn't have them)
  const [substrate, category] = await Promise.all([
    getSubstrateById(substrateId),
    getCategoryById(categoryId),
  ]);

  // Load stage metadata for RANZ details or linked RANZ guides (3D step synchronization)
  const stageMetadata = getStageMetadataForLinkedGuide(
    detail.id,
    detailWithLinks?.supplements?.map(s => ({ id: s.id, modelUrl: s.modelUrl }))
  );

  // Resolve COP excerpts for MRM-only details (those without RANZ linked guide with steps)
  const hasLinkedSteps = detailWithLinks?.supplements?.some(s => (s.steps?.length ?? 0) > 0);
  const shouldResolveCopExcerpts = (detail.steps?.length ?? 0) > 0 && !hasLinkedSteps;
  const copExcerpts = shouldResolveCopExcerpts
    ? resolveCopExcerpts(
        detail.steps!.map(s => ({
          instruction: s.instruction,
          stepNumber: s.stepNumber,
        }))
      )
    : undefined;

  const categoryName = category?.name || categoryId
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Transform the data to match DetailViewer expectations
  const detailWithRelations = {
    // Base detail fields
    id: detail.id,
    code: detail.code,
    name: detail.name,
    description: detail.description,
    substrateId: detail.substrateId,
    categoryId: detail.categoryId,
    subcategoryId: detail.subcategoryId,
    modelUrl: detail.modelUrl,
    thumbnailUrl: detail.thumbnailUrl,
    images: detail.images,
    minPitch: detail.minPitch,
    maxPitch: detail.maxPitch,
    specifications: detail.specifications as Record<string, unknown> | null,
    standardsRefs: detail.standardsRefs as Array<{ code: string; clause: string; title: string }> | null,
    ventilationReqs: detail.ventilationReqs as Array<{ check: string; required: boolean }> | null,
    createdAt: detail.createdAt,
    updatedAt: detail.updatedAt,
    // Related data
    substrate: detail.substrate ? {
      id: detail.substrate.id,
      name: detail.substrate.name,
    } : substrate ? {
      id: substrate.id,
      name: substrate.name,
    } : undefined,
    category: detail.category ? {
      id: detail.category.id,
      name: detail.category.name,
    } : category ? {
      id: category.id,
      name: category.name,
    } : undefined,
    source: detail.source ? {
      id: detail.source.id,
      name: detail.source.name,
      shortName: detail.source.shortName,
    } : undefined,
    sourceId: detail.sourceId,
    steps: detail.steps?.map((s) => ({
      ...s,
      detailId: s.detailId || detail.id,
    })),
    // Transform warnings to ensure correct typing
    warnings: detail.warnings?.map((w) => ({
      id: w.id,
      detailId: w.detailId || detail.id,
      conditionType: w.conditionType as 'wind_zone' | 'corrosion_zone' | 'pitch' | 'exposure' | 'other',
      conditionValue: w.conditionValue,
      warningText: w.warningText,
      severity: (w.severity || 'warning') as 'info' | 'warning' | 'critical',
    })),
    // Transform failures to match expected format
    failures: detail.failures?.map((f) => ({
      id: f.id,
      caseId: f.caseId,
      summary: f.summary,
      outcome: f.outcome as 'upheld' | 'partially-upheld' | 'dismissed' | null,
      pdfUrl: f.pdfUrl,
    })),
    // Add linked content from getDetailWithLinks
    supplements: detailWithLinks?.supplements,
    supplementsTo: detailWithLinks?.supplementsTo,
  };

  const substrateName = substrate?.name || substrateId;

  return (
    <div className="container max-w-6xl p-4 md:p-6 lg:p-8 pb-24">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={createBreadcrumbItems('planner', {
          substrate: { id: substrateId, name: substrateName },
          category: { id: categoryId, name: categoryName },
          detail: { id: detailId, code: detail.code },
        })}
        className="mb-4"
      />

      {/* Back Button */}
      <Link href={`/planner/${substrateId}/${categoryId}`}>
        <Button variant="ghost" className="mb-4 -ml-2 min-h-[48px]">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {categoryName}
        </Button>
      </Link>

      {/* Main Detail Content */}
      <DetailViewer
        detail={detailWithRelations}
        stageMetadata={stageMetadata}
        copExcerpts={copExcerpts}
        showBreadcrumb={false}
      />

      {/* Floating QA Checklist Button (Mobile) */}
      <div className="fixed bottom-20 right-4 md:hidden z-40">
        <Link href={`/planner/${substrateId}/${categoryId}/${detailId}/checklist`}>
          <Button
            size="lg"
            className="h-14 w-14 rounded-full shadow-lg bg-green-600 hover:bg-green-700"
            aria-label="Start QA Checklist"
          >
            <ClipboardCheck className="h-6 w-6" />
          </Button>
        </Link>
      </div>

      {/* Desktop QA Checklist CTA */}
      <div className="hidden md:block mt-8">
        <div className="rounded-lg border border-green-200 bg-green-50 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <ClipboardCheck className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-green-900">Ready to Install?</h3>
                <p className="text-sm text-green-700">
                  Start a QA checklist to track your installation progress and create records.
                </p>
              </div>
            </div>
            <Link href={`/planner/${substrateId}/${categoryId}/${detailId}/checklist`}>
              <Button className="bg-green-600 hover:bg-green-700 min-h-[48px]">
                Start QA Checklist
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Force dynamic rendering
export const dynamic = 'force-dynamic';
