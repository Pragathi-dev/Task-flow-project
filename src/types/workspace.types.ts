/**
 * Workspace domain types.
 * A Workspace is the top-level organisational unit — groups multiple boards.
 */

/**
 * Top-level organisational unit.
 * Groups multiple boards; analogous to a project or team.
 */
export interface Workspace {
  /** UUID v4 */
  id: string;
  /** Display name */
  name: string;
  /** Hex accent colour for workspace avatar */
  color: string;
  /** Optional emoji icon */
  icon?: string;
  /** ISO 8601 timestamp */
  createdAt: string;
  /** ISO 8601 timestamp */
  updatedAt: string;
  /** Ordered array of Board IDs */
  boardIds: string[];
}

/** Fields required to create a new Workspace. */
export interface CreateWorkspaceInput {
  name: string;
  color: string;
  icon?: string;
}

/** Fields that can be updated on an existing Workspace. */
export interface UpdateWorkspaceInput {
  name?: string;
  color?: string;
  icon?: string;
}
