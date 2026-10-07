/**
 * Activity types for the global audit log.
 * Activities are immutable — written once, never modified.
 * Stored ONLY in the global activities array; NOT inline on Task objects.
 */

/** Discriminated union of all auditable domain events. */
export type ActivityEventType =
  | 'task_created'
  | 'task_edited'
  | 'task_moved'
  | 'task_completed'
  | 'task_reopened'
  | 'task_deleted'
  | 'board_created'
  | 'board_renamed'
  | 'board_deleted'
  | 'column_created'
  | 'column_renamed'
  | 'column_deleted';

/**
 * An immutable audit log entry for a domain event.
 * Written by the Service Layer; never modified after creation.
 */
export interface Activity {
  /** UUID v4 */
  id: string;
  /** Discriminated event type */
  eventType: ActivityEventType;
  /** ID of the primary entity affected */
  entityId: string;
  /** Human-readable title of the entity at the time of the event */
  entityTitle: string;
  /** Scope identifiers for filtering */
  workspaceId: string;
  boardId: string;
  columnId?: string;
  /**
   * Arbitrary event-specific metadata.
   * Examples:
   *   task_moved   → { fromColumn: string; toColumn: string }
   *   task_edited  → { field: string; oldValue: unknown; newValue: unknown }
   *   task_edited  → { action: 'comment_added' }
   */
  meta?: Record<string, unknown>;
  /** ISO 8601 timestamp */
  timestamp: string;
}
