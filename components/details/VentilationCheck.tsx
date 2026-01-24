'use client';

import { useState } from 'react';
import { Wind, Check, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface VentilationRequirement {
  type?: string;
  requirement: string;
  required: boolean;
}

interface VentilationCheckProps {
  checks: VentilationRequirement[];
  onCheckChange?: (index: number, checked: boolean) => void;
  readOnly?: boolean;
  className?: string;
}

export function VentilationCheck({
  checks,
  onCheckChange,
  readOnly = false,
  className,
}: VentilationCheckProps) {
  const [checkedItems, setCheckedItems] = useState<boolean[]>(
    new Array(checks.length).fill(false)
  );

  const handleCheckChange = (index: number, checked: boolean) => {
    const newCheckedItems = [...checkedItems];
    newCheckedItems[index] = checked;
    setCheckedItems(newCheckedItems);
    onCheckChange?.(index, checked);
  };

  const requiredChecks = checks.filter((c) => c.required);
  const optionalChecks = checks.filter((c) => !c.required);
  const completedRequired = checkedItems.filter(
    (checked, i) => checked && checks[i].required
  ).length;

  if (checks.length === 0) {
    return null;
  }

  return (
    <Card className={cn('border-blue-200 bg-blue-50/50', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Wind className="h-5 w-5" />
          Ventilation Requirements
          {requiredChecks.length > 0 && (
            <span className="ml-auto text-sm font-normal text-blue-600">
              {completedRequired}/{requiredChecks.length} required
            </span>
          )}
        </CardTitle>
        <p className="text-sm text-blue-700">
          Ventilation is critical - verify all requirements before proceeding
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Required checks */}
        {requiredChecks.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Required Checks
            </p>
            {checks.map((check, index) => {
              if (!check.required) return null;
              return (
                <VentilationCheckItem
                  key={index}
                  requirement={check.requirement}
                  required={true}
                  checked={checkedItems[index]}
                  onCheckedChange={(checked) => handleCheckChange(index, checked)}
                  readOnly={readOnly}
                />
              );
            })}
          </div>
        )}

        {/* Optional checks */}
        {optionalChecks.length > 0 && (
          <div className="space-y-2">
            {requiredChecks.length > 0 && (
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500 mt-4">
                Recommended Checks
              </p>
            )}
            {checks.map((check, index) => {
              if (check.required) return null;
              return (
                <VentilationCheckItem
                  key={index}
                  requirement={check.requirement}
                  required={false}
                  checked={checkedItems[index]}
                  onCheckedChange={(checked) => handleCheckChange(index, checked)}
                  readOnly={readOnly}
                />
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface VentilationCheckItemProps {
  requirement: string;
  required: boolean;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  readOnly?: boolean;
}

function VentilationCheckItem({
  requirement,
  required,
  checked,
  onCheckedChange,
  readOnly = false,
}: VentilationCheckItemProps) {
  return (
    <label
      className={cn(
        'flex items-start gap-3 rounded-lg border p-3 transition-colors cursor-pointer',
        checked
          ? 'bg-green-50 border-green-200'
          : required
          ? 'bg-white border-red-200 hover:border-red-300'
          : 'bg-white border-slate-200 hover:border-slate-300',
        readOnly && 'cursor-default'
      )}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={(val) => !readOnly && onCheckedChange(val === true)}
        disabled={readOnly}
        className={cn(
          'mt-0.5',
          checked ? 'border-green-500 bg-green-500' : required ? 'border-red-400' : ''
        )}
      />
      <div className="flex-1 min-w-0">
        <span
          className={cn(
            'text-sm',
            checked ? 'text-green-800' : 'text-slate-700'
          )}
        >
          {requirement}
        </span>
        {checked && (
          <span className="ml-2 inline-flex items-center text-xs text-green-600">
            <Check className="h-3 w-3 mr-1" />
            Verified
          </span>
        )}
      </div>
    </label>
  );
}

// Compact inline version for smaller spaces
export function VentilationCheckInline({
  checks,
  className,
}: {
  checks: VentilationRequirement[];
  className?: string;
}) {
  if (checks.length === 0) return null;

  const requiredCount = checks.filter((c) => c.required).length;

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-200 px-3 py-2',
        className
      )}
    >
      <Wind className="h-4 w-4 text-blue-600 flex-shrink-0" />
      <span className="text-sm text-blue-800">
        {requiredCount > 0 ? (
          <>
            <strong>{requiredCount}</strong> required ventilation check
            {requiredCount > 1 ? 's' : ''}
          </>
        ) : (
          <>
            {checks.length} ventilation check{checks.length > 1 ? 's' : ''}
          </>
        )}
      </span>
    </div>
  );
}
