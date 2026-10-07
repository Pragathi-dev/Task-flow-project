import { apiClient } from '@/services/apiClient';
import type { IWorkspaceRepository } from './interfaces';
import type { Workspace } from '@/types/workspace.types';

export class ApiWorkspaceRepository implements IWorkspaceRepository {
  async findAllAsync(): Promise<Workspace[]> {
    return apiClient.get<Workspace[]>('/workspaces');
  }

  async findByIdAsync(id: string): Promise<Workspace | null> {
    try {
      return await apiClient.get<Workspace>(`/workspaces/${id}`);
    } catch {
      return null;
    }
  }

  async saveAsync(workspace: Workspace): Promise<Workspace> {
    const existing = workspace.id ? await this.findByIdAsync(workspace.id) : null;
    if (existing) {
      return apiClient.put<Workspace>(`/workspaces/${workspace.id}`, {
        name: workspace.name,
        color: workspace.color,
        icon: workspace.icon,
      });
    } else {
      return apiClient.post<Workspace>('/workspaces', {
        name: workspace.name,
        color: workspace.color,
        icon: workspace.icon,
      });
    }
  }

  async deleteAsync(id: string): Promise<void> {
    await apiClient.delete(`/workspaces/${id}`);
  }

  // Legacy sync interface compliance
  findAll(): Workspace[] {
    throw new Error('Use async repository method for API-backed persistence');
  }
  findById(): Workspace | null {
    throw new Error('Use async repository method for API-backed persistence');
  }
  save(): void {
    throw new Error('Use async repository method for API-backed persistence');
  }
  delete(): void {
    throw new Error('Use async repository method for API-backed persistence');
  }
}

export const apiWorkspaceRepository = new ApiWorkspaceRepository();
