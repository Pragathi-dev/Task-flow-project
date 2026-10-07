import type { Priority } from './common.types';

/** A single item within a task's checklist. */
export interface ChecklistItem {
  /** UUID v4 */
  id: string;
  /** Display text of the checklist item */
  text: string;
  /** Whether the item has been ticked off */
  completed: boolean;
  /** Order index */
  order?: number;
  /** ISO 8601 timestamp of item creation */
  createdAt: string;
}

/** A user comment attached to a task. */
export interface Comment {
  /** UUID v4 */
  id: string;
  /** Comment body text */
  text: string;
  /** ISO 8601 timestamp */
  createdAt: string;
}

/**
 * The central domain entity.
 * A Task belongs to exactly one Column, one Board, and one Workspace.
 */
export interface Task {
  /** UUID v4 */
  id: string;
  /** Short summary displayed on the card; max 120 chars */
  title: string;
  /** Detailed markdown or plain text description */
  description?: string;
  /** Priority level */
  priority: Priority;
  /** Array of label IDs attached to this task */
  labels: string[];
  /** Due date ISO string (or null if none) */
  dueDate: string | null;
  /** Estimated effort in hours */
  estimatedHours?: number;
  /** ISO 8601 creation timestamp */
  createdAt: string;
  /** ISO 8601 last-updated timestamp */
  updatedAt: string;
  /** ISO 8601 completion timestamp (null = open) */
  completedAt: string | null;
  /** Column ID where this task currently resides */
  columnId: string;
  /** Board ID owning the parent column */
  boardId: string;
  /** Workspace ID owning the parent board */
  workspaceId: string;
  /** Subtask checklist items */
  checklist: ChecklistItem[];
  /** Comments left on this task */
  comments: Comment[];
  /** Position index within its column for manual drag-drop ordering */
  order: number;
}

export type TaskStatusFilter = 'all' | 'open' | 'completed' | 'overdue';

export interface TaskFilters {
  priority?: Priority[];
  labelIds?: string[];
  status?: TaskStatusFilter;
}

export type SortOption = 'order' | 'dueDate' | 'priority' | 'createdAt' | 'title';

export interface CreateTaskInput {
  title: string;
  columnId: string;
  boardId: string;
  workspaceId: string;
  description?: string;
  priority?: Priority;
  labels?: string[];
  dueDate?: string | null;
  estimatedHours?: number;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  priority?: Priority;
  labels?: string[];
  dueDate?: string | null;
  estimatedHours?: number;
}
