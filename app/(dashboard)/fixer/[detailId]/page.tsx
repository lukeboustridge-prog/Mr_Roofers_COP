import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { getDetailById, getSubstrateById } from '@/lib/db/queries';
import { getDetailWithLinks } from '@/lib/db/queries/detail-links';
import { getHtgForDetail } from '@/lib/db/queries/htg-detail';
import { getCopSectionsForDetail } from '@/lib/db/queries/cross-links';
import { DetailViewer } from '@/components/details/DetailViewer';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { getStageMetadataForLinkedGuide } from '@/lib/stage-metadata';
import { FIXER_TASKS } from '@/lib/constants';
import { resolveCopExcerpts } from '@/lib/cop-excerpt';

interface FixerDetailPageProps {
  params: { detailId: string };
  searchParams: { substrate?: string; task?: string };
}

export default async function FixerDetailPage({ params, searchParams }: FixerDetailPageProps) {
  const { detailId } = params;

  // Fetch detail with all related data INCLUDING linked content
  const [detail, detailWithLinks, htgContent, copSectionLinks] = await Promise.all([
    getDetailById(detailId),
    getDetailWithLinks(detailId),
    getHtgForDetail(detailId),
    getCopSectionsForDetail(detailId),
  ]);

  if (!detail) {
    notFound();
  }

  // Get substrate for breadcrumbs and back navigation
  const substrate = detail.substrateId
    ? await getSubstrateById(detail.substrateId)
    : null;

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

  // Determine fixer context for back-navigation
  const substrateId = searchParams.substrate || detail.substrateId || '';
  const taskId = searchParams.task || '';
  const task = FIXER_TASKS.find((t) => t.id === taskId);

  const substrateName = substrate?.name || substrateId
    .split('-')
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Build fixer breadcrumbs: Fixer > Substrate > Task > Detail Code
  const breadcrumbItems = [
    { label: 'Fixer', href: '/fixer' },
    ...(substrateId ? [{
      label: substrateName,
      href: `/fixer?substrate=${substrateId}`,
    }] : []),
    ...(task ? [{
      label: task.name,
      href: `/fixer/results?substrate=${substrateId}&task=${taskId}`,
    }] : []),
    { label: detail.code },
  ];

  // Build back link preserving fixer context
  const backHref = substrateId && taskId
    ? `/fixer/results?substrate=${substrateId}&task=${taskId}`
    : substrateId
    ? `/fixer/results?substrate=${substrateId}`
    : '/fixer';

  const backLabel = task ? task.name : substrateName || 'Results';

  // Transform the data to match DetailViewer expectations
  const detailWithRelations = {
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
    warnings: detail.warnings?.map((w) => ({
      id: w.id,
      detailId: w.detailId || detail.id,
      conditionType: w.conditionType as 'wind_zone' | 'corrosion_zone' | 'pitch' | 'exposure' | 'other',
      conditionValue: w.conditionValue,
      warningText: w.warningText,
      severity: (w.severity || 'warning') as 'info' | 'warning' | 'critical',
    })),
    failures: detail.failures?.map((f) => ({
      id: f.id,
      caseId: f.caseId,
      summary: f.summary,
      outcome: f.outcome as 'upheld' | 'partially-upheld' | 'dismissed' | null,
      pdfUrl: f.pdfUrl,
      failureType: f.failureType,
      caseType: f.caseType,
    })),
    supplements: detailWithLinks?.supplements,
    supplementsTo: detailWithLinks?.supplementsTo,
  };

  return (
    <div className="container max-w-6xl p-4 md:p-6 lg:p-8 pb-24">
      {/* Breadcrumbs */}
      <Breadcrumbs items={breadcrumbItems} className="mb-4" />

      {/* Back Button */}
      <Link href={backHref}>
        <Button variant="ghost" className="mb-4 -ml-2 min-h-[48px]">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {backLabel}
        </Button>
      </Link>

      {/* Main Detail Content */}
      <DetailViewer
        detail={detailWithRelations}
        stageMetadata={stageMetadata}
        copExcerpts={copExcerpts}
        htgContent={htgContent}
        copSectionLinks={copSectionLinks}
        showBreadcrumb={false}
      />
    </div>
  );
}

// Force dynamic rendering
export const dynamic = 'force-dynamic';
