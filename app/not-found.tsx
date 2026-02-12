import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileQuestion, Home, Search, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-6">
            <FileQuestion className="h-8 w-8 text-slate-400" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Page not found
          </h1>

          <p className="text-slate-600 mb-6">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>

          <div className="flex flex-col gap-3">
            <Link href="/">
              <Button className="w-full">
                <Home className="mr-2 h-4 w-4" />
                Go to Dashboard
              </Button>
            </Link>

            <Link href="/search">
              <Button variant="outline" className="w-full">
                <Search className="mr-2 h-4 w-4" />
                Search for details
              </Button>
            </Link>

            <Link href="/encyclopedia/cop">
              <Button variant="ghost" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Browse COP
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
