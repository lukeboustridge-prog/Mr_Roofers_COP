'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  ChevronRight,
  Heart,
  Share2,
  FileText,
  BookOpen,
  AlertTriangle,
  Wrench,
  Loader2,
  ArrowUpRight,
  Check,
  Link2,
  ImageIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { DetailStageMetadata } from './Model3DViewer';
import { VentilationCheck } from './VentilationCheck';
import { ImageGallery } from './ImageGallery';
import { RelatedContentTab } from './RelatedContentTab';

// Dynamically import Model3DViewer to avoid loading Three.js on every page
const Model3DViewer = dynamic(
  () => import('./Model3DViewer').then((mod) => mod.Model3DViewer),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] w-full rounded-lg bg-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          <p className="text-sm text-slate-500">Loading 3D viewer...</p>
        </div>
      </div>
    ),
  }
);
import { StepByStep } from './StepByStep';
import { DynamicWarning } from '@/components/warnings/DynamicWarning';
import { LinkedFailuresList } from '@/components/warnings/CautionaryTag';
import {
  AuthoritativeContent,
  SupplementaryContent,
  SourceBadge,
  SourceAttribution,
} from '@/components/authority';
import { getAuthorityLevel } from '@/lib/constants';
import { useAppStore } from '@/stores/app-store';
import { cn } from '@/lib/utils';
import type { CopExcerptData } from '@/lib/cop-excerpt';
// Types imported from schema are replaced with local interface above

// Extended detail type for the viewer - flexible to accept database return types
interface DetailWithRelations {
  id: string;
  code: string;
  name: string;
  description: string | null;
  substrateId: string | null;
  categoryId: string | null;
  subcategoryId?: string | null;
  sourceId?: string | null;
  modelUrl: string | null;
  thumbnailUrl?: string | null;
  minPitch?: number | null;
  maxPitch?: number | null;
  specifications?: Record<string, unknown> | null;
  standardsRefs?: Array<{ code: string; clause: string; title: string }> | null;
  ventilationReqs?: Array<{ check: string; required: boolean }> | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  substrate?: { id: string; name: string };
  category?: { id: string; name: string };
  source?: { id: string; name: string; shortName: string };
  images?: string[] | null;  // R2 keys for MRM technical images
  steps?: Array<{
    id: string;
    detailId: string;
    stepNumber: number;
    instruction: string;
    imageUrl?: string | null;
    cautionNote?: string | null;
  }>;
  warnings?: Array<{
    id: string;
    detailId: string;
    conditionType: string;
    conditionValue: string;
    warningText: string;
    severity: 'info' | 'warning' | 'critical';
  }>;
  failures?: Array<{
    id: string;
    caseId: string;
    summary: string | null;
    outcome: 'upheld' | 'partially-upheld' | 'dismissed' | null;
    pdfUrl?: string | null;
  }>;
  supplements?: Array<{
    id: string;
    code: string;
    name: string;
    description: string | null;
    thumbnailUrl: string | null;
    modelUrl: string | null;
    sourceId: string | null;
    sourceName: string | null;
    linkType: 'installation_guide' | 'technical_supplement' | 'alternative';
    matchConfidence: 'exact' | 'partial' | 'related' | null;
    steps?: Array<{
      id: string;
      stepNumber: number;
      instruction: string;
      imageUrl?: string | null;
      cautionNote?: string | null;
    }>;
  }>;
  supplementsTo?: Array<{
    id: string;
    code: string;
    name: string;
    description: string | null;
    thumbnailUrl: string | null;
    modelUrl: string | null;
    sourceId: string | null;
    sourceName: string | null;
    linkType: 'installation_guide' | 'technical_supplement' | 'alternative';
    matchConfidence: 'exact' | 'partial' | 'related' | null;
  }>;
}

interface DetailViewerProps {
  detail: DetailWithRelations;
  stageMetadata?: DetailStageMetadata | null;
  copExcerpts?: CopExcerptData[];
  isLoading?: boolean;
  showBreadcrumb?: boolean;
}

