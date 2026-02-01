'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Box, ListChecks, AlertTriangle, Scale } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CapabilityFiltersProps {
  className?: string;
}

interface CapabilityOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
}

const CAPABILITY_OPTIONS: CapabilityOption[] = [
  {
    id: '3d',
    label: 'Has 3D Model',
    icon: <Box className="h-4 w-4" />,
    color: 'text-blue-500',
  },
  {
    id: 'steps',
    label: 'Has Installation Steps',
    icon: <ListChecks className="h-4 w-4" />,
    color: 'text-green-500',
  },
  {
    id: 'warnings',
    label: 'Has Warnings',
    icon: <AlertTriangle className="h-4 w-4" />,
    color: 'text-amber-500',
  },
  {
    id: 'caselaw',
    label: 'Related Case Law',
    icon: <Scale className="h-4 w-4" />,
    color: 'text-red-500',
  },
];

/**
 * Capability filter checkboxes for content filtering.
 * Allows filtering by content features: 3D Model, Steps, Warnings, Case Law.
 * Syncs selected capabilities to URL searchParams as comma-separated values.
 */
export function CapabilityFilters({ className }: CapabilityFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const capabilities = searchParams.get('capabilities')?.split(',').filter(Boolean) || [];

  const handleToggle = (capability: string) => {
    const updated = capabilities.includes(capability)
      ? capabilities.filter(c => c !== capability)
      : [...capabilities, capability];

    const params = new URLSearchParams(searchParams.toString());
    if (updated.length === 0) {
      params.delete('capabilities');
    } else {
      params.set('capabilities', updated.join(','));
    }
    const queryString = params.toString();
    router.replace(`${pathname}${queryString ? `?${queryString}` : ''}`, { scroll: false });
  };

  return (
    <div className={cn('space-y-3', className)}>
      <h3 className="text-sm font-medium text-slate-700">Content Features</h3>
      <div className="flex flex-wrap gap-4 md:gap-6">
        {CAPABILITY_OPTIONS.map((option) => (
          <div key={option.id} className="flex items-center gap-2">
            <Checkbox
              id={`cap-${option.id}`}
              checked={capabilities.includes(option.id)}
              onCheckedChange={() => handleToggle(option.id)}
              aria-describedby={`cap-${option.id}-label`}
            />
            <Label
              htmlFor={`cap-${option.id}`}
              id={`cap-${option.id}-label`}
              className="flex items-center gap-2 cursor-pointer text-sm"
            >
              <span className={option.color}>{option.icon}</span>
              <span className="hidden sm:inline">{option.label}</span>
              <span className="sm:hidden">{option.label.split(' ')[0]}</span>
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}

export { CAPABILITY_OPTIONS };
