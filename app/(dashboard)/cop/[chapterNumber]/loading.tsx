import { Skeleton } from '@/components/ui/skeleton';

export default function ChapterLoading() {
  return (
    <div className="container max-w-4xl p-4 md:p-6 lg:p-8">
      {/* Back link skeleton */}
      <Skeleton className="h-5 w-28 mb-4" />

      {/* Chapter header skeleton */}
      <div className="mb-8">
        <Skeleton className="h-9 w-full max-w-2xl mb-3" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-5 w-24" />
        </div>
      </div>

      {/* Content skeleton - simulating 4 sections */}
      <div className="space-y-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="border-b border-slate-200 pb-6">
            {/* Section heading */}
            <Skeleton className="h-7 w-64 mb-3" />

            {/* Section content - varying line lengths */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          </div>
        ))}

        {/* Final section without border */}
        <div>
          <Skeleton className="h-7 w-56 mb-3" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    </div>
  );
}
