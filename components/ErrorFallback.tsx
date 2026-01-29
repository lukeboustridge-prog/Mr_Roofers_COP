'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorFallbackProps {
  error?: Error;
  resetError?: () => void;
  title?: string;
  description?: string;
  showRetry?: boolean;
  compact?: boolean;
}

/**
 * Reusable error fallback component for client-side error handling.
 * Can be used with React Error Boundaries or as a standalone error display.
 */
export function ErrorFallback({
  error,
  resetError,
  title = 'Something went wrong',
  description = 'An unexpected error occurred. Please try again.',
  showRetry = true,
  compact = false,
}: ErrorFallbackProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
        <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-red-800">{title}</p>
          {error?.message && (
            <p className="text-xs text-red-600 truncate">{error.message}</p>
          )}
        </div>
        {showRetry && resetError && (
          <Button
            variant="outline"
            size="sm"
            onClick={resetError}
            className="flex-shrink-0"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className="border-red-200 bg-red-50/50">
      <CardContent className="p-6 text-center">
        <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>

        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          {title}
        </h3>

        <p className="text-slate-600 mb-4 max-w-sm mx-auto">
          {description}
        </p>

        {error?.message && process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-3 bg-slate-900 rounded-lg text-left overflow-x-auto">
            <code className="text-sm text-red-400 whitespace-pre-wrap">
              {error.message}
            </code>
          </div>
        )}

        {showRetry && resetError && (
          <Button onClick={resetError}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try again
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Simple inline error message for form fields or small UI areas.
 */
export function InlineError({
  message,
  className = '',
}: {
  message: string;
  className?: string;
}) {
  return (
    <p className={`text-sm text-red-600 flex items-center gap-1 ${className}`}>
      <AlertTriangle className="h-3.5 w-3.5" />
      {message}
    </p>
  );
}

/**
 * Empty state component for when no data is available.
 */
export function EmptyState({
  icon: Icon = AlertTriangle,
  title,
  description,
  action,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <Icon className="mx-auto h-12 w-12 text-slate-300" />
        <h3 className="mt-4 font-medium text-slate-700">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        )}
        {action && <div className="mt-4">{action}</div>}
      </CardContent>
    </Card>
  );
}
