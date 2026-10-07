/**
 * WorkspaceService — domain logic for Workspace operations.
 * Communicates with IWorkspaceRepository (API backend or LocalStorage).
 */
import { workspaceRepository } from '@/repositories';
import { APP_LIMITS } from '@/config/constants';
import type { Workspace } from '@/types/workspace.types';
import type {
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
} from '@/types/workspace.types';

export const workspaceService = {
  /** Return all workspaces, ordered by createdAt ascending. */
  async getAll(): Promise<Workspace[]> {
    return workspaceRepository.findAllAsync();
  },

  /** Return a workspace by ID, or null. */
  async getById(id: string): Promise<Workspace | null> {
    return workspaceRepository.findByIdAsync(id);
  },

  /**
   * Create a new workspace.
   * Validates workspace limits and persists via repository.
   */
  async create(data: CreateWorkspaceInput): Promise<Workspace> {
    const all = await workspaceRepository.findAllAsync();
    if (all.length >= APP_LIMITS.MAX_WORKSPACES) {
      throw new Error(
        `Maximum of ${APP_LIMITS.MAX_WORKSPACES} workspaces reached.`,
      );
    }

    const dummyWorkspace: Workspace = {
      id: '',
      name: data.name.trim(),
      color: data.color,
      icon: data.icon,
      boardIds: [],
      createdAt: '',
      updatedAt: '',
    };

    return workspaceRepository.saveAsync(dummyWorkspace);
  },

  /** Update a workspace's mutable fields. */
  async update(id: string, data: UpdateWorkspaceInput): Promise<Workspace> {
    const existing = await workspaceRepository.findByIdAsync(id);
    const updatedWorkspace: Workspace = {
      id,
      name: data.name !== undefined ? data.name.trim() : (existing?.name ?? ''),
      color: data.color !== undefined ? data.color : (existing?.color ?? '#3b82f6'),
      icon: data.icon !== undefined ? data.icon : (existing?.icon ?? '💼'),
      boardIds: existing?.boardIds ?? [],
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return workspaceRepository.saveAsync(updatedWorkspace);
  },

  /** Delete a workspace. */
  async delete(id: string): Promise<void> {
    await workspaceRepository.deleteAsync(id);
  },
};
