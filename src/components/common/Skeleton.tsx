import React from 'react';
import { cn } from '@/utils/cn';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** If true, renders as a circle (for avatars). */
  circle?: boolean;
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ circle = false, width, height, className, style, ...props }: SkeletonProps) {
  return (
    <div
      className={cn('skeleton', circle ? 'rounded-full' : 'rounded-md', className)}
      style={{ width, height, ...style }}
      aria-hidden="true"
      {...props}
    />
  );
}

/** Pre-composed skeletons for common UI shapes. */
export function SkeletonText({ lines = 2, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height={14} className={i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'} />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3', className)}>
      <div className="flex items-center gap-3">
        <Skeleton circle width={28} height={28} />
        <Skeleton height={14} className="w-24" />
      </div>
      <SkeletonText lines={2} />
      <div className="flex gap-2">
        <Skeleton height={20} className="w-12 rounded-full" />
        <Skeleton height={20} className="w-16 rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonStatCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-3', className)}>
      <div className="flex items-center justify-between">
        <Skeleton height={14} className="w-24" />
        <Skeleton circle width={32} height={32} />
      </div>
      <Skeleton height={28} className="w-16" />
      <Skeleton height={12} className="w-32" />
    </div>
  );
}
