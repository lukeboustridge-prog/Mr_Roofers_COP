'use client';

import { useRouter } from 'next/navigation';
import { Wrench } from 'lucide-react';
import { ContextSelector } from '@/components/fixer/ContextSelector';

export default function FixerPage() {
  const router = useRouter();

  const handleComplete = (context: { substrate: string; task: string }) => {
    // Navigate to results with both params in URL
    router.push(`/fixer/results?substrate=${context.substrate}&task=${context.task}`);
  };

  return (
    <div className="container max-w-4xl p-4 md:p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
            <Wrench className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
            Fixer Mode
          </h1>
        </div>
        <p className="text-slate-600">
          Quick lookup - select your context to find relevant details. Use voice input or tap to select.
        </p>
      </div>

      {/* Context Selector */}
      <ContextSelector onComplete={handleComplete} />
    </div>
  );
}
