'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home, HelpCircle } from 'lucide-react';
import Link from 'next/link';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="container max-w-2xl p-4 md:p-6 lg:p-8">
      <Card className="border-red-200 bg-red-50/50">
        <CardContent className="p-8">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>

            <div className="flex-1">
              <h2 className="text-xl font-semibold text-slate-900 mb-2">
                Something went wrong
              </h2>

              <p className="text-slate-600 mb-4">
                We encountered an error while loading this page. This is usually temporary.
              </p>

              {process.env.NODE_ENV === 'development' && error.message && (
                <div className="mb-4 p-3 bg-slate-900 rounded-lg overflow-x-auto">
                  <code className="text-sm text-red-400 whitespace-pre-wrap">
                    {error.message}
                  </code>
                </div>
              )}

              {error.digest && (
                <p className="text-xs text-slate-400 mb-4 font-mono">
                  Reference: {error.digest}
                </p>
              )}

              <div className="flex flex-wrap gap-3">
                <Button onClick={reset}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try again
                </Button>

                <Link href="/">
                  <Button variant="outline">
                    <Home className="mr-2 h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>

                <Link href="/settings">
                  <Button variant="ghost">
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Get help
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Helpful suggestions */}
      <Card className="mt-6">
        <CardContent className="p-6">
          <h3 className="font-medium text-slate-900 mb-3">
            Things you can try:
          </h3>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full" />
              Refresh the page or click &quot;Try again&quot;
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full" />
              Check your internet connection
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full" />
              Clear your browser cache and try again
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full" />
              If the problem persists, contact support
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
