'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  ListChecks,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  id: string;
  stepNumber: number;
  instruction: string;
  imageUrl?: string | null;
  cautionNote?: string | null;
}

interface StepByStepProps {
  steps: Step[];
  onStepComplete?: (stepId: string, completed: boolean) => void;
  onAllComplete?: () => void;
  className?: string;
}

export function StepByStep({
  steps,
  onStepComplete,
  onAllComplete,
  className,
}: StepByStepProps) {
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [expandedStep, setExpandedStep] = useState<string | null>(
    steps[0]?.id || null
  );

  const handleStepToggle = (stepId: string, completed: boolean) => {
    const newCompleted = new Set(completedSteps);
    if (completed) {
      newCompleted.add(stepId);
      // Auto-expand next step
      const currentIndex = steps.findIndex((s) => s.id === stepId);
      if (currentIndex < steps.length - 1) {
        setExpandedStep(steps[currentIndex + 1].id);
      }
    } else {
      newCompleted.delete(stepId);
    }
    setCompletedSteps(newCompleted);
    onStepComplete?.(stepId, completed);

    // Check if all steps are complete
    if (newCompleted.size === steps.length) {
      onAllComplete?.();
    }
  };

  const handleReset = () => {
    setCompletedSteps(new Set());
    setExpandedStep(steps[0]?.id || null);
  };

  const progress = (completedSteps.size / steps.length) * 100;
  const allComplete = completedSteps.size === steps.length;

  if (steps.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <ListChecks className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-4 text-slate-500">
            Installation steps will be added in a future update.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-5 w-5" />
              Installation Steps
            </CardTitle>
            <CardDescription>
              Follow these steps for correct installation
            </CardDescription>
          </div>
          {completedSteps.size > 0 && (
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-slate-600">
              {completedSteps.size} of {steps.length} steps complete
            </span>
            <span className="font-medium text-primary">
              {Math.round(progress)}%
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.has(step.id);
          const isExpanded = expandedStep === step.id;
          const isPrevCompleted =
            index === 0 || completedSteps.has(steps[index - 1].id);

          return (
            <StepItem
              key={step.id}
              step={step}
              isCompleted={isCompleted}
              isExpanded={isExpanded}
              canStart={isPrevCompleted}
              onToggle={(completed) => handleStepToggle(step.id, completed)}
              onExpand={() =>
                setExpandedStep(isExpanded ? null : step.id)
              }
            />
          );
        })}

        {/* Completion message */}
        {allComplete && (
          <div className="mt-4 rounded-lg bg-green-50 border border-green-200 p-4 text-center">
            <Check className="mx-auto h-8 w-8 text-green-600 mb-2" />
            <p className="font-medium text-green-800">
              All steps completed!
            </p>
            <p className="text-sm text-green-600 mt-1">
              Remember to verify ventilation requirements before finishing.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface StepItemProps {
  step: Step;
  isCompleted: boolean;
  isExpanded: boolean;
  canStart: boolean;
  onToggle: (completed: boolean) => void;
  onExpand: () => void;
}

function StepItem({
  step,
  isCompleted,
  isExpanded,
  canStart,
  onToggle,
  onExpand,
}: StepItemProps) {
  return (
    <div
      className={cn(
        'rounded-lg border transition-all',
        isCompleted
          ? 'bg-green-50 border-green-200'
          : canStart
          ? 'bg-white border-slate-200 hover:border-slate-300'
          : 'bg-slate-50 border-slate-200 opacity-60'
      )}
    >
      {/* Header */}
      <button
        onClick={onExpand}
        className="w-full flex items-center gap-3 p-4 text-left"
        disabled={!canStart}
      >
        {/* Step number / checkbox */}
        <div
          className={cn(
            'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-bold text-sm transition-colors',
            isCompleted
              ? 'bg-green-500 text-white'
              : canStart
              ? 'bg-primary text-white'
              : 'bg-slate-300 text-slate-500'
          )}
        >
          {isCompleted ? <Check className="h-4 w-4" /> : step.stepNumber}
        </div>

        {/* Step instruction preview */}
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              'font-medium text-sm',
              isCompleted ? 'text-green-800' : 'text-slate-900',
              !isExpanded && 'line-clamp-1'
            )}
          >
            {step.instruction}
          </p>
          {step.cautionNote && !isExpanded && (
            <p className="text-xs text-amber-600 mt-0.5 line-clamp-1">
              <AlertTriangle className="inline h-3 w-3 mr-1" />
              Caution note
            </p>
          )}
        </div>

        {/* Expand icon */}
        {canStart && (
          <div className="text-slate-400">
            {isExpanded ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </div>
        )}
      </button>

      {/* Expanded content */}
      {isExpanded && canStart && (
        <div className="px-4 pb-4 pt-0">
          {/* Full instruction */}
          <p className="text-sm text-slate-700 mb-3 ml-11">
            {step.instruction}
          </p>

          {/* Step image */}
          {step.imageUrl && (
            <div className="ml-11 mb-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={step.imageUrl}
                alt={`Step ${step.stepNumber}`}
                className="max-w-full h-auto rounded-lg border"
              />
            </div>
          )}

          {/* Caution note */}
          {step.cautionNote && (
            <div className="ml-11 mb-3 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-600 mt-0.5" />
              <span className="text-sm text-amber-800">{step.cautionNote}</span>
            </div>
          )}

          {/* Complete button */}
          <div className="ml-11">
            <label className="flex items-center gap-3 cursor-pointer">
              <Checkbox
                checked={isCompleted}
                onCheckedChange={(checked) => onToggle(checked === true)}
                className={cn(
                  isCompleted ? 'border-green-500 bg-green-500' : ''
                )}
              />
              <span
                className={cn(
                  'text-sm font-medium',
                  isCompleted ? 'text-green-700' : 'text-slate-600'
                )}
              >
                {isCompleted ? 'Step completed' : 'Mark as complete'}
              </span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

// Compact version for read-only display
export function StepByStepReadOnly({
  steps,
  className,
}: {
  steps: Step[];
  className?: string;
}) {
  if (steps.length === 0) return null;

  return (
    <div className={cn('space-y-3', className)}>
      {steps.map((step) => (
        <div
          key={step.id}
          className="flex gap-3 rounded-lg border bg-white p-4"
        >
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
            {step.stepNumber}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-700">{step.instruction}</p>
            {step.cautionNote && (
              <div className="mt-2 flex items-start gap-2 text-xs">
                <AlertTriangle className="h-3 w-3 flex-shrink-0 text-amber-600 mt-0.5" />
                <span className="text-amber-700">{step.cautionNote}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
