import { apiClient } from '@/services/apiClient';
import type { IColumnRepository } from './interfaces';
import type { Column } from '@/types/board.types';

export class ApiColumnRepository implements IColumnRepository {
  async findAllAsync(boardId: string): Promise<Column[]> {
    return apiClient.get<Column[]>(`/boards/${boardId}/columns`);
  }

  async findByIdAsync(id: string): Promise<Column | null> {
    try {
      return await apiClient.get<Column>(`/columns/${id}`);
    } catch {
      return null;
    }
  }

  async saveAsync(column: Column): Promise<Column> {
    const existing = column.id ? await this.findByIdAsync(column.id) : null;
    if (existing) {
      return apiClient.put<Column>(`/columns/${column.id}`, {
        name: column.name,
        order: column.order,
      });
    } else {
      return apiClient.post<Column>(`/boards/${column.boardId}/columns`, {
        name: column.name,
        boardId: column.boardId,
        order: column.order,
      });
    }
  }

  async deleteAsync(id: string): Promise<void> {
    await apiClient.delete(`/columns/${id}`);
  }

  async deleteByBoardAsync(boardId: string): Promise<void> {
    const columns = await this.findAllAsync(boardId);
    for (const c of columns) {
      await this.deleteAsync(c.id);
    }
  }

  // Legacy sync interface compliance
  findAll(): Column[] {
    throw new Error('Use async repository method for API-backed persistence');
  }
  findById(): Column | null {
    throw new Error('Use async repository method for API-backed persistence');
  }
  save(): void {
    throw new Error('Use async repository method for API-backed persistence');
  }
  delete(): void {
    throw new Error('Use async repository method for API-backed persistence');
  }
  deleteByBoard(): void {
    throw new Error('Use async repository method for API-backed persistence');
  }
}

export const apiColumnRepository = new ApiColumnRepository();
