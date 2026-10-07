/**
 * Analytics domain types.
 * All analytics data is derived (computed) — never stored in its own store.
 */
import type { Priority } from './common.types';

/** Aggregated stats for a single time-bucket in the weekly trend. */
export interface WeeklyTrendData {
  /** Short day label, e.g. "Mon", "Tue" */
  label: string;
  /** ISO 8601 date for the bucket */
  date: string;
  /** Tasks completed on this day */
  completed: number;
  /** Tasks created on this day */
  created: number;
}

/** Full analytics snapshot for a workspace or the entire application. */
export interface AnalyticsData {
  /** Total tasks across all columns */
  totalTasks: number;
  /** Tasks with completedAt !== null */
  completedTasks: number;
  /** Tasks where dueDate < now && completedAt === null */
  overdueTasks: number;
  /** Tasks due within the next 24 hours and not completed */
  dueSoonTasks: number;
  /** Completion rate 0–100 */
  completionRate: number;
  /** Breakdown by priority level */
  byPriority: Record<Priority, number>;
  /** Breakdown by column name */
  byColumn: Record<string, number>;
  /** Total estimated hours across all open tasks */
  totalEstimatedHours: number;
  /** Total estimated hours across completed tasks */
  completedEstimatedHours: number;
  /** Rolling 7-day daily trend */
  weeklyTrend: WeeklyTrendData[];
  /** Board ID with the most tasks; null if no tasks */
  mostActiveBoardId: string | null;
}
