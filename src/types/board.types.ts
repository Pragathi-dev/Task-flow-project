/**
 * Board and Column domain types.
 */

/**
 * A vertical lane on a Kanban board.
 * Owns an ordered list of task IDs for fast drag-drop reordering.
 */
export interface Column {
  /** UUID v4 */
  id: string;
  /** Display name (e.g., "To Do", "In Progress", "Done") */
  name: string;
  /** Parent board ID */
  boardId: string;
  /** Ordered array of Task IDs in this column */
  taskIds: string[];
  /** Zero-based position within the board */
  order: number;
  /** ISO 8601 timestamp */
  createdAt: string;
}

/**
 * A Kanban board that groups related columns.
 * Belongs to exactly one Workspace.
 */
export interface Board {
  /** UUID v4 */
  id: string;
  /** Display name */
  name: string;
  /** Parent workspace ID */
  workspaceId: string;
  /** Ordered array of Column IDs */
  columnIds: string[];
  /** ISO 8601 timestamp of board creation */
  createdAt: string;
  /** ISO 8601 timestamp of last modification */
  updatedAt: string;
  /** Optional hex accent colour for the board card */
  color?: string;
  /** Optional emoji or icon identifier */
  icon?: string;
}

/** Fields required to create a new Board. */
export interface CreateBoardInput {
  name: string;
  workspaceId: string;
  color?: string;
  icon?: string;
}

/** Fields that can be updated on an existing Board. */
export interface UpdateBoardInput {
  name?: string;
  color?: string;
  icon?: string;
}

/** Fields required to create a new Column. */
export interface CreateColumnInput {
  name: string;
  boardId: string;
}

/** Fields that can be updated on an existing Column. */
export interface UpdateColumnInput {
  name?: string;
}
