/**
 * dateUtils — date-fns wrappers for the TaskFlow domain.
 * Pure functions. No imports from app modules.
 */
import {
  format,
  formatDistanceToNow,
  isToday,
  isTomorrow,
  isPast,
  differenceInHours,
  differenceInDays,
  parseISO,
} from 'date-fns';

/**
 * Format an ISO 8601 date string for display on a task card.
 * Returns "Today", "Tomorrow", a short date, or null for no date.
 */
export function formatDueDate(isoDate: string | null): string | null {
  if (!isoDate) return null;
  const date = parseISO(isoDate);
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'MMM d');
}

/**
 * Return a human-readable relative timestamp (e.g., "2 hours ago").
 */
export function formatRelativeTime(isoTimestamp: string): string {
  return formatDistanceToNow(parseISO(isoTimestamp), { addSuffix: true });
}

/**
 * Format an ISO 8601 timestamp for the activity timeline.
 * Returns a full date string (e.g., "Jul 14, 2025 at 3:42 PM").
 */
export function formatActivityTimestamp(isoTimestamp: string): string {
  return format(parseISO(isoTimestamp), "MMM d, yyyy 'at' h:mm a");
}

/** Returns true if the due date is in the past and the task is not complete. */
export function isOverdue(dueDate: string | null, completedAt: string | null): boolean {
  if (!dueDate || completedAt) return false;
  return isPast(parseISO(dueDate));
}

/** Returns true if the due date is within the next N hours. */
export function isDueSoon(dueDate: string | null, withinHours = 24): boolean {
  if (!dueDate) return false;
  const due = parseISO(dueDate);
  const hours = differenceInHours(due, new Date());
  return hours >= 0 && hours <= withinHours;
}

/** Returns the number of days since a given ISO 8601 timestamp. */
export function daysSince(isoTimestamp: string): number {
  return differenceInDays(new Date(), parseISO(isoTimestamp));
}

/** Returns the number of hours until a given ISO 8601 date. Negative if past. */
export function hoursUntil(isoDate: string): number {
  return differenceInHours(parseISO(isoDate), new Date());
}
