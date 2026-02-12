import { Skeleton } from '@/components/ui/skeleton';

export default function EncyclopediaChapterLoading() {
  return (
    <div className="flex flex-col">
      {/* Back link skeleton */}
      <div className="px-4 pt-4 md:px-6 lg:px-8">
        <Skeleton className="h-4 w-32 mb-4" />
      </div>

      {/* Chapter header skeleton */}
      <div className="px-4 pb-4 md:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-2">
          <Skeleton className="h-9 w-96" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-4 w-24" />
      </div>

      {/* Article content skeleton */}
      <div className="px-4 pb-8 md:px-6 lg:px-8">
        <div className="max-w-4xl space-y-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-7 w-64" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
