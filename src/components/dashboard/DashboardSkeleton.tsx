/**
 * DashboardSkeleton.tsx — Skeleton loading placeholder matching the Dashboard grid structure.
 *
 * Single Responsibility: Provide loading visual feedback using the Skeleton primitive.
 */
import { Skeleton } from '@/components/common/Skeleton';
import { Card } from '@/components/common/Card';

export function DashboardSkeleton() {
  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header Skeleton */}
      <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 p-6 md:p-8 space-y-3">
        <Skeleton height={20} className="w-36" />
        <Skeleton height={32} className="w-64" />
        <Skeleton height={16} className="w-48" />
      </div>

      {/* Overview Cards Skeleton (8 cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Card key={i} className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton height={14} className="w-24" />
              <Skeleton height={36} className="w-9 rounded-xl" />
            </div>
            <Skeleton height={28} className="w-16" />
          </Card>
        ))}
      </div>

      {/* Middle Row Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4">
          <Skeleton height={24} className="w-48" />
          <Skeleton height={160} className="w-full" />
        </Card>
        <Card className="p-6 space-y-4">
          <Skeleton height={24} className="w-48" />
          <Skeleton height={160} className="w-full" />
        </Card>
      </div>

      {/* Bottom Row Widgets Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 space-y-4">
          <Skeleton height={24} className="w-36" />
          <Skeleton height={120} className="w-full" />
        </Card>
        <Card className="p-6 space-y-4">
          <Skeleton height={24} className="w-36" />
          <Skeleton height={120} className="w-full" />
        </Card>
        <Card className="p-6 space-y-4">
          <Skeleton height={24} className="w-36" />
          <Skeleton height={120} className="w-full" />
        </Card>
      </div>
    </div>
  );
}
