import { Skeleton } from '@/components/ui/skeleton';

export default function EncyclopediaCopLoading() {
  return (
    <div className="container max-w-6xl p-4 md:p-6 lg:p-8">
      {/* Header skeleton */}
      <div className="mb-8">
        <Skeleton className="h-9 w-96" />
        <Skeleton className="mt-2 h-5 w-48" />
        <Skeleton className="mt-1 h-4 w-72" />
      </div>

      {/* Chapter grid skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 19 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-6">
            <div className="flex items-start justify-between">
              <Skeleton className="h-14 w-14 rounded-xl" />
              <Skeleton className="h-5 w-20" />
            </div>
            <Skeleton className="mt-4 h-6 w-full" />
            <Skeleton className="mt-2 h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
