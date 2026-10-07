/**
 * AnalyticsSkeleton.tsx — Skeleton loading placeholder matching the Analytics page layout.
 *
 * Single Responsibility: Visual loading state for the Analytics route.
 */
import { Skeleton } from '@/components/common/Skeleton';
import { Card } from '@/components/common/Card';

export function AnalyticsSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header Skeleton */}
      <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 p-6 md:p-8 space-y-3">
        <Skeleton height={20} className="w-48" />
        <Skeleton height={32} className="w-64" />
        <Skeleton height={16} className="w-56" />
      </div>

      {/* Overview Cards (6 cards) Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton height={14} className="w-20" />
              <Skeleton height={28} className="w-8 rounded-xl" />
            </div>
            <Skeleton height={28} className="w-16" />
          </Card>
        ))}
      </div>

      {/* Charts Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4">
          <Skeleton height={24} className="w-48" />
          <Skeleton height={200} className="w-full" />
        </Card>
        <Card className="p-6 space-y-4">
          <Skeleton height={24} className="w-48" />
          <Skeleton height={200} className="w-full" />
        </Card>
      </div>

      {/* Bottom Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4">
          <Skeleton height={24} className="w-48" />
          <Skeleton height={180} className="w-full" />
        </Card>
        <Card className="p-6 space-y-4">
          <Skeleton height={24} className="w-48" />
          <Skeleton height={180} className="w-full" />
        </Card>
      </div>
    </div>
  );
}