export function DetailViewer({ detail, stageMetadata, copExcerpts, isLoading = false, showBreadcrumb = true }: DetailViewerProps) {
  const [isFavourite, setIsFavourite] = useState(false);
  const [isFavouriteLoading, setIsFavouriteLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [activeStep, setActiveStep] = useState(1);
  const { preferences } = useAppStore();

  // Check if this detail has 3D step synchronization
  const hasStepSync = stageMetadata !== null && stageMetadata !== undefined && (stageMetadata?.stages?.length ?? 0) > 0;

  // Determine content authority for visual styling
  const authority = getAuthorityLevel(detail.sourceId);
  const isAuthoritative = authority === 'authoritative';

  // Helper component for wrapping content sections with authority styling
  const ContentWrapper = ({ children, showWatermark = false }: { children: React.ReactNode; showWatermark?: boolean }) => {
    if (isAuthoritative) {
      return (
        <AuthoritativeContent showWatermark={showWatermark}>
          {children}
        </AuthoritativeContent>
      );
    }
    return (
      <SupplementaryContent>
        {children}
      </SupplementaryContent>
    );
  };

  // Find first linked RANZ guide with 3D model (for DETAIL-01)
  const linkedGuideWithModel = detail.supplements?.find(s => s.modelUrl !== null);

  // Determine what 3D model to display (prefer detail's own, fallback to linked)
  const display3DModelUrl = detail.modelUrl || linkedGuideWithModel?.modelUrl || null;
  const is3DModelBorrowed = !detail.modelUrl && !!linkedGuideWithModel?.modelUrl;

  // Find first linked RANZ guide with steps (for DETAIL-01)
  const linkedGuideWithSteps = detail.supplements?.find(s => (s.steps?.length ?? 0) > 0);

  // Helper to detect MRM section-reference steps (not real installation instructions)
  const isSectionRefStep = (instruction: string): boolean => {
    // Section-ref patterns: "5.1", "5.1A", "1", "4.7 Gutter Capacity Calculator", "ROOF DRAINAGE"
    const sectionRefPattern = /^\d+(\.\d+)*[A-Z]?(\s|$)/;

    // Installation verbs that indicate real instructions
    const installationVerbs = [
      'fit', 'fix', 'install', 'apply', 'cut', 'measure', 'position', 'secure',
      'seal', 'fold', 'bend', 'mark', 'drill', 'fasten', 'attach', 'place',
      'remove', 'trim', 'overlap', 'align'
    ];

    // Short instructions without installation verbs are likely section-refs
    const hasInstallationVerb = installationVerbs.some(verb =>
      instruction.toLowerCase().includes(verb)
    );

    return sectionRefPattern.test(instruction) ||
           (instruction.length < 40 && !hasInstallationVerb);
  };

  // Check if detail's own steps are MRM section-refs (not real installation instructions)
  const ownStepsAreSectionRefs = (detail.steps?.length ?? 0) > 0 &&
    detail.steps!.every(s => isSectionRefStep(s.instruction));

  // RANZ steps are primary when: detail has linked RANZ guide with steps AND
  // either detail has no own steps OR own steps are section-refs
  const isRanzStepsPrimary = (linkedGuideWithSteps?.steps?.length ?? 0) > 0 &&
    ((detail.steps?.length ?? 0) === 0 || ownStepsAreSectionRefs);

  // Determine display steps
  const displaySteps = isRanzStepsPrimary
    ? linkedGuideWithSteps?.steps || []
    : (detail.steps?.length ?? 0) > 0
      ? detail.steps
      : linkedGuideWithSteps?.steps || [];

  const areStepsBorrowed = isRanzStepsPrimary;

  // Check if COP excerpts should be displayed (only for MRM-only details with section-ref steps)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const hasCopExcerpts = (copExcerpts?.length ?? 0) > 0 && ownStepsAreSectionRefs && !isRanzStepsPrimary;

  // Check if detail has images for gallery
  const hasImages = (detail.images?.length ?? 0) > 0;

  // Check if detail has linked content for Related tab
  const hasLinkedContent = (detail.supplements?.length ?? 0) > 0 || (detail.supplementsTo?.length ?? 0) > 0;

  // Handle step change (called from either 3D viewer or step list)
  const handleStepChange = useCallback((stepNumber: number) => {
    setActiveStep(stepNumber);
  }, []);

  // Check if detail is favourited on mount
  useEffect(() => {
    const checkFavourite = async () => {
      try {
        const response = await fetch(`/api/favourites/${detail.id}`);
        if (response.ok) {
          const data = await response.json();
          setIsFavourite(data.data?.isFavourited ?? false);
        }
      } catch (error) {
        console.error('Failed to check favourite status:', error);
      }
    };
    checkFavourite();
  }, [detail.id]);

  // Record view on mount
  useEffect(() => {
    const recordView = async () => {
      try {
        await fetch('/api/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ detailId: detail.id }),
        });
      } catch (error) {
        console.error('Failed to record view:', error);
      }
    };
    recordView();
  }, [detail.id]);

  const handleToggleFavourite = useCallback(async () => {
    setIsFavouriteLoading(true);
    try {
      if (isFavourite) {
        const response = await fetch(`/api/favourites/${detail.id}`, {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to remove favourite');
        setIsFavourite(false);
        toast.success('Removed from favourites');
      } else {
        const response = await fetch('/api/favourites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ detailId: detail.id }),
        });
        if (!response.ok) throw new Error('Failed to add favourite');
        setIsFavourite(true);
        toast.success('Added to favourites');
      }
    } catch (error) {
      console.error('Failed to toggle favourite:', error);
      toast.error('Failed to update favourite');
    } finally {
      setIsFavouriteLoading(false);
    }
  }, [detail.id, isFavourite]);

  const handleShare = useCallback(async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${detail.code} - ${detail.name}`,
          text: detail.description || `View ${detail.name} roofing detail`,
          url,
        });
      } catch (error) {
        // User cancelled or share failed, fall back to copy
        if ((error as Error).name !== 'AbortError') {
          await copyToClipboard(url);
        }
      }
    } else {
      await copyToClipboard(url);
    }
  }, [detail]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Convert ventilation requirements to the format expected by VentilationCheck
  const ventilationChecks = (detail.ventilationReqs || []).map((req) => ({
    requirement: req.check,
    required: req.required,
  }));

  // Convert display steps (own or borrowed) to the format expected by StepByStep
  const steps = (displaySteps || []).map((step) => ({
    id: step.id,
    stepNumber: step.stepNumber,
    instruction: step.instruction,
    imageUrl: step.imageUrl,
    cautionNote: step.cautionNote,
  }));

  // Get active warnings based on user preferences
  const getWarningActiveStatus = (warning: { conditionType: string; conditionValue: string }): boolean => {
    switch (warning.conditionType) {
      case 'wind_zone':
        return preferences.windZone === warning.conditionValue;
      case 'corrosion_zone':
        return preferences.corrosionZone === warning.conditionValue;
      default:
        return true;
    }
  };

  if (isLoading) {
    return <DetailViewerSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb - can be disabled when parent page provides its own */}
      {showBreadcrumb && (
        <nav className="flex items-center text-sm text-slate-500">
          <Link href="/planner" className="hover:text-primary transition-colors">
            Planner
          </Link>
          <ChevronRight className="h-4 w-4 mx-1" />
          {detail.substrate && (
            <>
              <Link
                href={`/planner/${detail.substrate.id}`}
                className="hover:text-primary transition-colors"
              >
                {detail.substrate.name}
              </Link>
              <ChevronRight className="h-4 w-4 mx-1" />
            </>
          )}
          {detail.category && (
            <>
              <Link
                href={`/planner/${detail.substrate?.id}/${detail.category.id}`}
                className="hover:text-primary transition-colors"
              >
                {detail.category.name}
              </Link>
              <ChevronRight className="h-4 w-4 mx-1" />
            </>
          )}
          <span className="font-medium text-slate-900">{detail.code}</span>
        </nav>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            {detail.source && (
              <SourceBadge
                shortName={detail.source.shortName}
                name={detail.source.name}
                authority={authority}
                size="md"
                showIcon
              />
            )}
            <Badge variant="secondary" className="text-lg font-mono px-3 py-1">
              {detail.code}
            </Badge>
            {detail.substrate && (
              <Badge variant="outline">{detail.substrate.name}</Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{detail.name}</h1>
          {detail.description && (
            <p className="mt-2 text-slate-600 max-w-2xl">{detail.description}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleToggleFavourite}
                  disabled={isFavouriteLoading}
                  className={cn(
                    'h-10 w-10',
                    isFavourite && 'text-red-500 border-red-200 hover:bg-red-50'
                  )}
                >
                  {isFavouriteLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Heart
                      className={cn('h-5 w-5', isFavourite && 'fill-current')}
                    />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isFavourite ? 'Remove from favourites' : 'Add to favourites'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleShare} className="h-10 w-10">
                  {copied ? (
                    <Check className="h-5 w-5 text-green-600" />
                  ) : (
                    <Share2 className="h-5 w-5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {copied ? 'Link copied!' : 'Share this detail'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {detail.minPitch !== null && detail.minPitch !== undefined && (
          <Card className="p-3">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Min Pitch</p>
            <p className="text-lg font-semibold">{detail.minPitch}°</p>
          </Card>
        )}
        {detail.maxPitch !== null && detail.maxPitch !== undefined && (
          <Card className="p-3">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Max Pitch</p>
            <p className="text-lg font-semibold">{detail.maxPitch}°</p>
          </Card>
        )}
        {(detail.warnings?.length ?? 0) > 0 && (
          <Card className="p-3 border-amber-200 bg-amber-50">
            <p className="text-xs text-amber-600 uppercase tracking-wide">Warnings</p>
            <p className="text-lg font-semibold text-amber-700">
              {detail.warnings?.length}
            </p>
          </Card>
        )}
        {(detail.failures?.length ?? 0) > 0 && (
          <Card className="p-3 border-red-200 bg-red-50">
            <p className="text-xs text-red-600 uppercase tracking-wide">Case Law</p>
            <p className="text-lg font-semibold text-red-700">
              {detail.failures?.length}
            </p>
          </Card>
        )}
      </div>

      {/* 3D Model Viewer - Show if model exists (own or borrowed from linked guide) */}
      {display3DModelUrl && (
        <div className="space-y-3">
          {is3DModelBorrowed && linkedGuideWithModel && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <SourceAttribution
                shortName={linkedGuideWithModel.sourceName || 'RANZ'}
                name={linkedGuideWithModel.name}
                authority="supplementary"
              />
              <p className="text-sm text-slate-600 mt-2">
                3D model provided by linked installation guide
              </p>
            </div>
          )}
          <Model3DViewer
            modelUrl={display3DModelUrl}
            detailCode={detail.code}
            thumbnailUrl={detail.thumbnailUrl}
            activeStep={hasStepSync ? activeStep : undefined}
            stageMetadata={stageMetadata}
            onStepChange={hasStepSync ? handleStepChange : undefined}
          />
        </div>
      )}

      {/* Ventilation - Always Visible (Per Spec: Cannot be collapsed) */}
      {ventilationChecks.length > 0 && (
        <VentilationCheck checks={ventilationChecks} />
      )}

      {/* Main Content Tabs - Conditional based on available content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start h-auto flex-wrap gap-1 bg-transparent p-0 border-b rounded-none">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent px-4 py-2"
          >
            <FileText className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          {hasImages && (
            <TabsTrigger
              value="images"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent px-4 py-2"
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              Images
              <Badge variant="secondary" className="ml-2 text-xs">
                {detail.images?.length}
              </Badge>
            </TabsTrigger>
          )}
          {steps.length > 0 && (
            <TabsTrigger
              value="installation"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent px-4 py-2"
            >
              <Wrench className="h-4 w-4 mr-2" />
              Installation
              <Badge variant="secondary" className="ml-2 text-xs">
                {steps.length}
              </Badge>
            </TabsTrigger>
          )}
          {(detail.warnings?.length ?? 0) > 0 && (
            <TabsTrigger
              value="warnings"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent px-4 py-2"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Warnings
              <Badge className="ml-2 text-xs bg-amber-100 text-amber-700">
                {detail.warnings?.length}
              </Badge>
            </TabsTrigger>
          )}
          {hasLinkedContent && (
            <TabsTrigger
              value="related"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent px-4 py-2"
            >
              <Link2 className="h-4 w-4 mr-2" />
              Related
              <Badge variant="secondary" className="ml-2 text-xs">
                {(detail.supplements?.length ?? 0) + (detail.supplementsTo?.length ?? 0)}
              </Badge>
            </TabsTrigger>
          )}
          <TabsTrigger
            value="references"
            className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent px-4 py-2"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            References
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          {/* Specifications */}
          {detail.specifications && Object.keys(detail.specifications).length > 0 && (
            <ContentWrapper showWatermark={isAuthoritative}>
              <Card className="border-0 shadow-none bg-transparent">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-lg">Specifications</CardTitle>
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.entries(detail.specifications).map(([key, value]) => (
                      <div key={key} className="border-l-2 border-primary/20 pl-3">
                        <dt className="text-xs text-slate-500 uppercase tracking-wide">
                          {formatSpecKey(key)}
                        </dt>
                        <dd className="font-medium text-slate-900">{String(value)}</dd>
                      </div>
                    ))}
                  </dl>
                </CardContent>
              </Card>
            </ContentWrapper>
          )}

          {/* Linked Case Law */}
          {detail.failures && detail.failures.length > 0 && (
            <Card className="border-red-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-red-800">
                  <AlertTriangle className="h-5 w-5" />
                  Related Case Law
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LinkedFailuresList failures={detail.failures} />
              </CardContent>
            </Card>
          )}

          {/* Empty state */}
          {(!detail.specifications || Object.keys(detail.specifications).length === 0) &&
            (!detail.failures || detail.failures.length === 0) && (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="mx-auto h-12 w-12 text-slate-300" />
                  <p className="mt-4 text-slate-500">
                    Detailed specifications will be added in a future update.
                  </p>
                </CardContent>
              </Card>
            )}
        </TabsContent>

        {/* Images Tab - Only renders if hasImages is true */}
        {hasImages && detail.images && (
          <TabsContent value="images" className="mt-6">
            <ContentWrapper showWatermark={isAuthoritative}>
              <ImageGallery images={detail.images} detailCode={detail.code} />
            </ContentWrapper>
          </TabsContent>
        )}

        {/* Installation Tab - Only renders if steps exist */}
        {steps.length > 0 && (
          <TabsContent value="installation" className="mt-6">
            {areStepsBorrowed && linkedGuideWithSteps && (
              <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <SourceAttribution
                  shortName={linkedGuideWithSteps.sourceName || 'RANZ'}
                  name={linkedGuideWithSteps.name}
                  authority="supplementary"
                />
                <p className="text-sm text-slate-600 mt-2">
                  Installation steps provided by linked installation guide
                </p>
              </div>
            )}
            <ContentWrapper>
              <StepByStep
                steps={steps}
                activeStep={hasStepSync ? activeStep : undefined}
                onStepChange={hasStepSync ? handleStepChange : undefined}
              />
            </ContentWrapper>
          </TabsContent>
        )}

        {/* Warnings Tab - Only renders if warnings exist */}
        {(detail.warnings?.length ?? 0) > 0 && (
          <TabsContent value="warnings" className="mt-6 space-y-4">
            <p className="text-sm text-slate-600 mb-4">
              Warnings are evaluated based on your saved preferences. Inactive
              warnings may still apply depending on project conditions.
            </p>
            {detail.warnings!.map((warning) => (
              <DynamicWarning
                key={warning.id}
                level={warning.severity}
                message={warning.warningText}
                nzbcRef={warning.conditionValue}
                conditionType={warning.conditionType}
                conditionValue={warning.conditionValue}
                isActive={getWarningActiveStatus(warning)}
              />
            ))}
          </TabsContent>
        )}

        {/* Related Content Tab - Only renders if linked content exists */}
        {hasLinkedContent && (
          <TabsContent value="related" className="mt-6">
            <RelatedContentTab
              supplements={detail.supplements || []}
              supplementsTo={detail.supplementsTo || []}
            />
          </TabsContent>
        )}

        {/* References Tab */}
        <TabsContent value="references" className="mt-6 space-y-6">
          {/* Source Attribution */}
          {detail.source && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Content Source</CardTitle>
              </CardHeader>
              <CardContent>
                <SourceAttribution
                  shortName={detail.source.shortName}
                  name={detail.source.name}
                  authority={authority}
                  updatedAt={detail.updatedAt}
                />
              </CardContent>
            </Card>
          )}

          {/* Standards References */}
          {detail.standardsRefs && detail.standardsRefs.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Standards References</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {detail.standardsRefs.map((ref, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <Badge variant="outline" className="font-mono shrink-0">
                      {ref.code}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{ref.clause}</p>
                      <p className="text-sm text-slate-600">{ref.title}</p>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <a
                        href={`https://www.building.govt.nz/building-code-compliance/${ref.code.toLowerCase()}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : !detail.source ? (
            <Card>
              <CardContent className="p-8 text-center">
                <BookOpen className="mx-auto h-12 w-12 text-slate-300" />
                <p className="mt-4 text-slate-500">
                  Standards references will be added in a future update.
                </p>
              </CardContent>
            </Card>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper to format specification keys
function formatSpecKey(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .replace(/_/g, ' ')
    .trim();
}

// Loading skeleton
function DetailViewerSkeleton() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-20" />
      </div>

      {/* Header skeleton */}
      <div className="flex justify-between">
        <div className="space-y-3">
          <div className="flex gap-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-32" />
          </div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-10" />
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>

      {/* 3D Viewer skeleton */}
      <Skeleton className="h-[400px] w-full rounded-lg" />

      {/* Ventilation skeleton */}
      <Skeleton className="h-32 w-full" />

      {/* Tabs skeleton */}
      <div className="space-y-4">
        <div className="flex gap-4 border-b pb-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  );
}

// Export skeleton for use elsewhere
export { DetailViewerSkeleton };
