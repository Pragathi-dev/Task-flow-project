/**
 * ActivitySkeleton.tsx — Skeleton loading placeholder matching the Activity Timeline grid.
 *
 * Single Responsibility: Provide loading visual feedback using the Skeleton primitive.
 */
import { Skeleton } from '@/components/common/Skeleton';
import { Card } from '@/components/common/Card';

export function ActivitySkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header Skeleton */}
      <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 p-6 md:p-8 space-y-4">
        <Skeleton height={20} className="w-40" />
        <Skeleton height={32} className="w-64" />
        <Skeleton height={16} className="w-56" />
        <div className="flex gap-2 pt-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} height={28} className="w-24 rounded-lg" />
          ))}
        </div>
      </div>

      {/* Timeline Section Skeleton */}
      <div className="space-y-6">
        <Skeleton height={20} className="w-32" />
        <div className="space-y-4 pl-4 border-l-2 border-zinc-200 dark:border-zinc-800">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton height={16} className="w-64" />
                <Skeleton height={12} className="w-24" />
              </div>
              <Skeleton height={14} className="w-48" />
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
