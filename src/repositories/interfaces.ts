/**
 * Repository interfaces — the persistence contracts for each domain entity.
 *
 * These interfaces are the ONLY seam between the Service Layer and the
 * Storage/API Layer. Swapping from localStorage to a REST API requires
 * only creating new Api*Repository implementations of these interfaces.
 *
 * Services depend on these interfaces, not on concrete implementations.
 */
import type { Task } from '@/types/task.types';
import type { Board, Column } from '@/types/board.types';
import type { Workspace } from '@/types/workspace.types';
import type { Activity } from '@/types/activity.types';
import type { UserPreferences } from '@/types/preferences.types';

// ─── Task Repository ─────────────────────────────────────────────────────────

export interface ITaskRepository {
  /** Return all tasks for a specific board, ordered by task.order. */
  findAll(boardId: string): Task[];
  /**
   * Return ALL tasks across all workspaces.
   * Used to build the global in-memory index in taskStore.
   */
  findAllAcrossWorkspaces(): Task[];
  /** Return a single task by ID, or null. */
  findById(id: string): Task | null;
  /** Upsert a task (insert if new, replace if existing). */
  save(task: Task): void;
  /** Hard-delete a task by ID. */
  delete(id: string): void;
  /** Delete all tasks belonging to a specific board. */
  deleteByBoard(boardId: string): void;
  /** Delete all tasks belonging to a specific workspace. */
  deleteByWorkspace(workspaceId: string): void;
}

// ─── Column Repository ───────────────────────────────────────────────────────

export interface IColumnRepository {
  /** Return all columns for a specific board, ordered by column.order. */
  findAll(boardId: string): Column[];
  /** Return a single column by ID, or null. */
  findById(id: string): Column | null;
  /** Upsert a column. */
  save(column: Column): void;
  /** Hard-delete a column by ID. */
  delete(id: string): void;
  /** Delete all columns belonging to a specific board. */
  deleteByBoard(boardId: string): void;
}

// ─── Board Repository ────────────────────────────────────────────────────────

export interface IBoardRepository {
  /** Return all boards for a specific workspace. */
  findAll(workspaceId: string): Board[];
  /** Return a single board by ID, or null. */
  findById(id: string): Board | null;
  /** Upsert a board. */
  save(board: Board): void;
  /** Hard-delete a board by ID. */
  delete(id: string): void;
  /** Delete all boards belonging to a specific workspace. */
  deleteByWorkspace(workspaceId: string): void;
}

// ─── Workspace Repository ────────────────────────────────────────────────────

export interface IWorkspaceRepository {
  /** Return all workspaces, ordered by createdAt ascending. */
  findAll(): Workspace[];
  /** Return a single workspace by ID, or null. */
  findById(id: string): Workspace | null;
  /** Upsert a workspace. */
  save(workspace: Workspace): void;
  /** Hard-delete a workspace by ID. */
  delete(id: string): void;
}

// ─── Activity Repository ─────────────────────────────────────────────────────

export interface IActivityRepository {
  /** Return all activity entries, ordered by timestamp ascending. */
  findAll(): Activity[];
  findAllAsync(): Promise<Activity[]>;
  /** Return all activities for a specific task (entityId === taskId). */
  findByTask(taskId: string): Activity[];
  findByTaskAsync(taskId: string): Promise<Activity[]>;
  /** Return all activities for a specific workspace. */
  findByWorkspace(workspaceId: string): Activity[];
  findByWorkspaceAsync(workspaceId: string): Promise<Activity[]>;
  /** Append a new activity entry. Enforces the MAX_ACTIVITIES_STORED cap. */
  save(activity: Activity): void;
  /** Delete all activities associated with a specific entity ID. */
  deleteByEntity(entityId: string): void;
}

// ─── Preferences Repository ──────────────────────────────────────────────────

export interface IPreferencesRepository {
  /** Return the current user preferences, or sensible defaults. */
  get(): UserPreferences;
  /** Persist the full preferences object. */
  save(prefs: UserPreferences): void;
}
