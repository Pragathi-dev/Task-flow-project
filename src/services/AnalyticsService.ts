/**
 * AnalyticsService — pure computation utility.
 *
 * Takes task and activity arrays as inputs, returns analytics data.
 * No store interaction. No storage reads. No side effects.
 * Always called from useAnalytics() with live data from taskStore.allTasks.
 */
import { format, subDays, isAfter, isBefore, startOfDay } from 'date-fns';
import { PRODUCTIVITY_THRESHOLDS } from '@/config/constants';
import type { Task } from '@/types/task.types';
import type { Activity } from '@/types/activity.types';
import type { AnalyticsData, WeeklyTrendData } from '@/types/analytics.types';
import type { Priority } from '@/types/common.types';

export const analyticsService = {
  /**
   * Compute a full AnalyticsData snapshot from a task array.
   * Pure function — no storage reads, no side effects.
   */
  compute(tasks: Task[]): AnalyticsData {
    const now = new Date();
    const in24h = new Date(
      now.getTime() +
        PRODUCTIVITY_THRESHOLDS.DEADLINE_WARNING_HOURS * 60 * 60 * 1000,
    );

    const completedTasks = tasks.filter((t) => t.completedAt !== null);
    const openTasks = tasks.filter((t) => t.completedAt === null);

    const overdueTasks = openTasks.filter(
      (t) => t.dueDate !== null && isBefore(new Date(t.dueDate), now),
    );

    const dueSoonTasks = openTasks.filter(
      (t) =>
        t.dueDate !== null &&
        isAfter(new Date(t.dueDate), now) &&
        isBefore(new Date(t.dueDate), in24h),
    );

    const completionRate =
      tasks.length > 0
        ? Math.round((completedTasks.length / tasks.length) * 100)
        : 0;

    // Priority breakdown
    const byPriority: Record<Priority, number> = {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0,
    };
    for (const task of tasks) {
      byPriority[task.priority] = (byPriority[task.priority] ?? 0) + 1;
    }

    // Column breakdown (by column name — tasks carry their columnId,
    // but for display purposes we group by a stable column identity)
    const byColumn: Record<string, number> = {};
    for (const task of tasks) {
      byColumn[task.columnId] = (byColumn[task.columnId] ?? 0) + 1;
    }

    // Estimated hours
    const totalEstimatedHours = openTasks.reduce(
      (sum, t) => sum + (t.estimatedHours ?? 0),
      0,
    );
    const completedEstimatedHours = completedTasks.reduce(
      (sum, t) => sum + (t.estimatedHours ?? 0),
      0,
    );

    // Most active board
    const boardCounts: Record<string, number> = {};
    for (const task of tasks) {
      boardCounts[task.boardId] = (boardCounts[task.boardId] ?? 0) + 1;
    }
    const mostActiveBoardId =
      Object.entries(boardCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ??
      null;

    return {
      totalTasks: tasks.length,
      completedTasks: completedTasks.length,
      overdueTasks: overdueTasks.length,
      dueSoonTasks: dueSoonTasks.length,
      completionRate,
      byPriority,
      byColumn,
      totalEstimatedHours,
      completedEstimatedHours,
      weeklyTrend: [], // populated separately via computeWeeklyTrend
      mostActiveBoardId,
    };
  },

  /**
   * Compute a 7-day rolling trend from the activity log.
   * Buckets task_created and task_completed events by calendar day.
   */
  computeWeeklyTrend(activities: Activity[]): WeeklyTrendData[] {
    const today = startOfDay(new Date());
    const days: WeeklyTrendData[] = [];

    for (let i = 6; i >= 0; i--) {
      const day = subDays(today, i);
      const dayStart = startOfDay(day);
      const dayEnd = new Date(dayStart.getTime() + 86_400_000);

      const created = activities.filter(
        (a) =>
          a.eventType === 'task_created' &&
          isAfter(new Date(a.timestamp), dayStart) &&
          isBefore(new Date(a.timestamp), dayEnd),
      ).length;

      const completed = activities.filter(
        (a) =>
          a.eventType === 'task_completed' &&
          isAfter(new Date(a.timestamp), dayStart) &&
          isBefore(new Date(a.timestamp), dayEnd),
      ).length;

      days.push({
        label: format(day, 'EEE'),
        date: format(day, 'yyyy-MM-dd'),
        created,
        completed,
      });
    }

    return days;
  },
};
