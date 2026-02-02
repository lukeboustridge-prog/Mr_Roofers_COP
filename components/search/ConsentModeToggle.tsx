'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { BookOpen, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConsentModeToggleProps {
  className?: string;
}

/**
 * Consent mode toggle for filtering search results to authoritative content only.
 * When enabled, shows only MRM COP content suitable for Building Consent documentation.
 * Persists state in URL as consentMode parameter for shareable links.
 */
export function ConsentModeToggle({ className }: ConsentModeToggleProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const consentMode = searchParams.get('consentMode') === 'true';

  const handleToggle = (checked: boolean) => {
    const params = new URLSearchParams(searchParams.toString());
    if (checked) {
      params.set('consentMode', 'true');
      // Also filter to MRM source when consent mode enabled
      params.set('source', 'mrm-cop');
    } else {
      params.delete('consentMode');
      // Restore to all sources when consent mode disabled
      params.delete('source');
    }
    const queryString = params.toString();
    router.replace(`${pathname}${queryString ? `?${queryString}` : ''}`, { scroll: false });
  };

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="flex items-center gap-2">
        <Switch
          id="consent-mode"
          checked={consentMode}
          onCheckedChange={handleToggle}
          aria-describedby="consent-mode-description"
          className={cn(
            consentMode && 'data-[state=checked]:bg-primary'
          )}
        />
        <Label
          htmlFor="consent-mode"
          className={cn(
            'flex items-center gap-2 cursor-pointer text-sm font-medium transition-colors',
            consentMode ? 'text-primary' : 'text-slate-700'
          )}
        >
          <BookOpen className={cn('h-4 w-4', consentMode && 'text-primary')} />
          Building Code Citation Mode
        </Label>
      </div>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="What is Building Code Citation Mode?"
            >
              <HelpCircle className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <p id="consent-mode-description" className="text-sm">
              When enabled, shows only MRM Code of Practice content suitable for
              Building Consent documentation and official citations.
              Supplementary content from other sources is hidden.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
