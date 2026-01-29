'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
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
import { Model3DViewer, DetailStageMetadata } from './Model3DViewer';
import { VentilationCheck } from './VentilationCheck';
import { StepByStep } from './StepByStep';
import { SourceBadge, SourceAttribution } from './SourceBadge';
import { DynamicWarning } from '@/components/warnings/DynamicWarning';
import { LinkedFailuresList } from '@/components/warnings/CautionaryTag';
import { useAppStore } from '@/stores/app-store';
import { cn } from '@/lib/utils';
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
  }>;
}

interface DetailViewerProps {
  detail: DetailWithRelations;
  stageMetadata?: DetailStageMetadata | null;
  isLoading?: boolean;
  showBreadcrumb?: boolean;
}

export function DetailViewer({ detail, stageMetadata, isLoading = false, showBreadcrumb = true }: DetailViewerProps) {
  const [isFavourite, setIsFavourite] = useState(false);
  const [isFavouriteLoading, setIsFavouriteLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [activeStep, setActiveStep] = useState(1);
  const { preferences } = useAppStore();

  // Check if this detail has 3D step synchronization
  const hasStepSync = stageMetadata !== null && stageMetadata !== undefined && (stageMetadata?.stages?.length ?? 0) > 0;

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

  // Convert steps to the format expected by StepByStep
  const steps = (detail.steps || []).map((step) => ({
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
            <p className="text-xs text-red-600 uppercase tracking-wide">Failure Cases</p>
            <p className="text-lg font-semibold text-red-700">
              {detail.failures?.length}
            </p>
          </Card>
        )}
      </div>

      {/* 3D Model Viewer */}
      <Model3DViewer
        modelUrl={detail.modelUrl}
        detailCode={detail.code}
        thumbnailUrl={detail.thumbnailUrl}
        activeStep={hasStepSync ? activeStep : undefined}
        stageMetadata={stageMetadata}
        onStepChange={hasStepSync ? handleStepChange : undefined}
      />

      {/* Ventilation - Always Visible (Per Spec: Cannot be collapsed) */}
      {ventilationChecks.length > 0 && (
        <VentilationCheck checks={ventilationChecks} />
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start h-auto flex-wrap gap-1 bg-transparent p-0 border-b rounded-none">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent px-4 py-2"
          >
            <FileText className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="installation"
            className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent px-4 py-2"
          >
            <Wrench className="h-4 w-4 mr-2" />
            Installation
            {steps.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {steps.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="warnings"
            className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent px-4 py-2"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Warnings
            {(detail.warnings?.length ?? 0) > 0 && (
              <Badge className="ml-2 text-xs bg-amber-100 text-amber-700">
                {detail.warnings?.length}
              </Badge>
            )}
          </TabsTrigger>
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
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Specifications</CardTitle>
              </CardHeader>
              <CardContent>
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
          )}

          {/* Linked Failure Cases */}
          {detail.failures && detail.failures.length > 0 && (
            <Card className="border-red-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-red-800">
                  <AlertTriangle className="h-5 w-5" />
                  Related Failure Cases
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

        {/* Installation Tab */}
        <TabsContent value="installation" className="mt-6">
          <StepByStep
            steps={steps}
            activeStep={hasStepSync ? activeStep : undefined}
            onStepChange={hasStepSync ? handleStepChange : undefined}
          />
        </TabsContent>

        {/* Warnings Tab */}
        <TabsContent value="warnings" className="mt-6 space-y-4">
          {detail.warnings && detail.warnings.length > 0 ? (
            <>
              <p className="text-sm text-slate-600 mb-4">
                Warnings are evaluated based on your saved preferences. Inactive
                warnings may still apply depending on project conditions.
              </p>
              {detail.warnings.map((warning) => (
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
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <AlertTriangle className="mx-auto h-12 w-12 text-slate-300" />
                <p className="mt-4 text-slate-500">
                  No specific warnings for this detail.
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  Always verify against current NZBC requirements.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

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
