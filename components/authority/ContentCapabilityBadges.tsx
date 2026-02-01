'use client';

import { Box, ListChecks, AlertTriangle, Scale } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface ContentCapabilities {
  has3DModel: boolean;
  hasSteps: boolean;
  hasWarnings: boolean;
  hasCaseLaw: boolean;
}

interface ContentCapabilityBadgesProps {
  capabilities: ContentCapabilities;
  className?: string;
}

/**
 * Displays icon badges for content capabilities.
 * Only shows icons for capabilities that are TRUE.
 * Order: 3D Model, Steps, Warnings, Case Law (constructive to cautionary)
 */
export function ContentCapabilityBadges({
  capabilities,
  className,
}: ContentCapabilityBadgesProps) {
  const { has3DModel, hasSteps, hasWarnings, hasCaseLaw } = capabilities;

  // Don't render anything if no capabilities are true
  if (!has3DModel && !hasSteps && !hasWarnings && !hasCaseLaw) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className={cn('flex gap-1', className)}>
        {has3DModel && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Box className="h-4 w-4 text-blue-500" />
            </TooltipTrigger>
            <TooltipContent>Has 3D Model</TooltipContent>
          </Tooltip>
        )}
        {hasSteps && (
          <Tooltip>
            <TooltipTrigger asChild>
              <ListChecks className="h-4 w-4 text-green-500" />
            </TooltipTrigger>
            <TooltipContent>Has Installation Steps</TooltipContent>
          </Tooltip>
        )}
        {hasWarnings && (
          <Tooltip>
            <TooltipTrigger asChild>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </TooltipTrigger>
            <TooltipContent>Has Warnings</TooltipContent>
          </Tooltip>
        )}
        {hasCaseLaw && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Scale className="h-4 w-4 text-red-500" />
            </TooltipTrigger>
            <TooltipContent>Related Case Law</TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
