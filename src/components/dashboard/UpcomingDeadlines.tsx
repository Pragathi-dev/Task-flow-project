/**
 * UpcomingDeadlines.tsx — Independent widget showing open tasks sorted by nearest due date.
 *
 * Single Responsibility: Display upcoming task deadlines with relative time & priority indicators.
 */
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow, isBefore, isToday } from 'date-fns';
import { RiCalendarCheckLine, RiTimeLine, RiAlertLine } from 'react-icons/ri';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { TaskPriorityIcon } from '@/components/task/TaskPriorityIcon';
import type { Task } from '@/types/task.types';

export interface UpcomingDeadlinesProps {
  tasks: Task[];
  onSelectTask?: (taskId: string) => void;
}

export function UpcomingDeadlines({ tasks, onSelectTask }: UpcomingDeadlinesProps) {
  const upcomingTasks = useMemo(() => {
    const now = new Date();
    return tasks
      .filter((t) => t.dueDate !== null && t.completedAt === null)
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
      .filter((t) => new Date(t.dueDate!) >= now || isToday(new Date(t.dueDate!)))
      .slice(0, 5); // Limit to top 5 upcoming
  }, [tasks]);

  return (
    <Card className="p-5 sm:p-6 flex flex-col justify-between h-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <RiCalendarCheckLine className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Upcoming Deadlines
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Tasks due next, ordered by deadline
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-full">
          {upcomingTasks.length} Pending
        </span>
      </div>

      {/* Task List or Empty State */}
      {upcomingTasks.length === 0 ? (
        <div className="py-6">
          <EmptyState
            icon={<RiTimeLine />}
            title="No upcoming deadlines"
            description="You're all caught up! No open tasks with due dates."
          />
        </div>
      ) : (
        <div className="space-y-2.5">
          {upcomingTasks.map((task) => {
            const dueDate = new Date(task.dueDate!);
            const now = new Date();
            const overdue = isBefore(dueDate, now) && !isToday(dueDate);
            const dueToday = isToday(dueDate);

            let statusBadge = (
              <Badge variant="secondary">
                {formatDistanceToNow(dueDate, { addSuffix: true })}
              </Badge>
            );

            if (overdue) {
              statusBadge = (
                <Badge variant="danger" className="flex items-center gap-1">
                  <RiAlertLine className="w-3 h-3" />
                  <span>Overdue</span>
                </Badge>
              );
            } else if (dueToday) {
              statusBadge = (
                <Badge variant="warning" className="flex items-center gap-1">
                  <RiTimeLine className="w-3 h-3" />
                  <span>Due Today</span>
                </Badge>
              );
            }

            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => onSelectTask?.(task.id)}
                className="p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 transition-all cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <TaskPriorityIcon priority={task.priority} />
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {task.title}
                    </h4>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate block">
                      {new Date(task.dueDate!).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex-shrink-0">{statusBadge}</div>
              </motion.div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
