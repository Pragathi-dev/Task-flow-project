/**
 * productivityUtils — Rule engine for the Smart Productivity Assistant.
 *
 * All rules are pure functions. No stores, no services, no side effects.
 * Called from useAnalytics() via useMemo — runs entirely in the browser.
 */
import { v4 as uuidv4 } from 'uuid';
import { differenceInHours, differenceInDays } from 'date-fns';
import {
  PRODUCTIVITY_THRESHOLDS,
} from '@/config/constants';
import type { Task } from '@/types/task.types';
import type {
  ProductivityRule,
  ProductivitySuggestion,
  SuggestionSeverity,
} from '@/types/productivity.types';

// ─── Individual Rules ─────────────────────────────────────────────────────────

/** Rule 1 — Overdue: task is past its due date and not complete. */
const overdueRule: ProductivityRule = {
  id: 'overdue',
  evaluate(task, now) {
    if (!task.dueDate || task.completedAt) return null;
    const due = new Date(task.dueDate);
    if (due >= now) return null;

    const daysLate = differenceInDays(now, due);
    const severity: SuggestionSeverity =
      daysLate > PRODUCTIVITY_THRESHOLDS.OVERDUE_CRITICAL_DAYS
        ? 'critical'
        : 'warning';

    return {
      id: uuidv4(),
      type: 'overdue',
      severity,
      title: `"${task.title}" is overdue`,
      message: `This task was due ${daysLate} day${daysLate !== 1 ? 's' : ''} ago. Complete it or update the due date.`,
      taskId: task.id,
      createdAt: now.toISOString(),
    };
  },
};

/** Rule 2 — Deadline approaching: due within the next 24 hours, not complete. */
const deadlineApproachingRule: ProductivityRule = {
  id: 'deadline_approaching',
  evaluate(task, now) {
    if (!task.dueDate || task.completedAt) return null;
    const due = new Date(task.dueDate);
    const hoursUntilDue = differenceInHours(due, now);

    if (
      hoursUntilDue < 0 ||
      hoursUntilDue > PRODUCTIVITY_THRESHOLDS.DEADLINE_WARNING_HOURS
    ) {
      return null;
    }

    return {
      id: uuidv4(),
      type: 'deadline_approaching',
      severity: 'warning',
      title: `"${task.title}" is due soon`,
      message: `Due in ${Math.round(hoursUntilDue)} hour${hoursUntilDue !== 1 ? 's' : ''}. Make sure to complete or delegate this task.`,
      taskId: task.id,
      createdAt: now.toISOString(),
    };
  },
};

/** Rule 3 — Stalled urgent: priority=urgent, not updated in 3+ days, not complete. */
const stalledUrgentRule: ProductivityRule = {
  id: 'stalled_urgent',
  evaluate(task, now) {
    if (task.priority !== 'urgent' || task.completedAt) return null;
    const daysSinceUpdate = differenceInDays(now, new Date(task.updatedAt));
    if (daysSinceUpdate < PRODUCTIVITY_THRESHOLDS.STALLED_TASK_DAYS) return null;

    return {
      id: uuidv4(),
      type: 'stalled_urgent',
      severity: 'warning',
      title: `Urgent task "${task.title}" appears stalled`,
      message: `This urgent task hasn't been updated in ${daysSinceUpdate} day${daysSinceUpdate !== 1 ? 's' : ''}. Review and unblock it.`,
      taskId: task.id,
      createdAt: now.toISOString(),
    };
  },
};

/** Rule 4 — Split task: >8h estimated, no checklist, not complete. */
const splitTaskRule: ProductivityRule = {
  id: 'split_task',
  evaluate(task, now) {
    if (task.completedAt) return null;
    if ((task.estimatedHours ?? 0) <= PRODUCTIVITY_THRESHOLDS.LARGE_TASK_HOURS) return null;
    if (task.checklist.length > 0) return null;

    return {
      id: uuidv4(),
      type: 'split_task',
      severity: 'info',
      title: `"${task.title}" may need breaking down`,
      message: `Estimated at ${task.estimatedHours}h with no checklist. Consider splitting into sub-tasks for better progress tracking.`,
      taskId: task.id,
      createdAt: now.toISOString(),
    };
  },
};

/** All per-task rules in evaluation order. */
const ALL_RULES: ProductivityRule[] = [
  overdueRule,
  deadlineApproachingRule,
  stalledUrgentRule,
  splitTaskRule,
];

// ─── Productivity Score ───────────────────────────────────────────────────────

