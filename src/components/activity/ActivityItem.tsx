/**
 * ActivityItem.tsx — Independent component rendering an individual audit activity entry.
 *
 * Single Responsibility: Format event types, icons, metadata, and relative timestamps.
 */
import { motion } from 'framer-motion';
import { formatDistanceToNow, format, parseISO, isToday, isYesterday } from 'date-fns';
import {
  RiAddLine,
  RiCheckLine,
  RiArrowRightLine,
  RiEditLine,
  RiDeleteBinLine,
  RiKanbanView2,
  RiHistoryLine,
  RiLayoutColumnLine,
} from 'react-icons/ri';
import { Badge } from '@/components/common/Badge';
import type { Activity, ActivityEventType } from '@/types/activity.types';

export interface ActivityItemProps {
  activity: Activity;
}

const EVENT_CONFIG: Record<
  ActivityEventType,
  { icon: typeof RiAddLine; color: string; bg: string; actionText: string }
> = {
  task_created: {
    icon: RiAddLine,
    color: 'text-indigo-500',
    bg: 'bg-indigo-500/10 dark:bg-indigo-400/10',
    actionText: 'created task',
  },
  task_completed: {
    icon: RiCheckLine,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10 dark:bg-emerald-400/10',
    actionText: 'completed task',
  },
  task_moved: {
    icon: RiArrowRightLine,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10 dark:bg-amber-400/10',
    actionText: 'moved task',
  },
  task_edited: {
    icon: RiEditLine,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10 dark:bg-blue-400/10',
    actionText: 'updated task',
  },
  task_reopened: {
    icon: RiHistoryLine,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10 dark:bg-purple-400/10',
    actionText: 'reopened task',
  },
  task_deleted: {
    icon: RiDeleteBinLine,
    color: 'text-rose-500',
    bg: 'bg-rose-500/10 dark:bg-rose-400/10',
    actionText: 'deleted task',
  },
  board_created: {
    icon: RiKanbanView2,
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10 dark:bg-cyan-400/10',
    actionText: 'created board',
  },
  board_renamed: {
    icon: RiEditLine,
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10 dark:bg-cyan-400/10',
    actionText: 'renamed board',
  },
  board_deleted: {
    icon: RiDeleteBinLine,
    color: 'text-rose-500',
    bg: 'bg-rose-500/10 dark:bg-rose-400/10',
    actionText: 'deleted board',
  },
  column_created: {
    icon: RiLayoutColumnLine,
    color: 'text-teal-500',
    bg: 'bg-teal-500/10 dark:bg-teal-400/10',
    actionText: 'created column',
  },
  column_renamed: {
    icon: RiEditLine,
    color: 'text-teal-500',
    bg: 'bg-teal-500/10 dark:bg-teal-400/10',
    actionText: 'renamed column',
  },
  column_deleted: {
    icon: RiDeleteBinLine,
    color: 'text-rose-500',
    bg: 'bg-rose-500/10 dark:bg-rose-400/10',
    actionText: 'deleted column',
  },
};

export function ActivityItem({ activity }: ActivityItemProps) {
  const date = parseISO(activity.timestamp);
  const config = EVENT_CONFIG[activity.eventType] || EVENT_CONFIG.task_edited;
  const Icon = config.icon;

  const formattedTime = isToday(date)
    ? formatDistanceToNow(date, { addSuffix: true })
    : isYesterday(date)
      ? format(date, "'Yesterday at' h:mm a")
      : format(date, "MMM d, yyyy 'at' h:mm a");

  // Check for column move metadata
  const fromColumn = (activity.meta?.fromColumn as string) || (activity.meta?.fromColumnName as string);
  const toColumn = (activity.meta?.toColumn as string) || (activity.meta?.toColumnName as string);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="relative pl-8 sm:pl-10 py-3 group"
    >
      {/* Timeline Dot & Icon */}
      <div className={`absolute left-0 top-3 p-2 rounded-xl ${config.bg} ${config.color} ring-4 ring-white dark:ring-zinc-950 shadow-xs z-10`}>
        <Icon className="w-4 h-4" />
      </div>

      {/* Content Card */}
      <div className="p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-xs hover:shadow-md transition-all space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
          <p className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            <span className="text-zinc-500 dark:text-zinc-400 font-normal">
              {config.actionText}:{' '}
            </span>
            <span className="font-bold text-zinc-900 dark:text-zinc-100">
              "{activity.entityTitle}"
            </span>
          </p>

          <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 flex-shrink-0">
            {formattedTime}
          </span>
        </div>

        {/* Column transition badges for task_moved */}
        {activity.eventType === 'task_moved' && (fromColumn || toColumn) && (
          <div className="flex items-center gap-2 pt-1">
            {fromColumn && <Badge variant="secondary">{fromColumn}</Badge>}
            <RiArrowRightLine className="w-3 h-3 text-zinc-400" />
            {toColumn && <Badge variant="primary">{toColumn}</Badge>}
          </div>
        )}
      </div>
    </motion.div>
  );
}
