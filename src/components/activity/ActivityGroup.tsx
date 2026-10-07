/**
 * ActivityGroup.tsx — Container component grouping activity items by date bucket (Today, Yesterday, Earlier).
 *
 * Single Responsibility: Render time bucket section headers, timeline stems, and list items.
 */
import { motion } from 'framer-motion';
import { ActivityItem } from './ActivityItem';
import type { Activity } from '@/types/activity.types';

export interface ActivityGroupProps {
  title: string;
  activities: Activity[];
}

export function ActivityGroup({ title, activities }: ActivityGroupProps) {
  if (activities.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {/* Section Header */}
      <div className="flex items-center gap-3 sticky top-0 bg-zinc-50/90 dark:bg-zinc-950/90 backdrop-blur py-2 z-20">
        <h3 className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
          {title}
        </h3>
        <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 bg-zinc-200/80 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
          {activities.length}
        </span>
        <div className="flex-1 h-px bg-zinc-200/80 dark:border-zinc-800/80 dark:bg-zinc-800" />
      </div>

      {/* Timeline Stem & List */}
      <div className="relative border-l-2 border-zinc-200 dark:border-zinc-800 ml-4 pl-2 space-y-1">
        {activities.map((act) => (
          <ActivityItem key={act.id} activity={act} />
        ))}
      </div>
    </motion.div>
  );
}
