import { Skeleton } from '@/components/ui/skeleton';

interface WordCardSkeletonProps {
  count?: number;
}

function WordCardSkeletonItem() {
  return (
    <div className="bg-white border rounded-2xl p-4 shadow-sm space-y-3">
      {/* Header: word + badge */}
      <div className="flex justify-between items-start">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-28 rounded-lg" />
          <Skeleton className="h-3.5 w-20 rounded" />
        </div>
        <Skeleton className="h-6 w-14 rounded-full" />
      </div>
      {/* Translation */}
      <Skeleton className="h-4 w-full rounded" />
      <Skeleton className="h-4 w-3/4 rounded" />
      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-1">
        <Skeleton className="h-7 w-24 rounded-lg" />
      </div>
    </div>
  );
}

export function WordCardSkeleton({ count = 6 }: WordCardSkeletonProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {Array.from({ length: count }, (_, i) => (
        <WordCardSkeletonItem key={i} />
      ))}
    </div>
  );
}

export default WordCardSkeleton;
