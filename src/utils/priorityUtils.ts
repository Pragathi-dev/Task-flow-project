/**
 * priorityUtils — Priority → display mapping helpers.
 * Pure functions. No side effects. No app module imports.
 */
import type { Priority } from '@/types/common.types';

/** Map a Priority to its Tailwind text colour class. */
export function priorityToColor(priority: Priority): string {
  const map: Record<Priority, string> = {
    low: 'text-green-500',
    medium: 'text-amber-500',
    high: 'text-red-500',
    urgent: 'text-violet-600',
  };
  return map[priority];
}

/** Map a Priority to its Tailwind background colour class (for badges). */
export function priorityToBadgeClass(priority: Priority): string {
  const map: Record<Priority, string> = {
    low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    medium:
      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    urgent:
      'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  };
  return map[priority];
}

/** Map a Priority to its hex accent colour (used in SVG charts). */
export function priorityToHex(priority: Priority): string {
  const map: Record<Priority, string> = {
    low: '#22c55e',
    medium: '#f59e0b',
    high: '#ef4444',
    urgent: '#7c3aed',
  };
  return map[priority];
}

/** Map a Priority to its display label. */
export function priorityToLabel(priority: Priority): string {
  const map: Record<Priority, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    urgent: 'Urgent',
  };
  return map[priority];
}

/**
 * Numeric sort weight for priority — higher number = higher priority.
 * Used for ascending sort (urgent tasks first).
 */
export function priorityToSortWeight(priority: Priority): number {
  const map: Record<Priority, number> = {
    low: 1,
    medium: 2,
    high: 3,
    urgent: 4,
  };
  return map[priority];
}

/** All priority values in descending order (urgent → low). */
export const PRIORITY_ORDER: Priority[] = ['urgent', 'high', 'medium', 'low'];
