/**
 * RecentActivityWidget.tsx — Independent widget displaying recent global system activity log.
 *
 * Single Responsibility: Format and render global activity log events from activityRepository.
 */
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import {
  RiHistoryLine,
  RiAddLine,
  RiCheckLine,
  RiArrowRightLine,
  RiEditLine,
  RiDeleteBinLine,
  RiKanbanView2,
} from 'react-icons/ri';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import type { Activity, ActivityEventType } from '@/types/activity.types';

export interface RecentActivityWidgetProps {
  activities: Activity[];
  maxEntries?: number;
}

const EVENT_CONFIG: Record<
  ActivityEventType,
  { icon: typeof RiAddLine; color: string; bg: string; text: string }
> = {
  task_created: {
    icon: RiAddLine,
    color: 'text-indigo-500',
    bg: 'bg-indigo-500/10 dark:bg-indigo-400/10',
    text: 'created task',
  },
  task_completed: {
    icon: RiCheckLine,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10 dark:bg-emerald-400/10',
    text: 'completed task',
  },
  task_moved: {
    icon: RiArrowRightLine,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10 dark:bg-amber-400/10',
    text: 'moved task',
  },
  task_edited: {
    icon: RiEditLine,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10 dark:bg-blue-400/10',
    text: 'updated task',
  },
  task_reopened: {
    icon: RiHistoryLine,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10 dark:bg-purple-400/10',
    text: 'reopened task',
  },
  task_deleted: {
    icon: RiDeleteBinLine,
    color: 'text-rose-500',
    bg: 'bg-rose-500/10 dark:bg-rose-400/10',
    text: 'deleted task',
  },
  board_created: {
    icon: RiKanbanView2,
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10 dark:bg-cyan-400/10',
    text: 'created board',
  },
  board_renamed: {
    icon: RiEditLine,
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10 dark:bg-cyan-400/10',
    text: 'renamed board',
  },
  board_deleted: {
    icon: RiDeleteBinLine,
    color: 'text-rose-500',
    bg: 'bg-rose-500/10 dark:bg-rose-400/10',
    text: 'deleted board',
  },
  column_created: {
    icon: RiAddLine,
    color: 'text-teal-500',
    bg: 'bg-teal-500/10 dark:bg-teal-400/10',
    text: 'created column',
  },
  column_renamed: {
    icon: RiEditLine,
    color: 'text-teal-500',
    bg: 'bg-teal-500/10 dark:bg-teal-400/10',
    text: 'renamed column',
  },
  column_deleted: {
    icon: RiDeleteBinLine,
    color: 'text-rose-500',
    bg: 'bg-rose-500/10 dark:bg-rose-400/10',
    text: 'deleted column',
  },
};

export function RecentActivityWidget({
  activities,
  maxEntries = 6,
}: RecentActivityWidgetProps) {
  const recentList = activities
    .slice()
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, maxEntries);

  return (
    <Card className="p-5 sm:p-6 flex flex-col justify-between h-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <RiHistoryLine className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Recent Activity
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Live audit stream of application events
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-full">
          {activities.length} Total Logged
        </span>
      </div>

      {/* Activity Log List or Empty State */}
      {recentList.length === 0 ? (
        <div className="py-6">
          <EmptyState
            icon={<RiHistoryLine />}
            title="No activity recorded"
            description="Actions you perform will appear here automatically."
          />
        </div>
      ) : (
        <div className="space-y-3">
          {recentList.map((act) => {
            const config = EVENT_CONFIG[act.eventType] || EVENT_CONFIG.task_edited;
            const Icon = config.icon;
            const formattedTime = formatDistanceToNow(new Date(act.timestamp), {
              addSuffix: true,
            });

            return (
              <motion.div
                key={act.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
              >
                <div className={`p-2 rounded-lg ${config.bg} ${config.color} mt-0.5 flex-shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs text-zinc-800 dark:text-zinc-200 font-medium leading-relaxed">
                    <span className="text-zinc-500 dark:text-zinc-400 font-normal">
                      {config.text}:{' '}
                    </span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">
                      "{act.entityTitle}"
                    </span>
                  </p>
                  <span className="text-[11px] text-zinc-400 dark:text-zinc-500 block mt-0.5">
                    {formattedTime}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
