/**
 * Shared primitive types used across multiple domain modules.
 * Keep this file free of cross-domain imports to avoid circular dependencies.
 */

/** Task urgency level, used for visual priority and rule engine scoring. */
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

/**
 * A coloured tag that can be applied to tasks.
 * Labels are workspace-scoped and reusable across boards.
 */
export interface Label {
  /** UUID v4 */
  id: string;
  /** Display name (e.g., "Bug", "Feature", "Blocked") */
  name: string;
  /** Hex colour code (e.g., "#ef4444") */
  color: string;
}

/**
 * A single search hit returned by useSearch.
 * Task is typed as the full Task interface — imported at barrel level to avoid circulars.
 */
export interface SearchResult {
  taskId: string;
  taskTitle: string;
  taskPriority: Priority;
  boardId: string;
  boardName: string;
  workspaceId: string;
  workspaceName: string;
  columnId: string;
  columnName: string;
}
