import { Badge } from '@/components/ui/badge';
import { Library } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SourceBadgeProps {
  shortName: string;
  name?: string;
  size?: 'sm' | 'md';
  showIcon?: boolean;
  className?: string;
}

export function SourceBadge({
  shortName,
  name,
  size = 'sm',
  showIcon = false,
  className,
}: SourceBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'bg-slate-50 border-slate-200 text-slate-600',
        size === 'sm' && 'text-xs px-1.5 py-0',
        size === 'md' && 'text-sm px-2 py-0.5',
        className
      )}
      title={name || shortName}
    >
      {showIcon && <Library className="h-3 w-3 mr-1" />}
      {shortName}
    </Badge>
  );
}

interface SourceAttributionProps {
  shortName: string;
  name: string;
  updatedAt?: Date | null;
  className?: string;
}

export function SourceAttribution({
  shortName,
  name,
  updatedAt,
  className,
}: SourceAttributionProps) {
  return (
    <div className={cn('flex items-center gap-2 text-sm text-slate-500', className)}>
      <Library className="h-4 w-4" />
      <span>
        Source: <strong className="text-slate-700">{name}</strong>
        {' '}({shortName})
      </span>
      {updatedAt && (
        <>
          <span className="text-slate-300">|</span>
          <span>
            Updated: {new Date(updatedAt).toLocaleDateString('en-NZ', {
              month: 'long',
              year: 'numeric',
            })}
          </span>
        </>
      )}
    </div>
  );
}
