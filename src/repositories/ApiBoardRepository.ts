import { apiClient } from '@/services/apiClient';
import type { IBoardRepository } from './interfaces';
import type { Board } from '@/types/board.types';

export class ApiBoardRepository implements IBoardRepository {
  async findAllAsync(workspaceId: string): Promise<Board[]> {
    return apiClient.get<Board[]>(`/workspaces/${workspaceId}/boards`);
  }

  async findByIdAsync(id: string): Promise<Board | null> {
    try {
      return await apiClient.get<Board>(`/boards/${id}`);
    } catch {
      return null;
    }
  }

  async saveAsync(board: Board): Promise<Board> {
    const existing = board.id ? await this.findByIdAsync(board.id) : null;
    if (existing) {
      return apiClient.put<Board>(`/boards/${board.id}`, {
        name: board.name,
        color: board.color,
        icon: board.icon,
      });
    } else {
      return apiClient.post<Board>(`/workspaces/${board.workspaceId}/boards`, {
        name: board.name,
        workspaceId: board.workspaceId,
        color: board.color,
        icon: board.icon,
      });
    }
  }

  async deleteAsync(id: string): Promise<void> {
    await apiClient.delete(`/boards/${id}`);
  }

  async deleteByWorkspaceAsync(workspaceId: string): Promise<void> {
    const boards = await this.findAllAsync(workspaceId);
    for (const b of boards) {
      await this.deleteAsync(b.id);
    }
  }

  // Legacy sync interface compliance
  findAll(): Board[] {
    throw new Error('Use async repository method for API-backed persistence');
  }
  findById(): Board | null {
    throw new Error('Use async repository method for API-backed persistence');
  }
  save(): void {
    throw new Error('Use async repository method for API-backed persistence');
  }
  delete(): void {
    throw new Error('Use async repository method for API-backed persistence');
  }
  deleteByWorkspace(): void {
    throw new Error('Use async repository method for API-backed persistence');
  }
}

export const apiBoardRepository = new ApiBoardRepository();