function buildScoreMessage(
  score: number,
  overdue: number,
  highPriorityCompleted: number,
  highPriorityTotal: number,
): string {
  if (score >= PRODUCTIVITY_THRESHOLDS.GOOD_SCORE_THRESHOLD) {
    return `Great work! You're completing tasks efficiently${overdue > 0 ? `, though ${overdue} task${overdue !== 1 ? 's are' : ' is'} overdue` : ''}.`;
  }
  if (score >= PRODUCTIVITY_THRESHOLDS.WARN_SCORE_THRESHOLD) {
    const parts: string[] = [];
    if (overdue > 0) parts.push(`${overdue} overdue task${overdue !== 1 ? 's' : ''}`);
    if (highPriorityTotal > 0 && highPriorityCompleted < highPriorityTotal) {
      parts.push(
        `${highPriorityTotal - highPriorityCompleted} high-priority task${highPriorityTotal - highPriorityCompleted !== 1 ? 's' : ''} pending`,
      );
    }
    return parts.length > 0
      ? `Room to improve: ${parts.join(', ')}.`
      : 'Keep focusing on completing your tasks.';
  }
  return `Productivity needs attention — ${overdue} overdue task${overdue !== 1 ? 's' : ''} and low completion rate. Prioritise your workload.`;
}

/**
 * Compute the aggregate Productivity Score (0–100).
 * Formula:
 *   50% → completion rate
 *   30% → overdue penalty (1 − overdue/total)
 *   20% → high-priority completion rate
 */
function computeProductivityScore(
  tasks: Task[],
  now: Date,
): ProductivitySuggestion {
  const total = tasks.length;
  const defaultSuggestion: ProductivitySuggestion = {
    id: 'productivity-score',
    type: 'productivity_score',
    severity: 'info',
    title: 'Productivity score: —',
    message: 'Create some tasks to start tracking your productivity score.',
    createdAt: now.toISOString(),
  };

  if (total === 0) return defaultSuggestion;

  const completed = tasks.filter((t) => t.completedAt).length;
  const overdue = tasks.filter(
    (t) => t.dueDate && !t.completedAt && new Date(t.dueDate) < now,
  ).length;
  const highPriorityCompleted = tasks.filter(
    (t) => (t.priority === 'high' || t.priority === 'urgent') && t.completedAt,
  ).length;
  const highPriorityTotal = tasks.filter(
    (t) => t.priority === 'high' || t.priority === 'urgent',
  ).length;

  const completionRate = completed / total;
  const overduePenalty = 1 - overdue / total;
  const highPriorityRate =
    highPriorityTotal > 0 ? highPriorityCompleted / highPriorityTotal : 1;

  const score = Math.round(
    completionRate * 50 + overduePenalty * 30 + highPriorityRate * 20,
  );

  const severity: SuggestionSeverity =
    score >= PRODUCTIVITY_THRESHOLDS.GOOD_SCORE_THRESHOLD
      ? 'info'
      : score >= PRODUCTIVITY_THRESHOLDS.WARN_SCORE_THRESHOLD
        ? 'warning'
        : 'critical';

  return {
    id: 'productivity-score',
    type: 'productivity_score',
    severity,
    title: `Productivity score: ${score}/100`,
    message: buildScoreMessage(
      score,
      overdue,
      highPriorityCompleted,
      highPriorityTotal,
    ),
    createdAt: now.toISOString(),
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Evaluate all rules against the task array and return sorted suggestions.
 * Sort order: critical → warning → info.
 */
export function evaluateAllRules(
  tasks: Task[],
  now: Date = new Date(),
): ProductivitySuggestion[] {
  const perTaskSuggestions = tasks.flatMap((task) =>
    ALL_RULES.map((rule) => rule.evaluate(task, now)).filter(
      (s): s is ProductivitySuggestion => s !== null,
    ),
  );

  const scoreSuggestion = computeProductivityScore(tasks, now);

  const severityOrder: Record<SuggestionSeverity, number> = {
    critical: 0,
    warning: 1,
    info: 2,
  };

  return [...perTaskSuggestions, scoreSuggestion].sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity],
  );
}

/**
 * Extract just the numeric productivity score (0–100) from a task array.
 * Convenience wrapper used by the Dashboard stat card.
 */
export function computeScore(tasks: Task[], now: Date = new Date()): number {
  const total = tasks.length;
  if (total === 0) return 0;

  const completed = tasks.filter((t) => t.completedAt).length;
  const overdue = tasks.filter(
    (t) => t.dueDate && !t.completedAt && new Date(t.dueDate) < now,
  ).length;
  const highPriorityCompleted = tasks.filter(
    (t) => (t.priority === 'high' || t.priority === 'urgent') && t.completedAt,
  ).length;
  const highPriorityTotal = tasks.filter(
    (t) => t.priority === 'high' || t.priority === 'urgent',
  ).length;

  const completionRate = completed / total;
  const overduePenalty = 1 - overdue / total;
  const highPriorityRate =
    highPriorityTotal > 0 ? highPriorityCompleted / highPriorityTotal : 1;

  return Math.round(
    completionRate * 50 + overduePenalty * 30 + highPriorityRate * 20,
  );
}
