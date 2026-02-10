'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { SubstrateGrid } from './SubstrateGrid';
import { TaskSelector } from './TaskSelector';
import { VoiceSearch } from '@/components/search/VoiceSearch';
import { useAppStore } from '@/stores/app-store';
import { SUBSTRATES, FIXER_TASKS } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface ContextSelectorProps {
  onComplete: (context: { substrate: string; task: string }) => void;
  initialSubstrate?: string | null;
  initialTask?: string | null;
  showVoiceInput?: boolean;
  className?: string;
  comingSoonSubstrates?: string[];
}

type Step = 'substrate' | 'task';

export function ContextSelector({
  onComplete,
  initialSubstrate,
  initialTask,
  showVoiceInput = true,
  className,
  comingSoonSubstrates = [],
}: ContextSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { fixerContext, setFixerContext, clearFixerContext } = useAppStore();

  // Get initial values from URL, props, or store
  const urlSubstrate = searchParams.get('substrate');
  const urlTask = searchParams.get('task');

  const [selectedSubstrate, setSelectedSubstrate] = useState<string | null>(
    urlSubstrate || initialSubstrate || fixerContext.substrate
  );
  const [selectedTask, setSelectedTask] = useState<string | null>(
    urlTask || initialTask || fixerContext.task
  );
  const [step, setStep] = useState<Step>(
    selectedSubstrate ? 'task' : 'substrate'
  );
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);

  // Sync URL params with store on mount
  useEffect(() => {
    if (urlSubstrate && urlSubstrate !== fixerContext.substrate) {
      setFixerContext({ substrate: urlSubstrate });
    }
    if (urlTask && urlTask !== fixerContext.task) {
      setFixerContext({ task: urlTask });
    }
  }, [urlSubstrate, urlTask, fixerContext.substrate, fixerContext.task, setFixerContext]);

  // Handle substrate selection
  const handleSubstrateSelect = useCallback((substrateId: string) => {
    setSelectedSubstrate(substrateId);
    setFixerContext({ substrate: substrateId });
    setVoiceError(null);

    // Update URL with substrate param
    const params = new URLSearchParams(searchParams.toString());
    params.set('substrate', substrateId);
    router.push(`/fixer?${params.toString()}`);

    // Move to task step
    setStep('task');
  }, [setFixerContext, router, searchParams]);

  // Handle task selection
  const handleTaskSelect = useCallback((taskId: string) => {
    setSelectedTask(taskId);
    setFixerContext({ task: taskId });
    setVoiceError(null);

    // Call completion callback
    if (selectedSubstrate) {
      onComplete({ substrate: selectedSubstrate, task: taskId });
    }
  }, [selectedSubstrate, setFixerContext, onComplete]);

  // Handle going back to substrate selection
  const handleBack = useCallback(() => {
    if (step === 'task') {
      setSelectedSubstrate(null);
      setSelectedTask(null);
      clearFixerContext();
      router.push('/fixer');
      setStep('substrate');
    }
  }, [step, clearFixerContext, router]);

  // Handle voice input result
  const handleVoiceResult = useCallback((transcript: string) => {
    setIsProcessingVoice(true);
    setVoiceError(null);

    const lowerTranscript = transcript.toLowerCase().trim();

    // Try to match substrate
    if (step === 'substrate') {
      const matchedSubstrate = SUBSTRATES.find((s) => {
        const name = s.name.toLowerCase();
        return (
          lowerTranscript.includes(name) ||
          name.includes(lowerTranscript) ||
          lowerTranscript.includes(s.id.replace(/-/g, ' '))
        );
      });

      if (matchedSubstrate) {
        handleSubstrateSelect(matchedSubstrate.id);
      } else {
        setVoiceError(`Couldn't match "${transcript}" to a substrate. Try saying a roofing type like "metal" or "concrete tile".`);
      }
    }
    // Try to match task
    else if (step === 'task') {
      const matchedTask = FIXER_TASKS.find((t) => {
        const name = t.name.toLowerCase();
        return (
          lowerTranscript.includes(name) ||
          name.includes(lowerTranscript) ||
          lowerTranscript.includes(t.id.replace(/-/g, ' '))
        );
      });

      if (matchedTask) {
        handleTaskSelect(matchedTask.id);
      } else {
        setVoiceError(`Couldn't match "${transcript}" to a task. Try saying something like "flashings" or "penetrations".`);
      }
    }

    setIsProcessingVoice(false);
  }, [step, handleSubstrateSelect, handleTaskSelect]);

  // Handle voice error
  const handleVoiceError = useCallback((error: string) => {
    setVoiceError(error);
    setIsProcessingVoice(false);
  }, []);

  // Get display names
  const selectedSubstrateName = SUBSTRATES.find(
    (s) => s.id === selectedSubstrate
  )?.name;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Progress Indicator */}
      <nav aria-label="Progress steps" className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-colors',
              selectedSubstrate
                ? 'bg-green-500 text-white'
                : step === 'substrate'
                ? 'bg-primary text-white'
                : 'bg-slate-200 text-slate-500'
            )}
            aria-label={selectedSubstrate ? 'Step 1: Substrate - Complete' : 'Step 1: Substrate'}
            aria-current={step === 'substrate' ? 'step' : undefined}
          >
            {selectedSubstrate ? <Check className="h-5 w-5" aria-hidden="true" /> : '1'}
          </div>
          <div>
            <span
              className={cn(
                'text-sm font-medium block',
                step === 'substrate' ? 'text-primary' : 'text-slate-500'
              )}
            >
              Substrate
            </span>
            {selectedSubstrateName && (
              <span className="text-xs text-slate-400">{selectedSubstrateName}</span>
            )}
          </div>
        </div>

        <ArrowRight className="h-5 w-5 text-slate-300" aria-hidden="true" />

        <div className="flex items-center gap-2">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-colors',
              selectedTask
                ? 'bg-green-500 text-white'
                : step === 'task'
                ? 'bg-primary text-white'
                : 'bg-slate-200 text-slate-500'
            )}
            aria-label={selectedTask ? 'Step 2: Task - Complete' : 'Step 2: Task'}
            aria-current={step === 'task' ? 'step' : undefined}
          >
            {selectedTask ? <Check className="h-5 w-5" aria-hidden="true" /> : '2'}
          </div>
          <span
            className={cn(
              'text-sm font-medium',
              step === 'task' ? 'text-primary' : 'text-slate-500'
            )}
          >
            Task
          </span>
        </div>
      </nav>

      {/* Voice Input Section */}
      {showVoiceInput && (
        <Card className="border-dashed">
          <CardContent className="flex items-center gap-4 p-4">
            <VoiceSearch
              onResult={handleVoiceResult}
              onError={handleVoiceError}
            />
            <div className="flex-1" aria-live="polite" aria-atomic="true">
              <p className="text-sm font-medium text-slate-700">
                {isProcessingVoice ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Processing...
                  </span>
                ) : step === 'substrate' ? (
                  'Say a roofing type like "metal" or "concrete tile"'
                ) : (
                  'Say a task like "flashings" or "ventilation"'
                )}
              </p>
              {voiceError && (
                <p className="text-sm text-red-600 mt-1 flex items-center gap-1" role="alert">
                  <X className="h-3 w-3" aria-hidden="true" />
                  {voiceError}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Substrate Selection */}
      {step === 'substrate' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">
            What roofing type are you working on?
          </h2>
          <SubstrateGrid
            onSelect={handleSubstrateSelect}
            selectedId={selectedSubstrate}
            comingSoonIds={comingSoonSubstrates}
          />
        </div>
      )}

      {/* Step 2: Task Selection */}
      {step === 'task' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              onClick={handleBack}
              className="min-h-[48px]"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Change Substrate
            </Button>
            {selectedSubstrateName && (
              <Badge variant="secondary" className="text-base py-2 px-4">
                {selectedSubstrateName}
              </Badge>
            )}
          </div>

          <h2 className="text-lg font-semibold text-slate-900">
            What are you working on?
          </h2>
          <TaskSelector
            onSelect={handleTaskSelect}
            selectedId={selectedTask}
          />
        </div>
      )}
    </div>
  );
}

// Inline version for embedding in other pages
export function ContextSelectorInline({
  onComplete,
  className,
}: {
  onComplete: (context: { substrate: string; task: string }) => void;
  className?: string;
}) {
  const [substrate, setSubstrate] = useState<string | null>(null);
  const [task, setTask] = useState<string | null>(null);

  const handleSubstrateSelect = (id: string) => {
    setSubstrate(id);
  };

  const handleTaskSelect = (id: string) => {
    setTask(id);
    if (substrate) {
      onComplete({ substrate, task: id });
    }
  };

  const handleReset = () => {
    setSubstrate(null);
    setTask(null);
  };

  const selectedSubstrateName = SUBSTRATES.find((s) => s.id === substrate)?.name;

  return (
    <div className={cn('space-y-4', className)}>
      {!substrate ? (
        <>
          <p className="text-sm font-medium text-slate-600">Select substrate:</p>
          <SubstrateGrid onSelect={handleSubstrateSelect} selectedId={substrate} />
        </>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{selectedSubstrateName}</Badge>
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm font-medium text-slate-600">Select task:</p>
          <TaskSelector onSelect={handleTaskSelect} selectedId={task} />
        </>
      )}
    </div>
  );
}
