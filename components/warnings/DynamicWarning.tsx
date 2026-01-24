'use client';

import { AlertTriangle, Info, AlertCircle, Wind, Droplets, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface DynamicWarningProps {
  level: 'info' | 'warning' | 'critical';
  message: string;
  nzbcRef?: string;
  conditionType?: string;
  conditionValue?: string;
  isActive?: boolean;
}

export function DynamicWarning({
  level,
  message,
  nzbcRef,
  conditionType,
  conditionValue,
  isActive = true,
}: DynamicWarningProps) {
  const icons = {
    info: Info,
    warning: AlertTriangle,
    critical: AlertCircle,
  };

  const styles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    critical: 'bg-red-50 border-red-200 text-red-800',
  };

  const iconStyles = {
    info: 'text-blue-600',
    warning: 'text-amber-600',
    critical: 'text-red-600',
  };

  const Icon = icons[level];

  // Get condition icon
  const getConditionIcon = () => {
    switch (conditionType) {
      case 'wind_zone':
        return <Wind className="h-3 w-3" />;
      case 'corrosion_zone':
        return <Droplets className="h-3 w-3" />;
      case 'pitch':
        return <ArrowDown className="h-3 w-3" />;
      default:
        return null;
    }
  };

  // Get condition label
  const getConditionLabel = () => {
    switch (conditionType) {
      case 'wind_zone':
        return `Wind Zone: ${conditionValue?.toUpperCase()}`;
      case 'corrosion_zone':
        return `Corrosion Zone: ${conditionValue?.toUpperCase()}`;
      case 'pitch':
        return `Pitch: ${conditionValue}°`;
      case 'exposure':
        return `Exposure: ${conditionValue}`;
      default:
        return conditionValue;
    }
  };

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border p-4 transition-all',
        styles[level],
        !isActive && 'opacity-50'
      )}
      role={level === 'critical' ? 'alert' : undefined}
      aria-live={level === 'critical' ? 'assertive' : level === 'warning' ? 'polite' : undefined}
    >
      <Icon
        className={cn('h-5 w-5 flex-shrink-0 mt-0.5', iconStyles[level])}
        aria-hidden="true"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{message}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {conditionType && conditionValue && (
            <Badge variant="outline" className="text-xs bg-white/50">
              {getConditionIcon()}
              <span className="ml-1">{getConditionLabel()}</span>
            </Badge>
          )}
          {nzbcRef && (
            <Badge variant="outline" className="text-xs bg-white/50">
              NZBC {nzbcRef}
            </Badge>
          )}
          {!isActive && (
            <span className="text-xs opacity-75">(Not applicable to your settings)</span>
          )}
        </div>
      </div>
    </div>
  );
}

// Compact inline warning for lists
export function InlineWarning({
  level,
  message,
}: {
  level: 'info' | 'warning' | 'critical';
  message: string;
}) {
  const colors = {
    info: 'text-blue-600',
    warning: 'text-amber-600',
    critical: 'text-red-600',
  };

  const bgColors = {
    info: 'bg-blue-100',
    warning: 'bg-amber-100',
    critical: 'bg-red-100',
  };

  return (
    <div
      className={cn('flex items-center gap-2 rounded-md px-2 py-1', bgColors[level])}
      role={level === 'critical' ? 'alert' : undefined}
    >
      <AlertTriangle className={cn('h-3 w-3', colors[level])} aria-hidden="true" />
      <span className={cn('text-xs font-medium', colors[level])}>{message}</span>
    </div>
  );
}

// Warning count badge
export function WarningCountBadge({
  count,
  severity = 'warning',
}: {
  count: number;
  severity?: 'info' | 'warning' | 'critical';
}) {
  if (count === 0) return null;

  const colors = {
    info: 'bg-blue-100 text-blue-700',
    warning: 'bg-amber-100 text-amber-700',
    critical: 'bg-red-100 text-red-700',
  };

  return (
    <Badge className={cn('text-xs', colors[severity])}>
      <AlertTriangle className="mr-1 h-3 w-3" />
      {count}
    </Badge>
  );
}
