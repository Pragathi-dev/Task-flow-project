/**
 * Application-wide constants.
 * Single source of truth for all limits, timing values, and storage key names.
 * Never import individual values from libraries — always reference these constants.
 */

/**
 * Hard limits enforced by the Service Layer.
 * Validated in service methods before writes.
 */
export const APP_LIMITS = {
  MAX_WORKSPACES: 20,
  MAX_BOARDS_PER_WORKSPACE: 50,
  MAX_COLUMNS_PER_BOARD: 10,
  MAX_TASKS_PER_COLUMN: 500,
  MAX_CHECKLIST_ITEMS: 50,
  MAX_COMMENTS_PER_TASK: 100,
  MAX_LABELS_PER_TASK: 10,
  MAX_ACTIVITIES_STORED: 500,
  MAX_TASK_TITLE_LENGTH: 120,
  MAX_TASK_DESCRIPTION_LENGTH: 5000,
  MAX_WORKSPACE_NAME_LENGTH: 50,
  MAX_BOARD_NAME_LENGTH: 50,
  MAX_COLUMN_NAME_LENGTH: 50,
  MAX_COMMENT_LENGTH: 1000,
  MAX_CHECKLIST_ITEM_LENGTH: 200,
  MAX_ESTIMATED_HOURS: 999,
} as const;

/**
 * UI timing constants.
 * Used in hooks, animations, and debounce utilities.
 */
export const TIMING = {
  SEARCH_DEBOUNCE_MS: 150,
  STORAGE_WRITE_DEBOUNCE_MS: 300,
  ANIMATION_FAST_MS: 150,
  ANIMATION_NORMAL_MS: 250,
  ANIMATION_SLOW_MS: 300,
  ANIMATION_STAGGER_MS: 80,
  PAGE_TRANSITION_MS: 250,
  MODAL_TRANSITION_MS: 200,
} as const;

/**
 * localStorage key suffixes (without the 'taskflow:' prefix).
 * Used exclusively by Repository implementations.
 * The prefix is applied by StorageService internally.
 */
export const STORAGE_KEYS = {
  WORKSPACES: 'workspaces',
  BOARDS: 'boards',
  COLUMNS: 'columns',
  TASKS: 'tasks',
  ACTIVITIES: 'activities',
  PREFERENCES: 'preferences',
} as const;

/**
 * Default column names seeded when a new board is created.
 */
export const DEFAULT_COLUMN_NAMES = ['To Do', 'In Progress', 'Done'] as const;

/**
 * Workspace accent colours available during workspace creation.
 */
export const WORKSPACE_COLORS = [
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
  '#ef4444', // red
  '#06b6d4', // cyan
  '#f97316', // orange
] as const;

/**
 * Rule engine thresholds for the Smart Productivity Assistant.
 */
export const PRODUCTIVITY_THRESHOLDS = {
  DEADLINE_WARNING_HOURS: 24,
  STALLED_TASK_DAYS: 3,
  LARGE_TASK_HOURS: 8,
  GOOD_SCORE_THRESHOLD: 70,
  WARN_SCORE_THRESHOLD: 40,
  OVERDUE_CRITICAL_DAYS: 7,
} as const;
