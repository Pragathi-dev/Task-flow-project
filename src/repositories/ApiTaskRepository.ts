import { apiClient } from '@/services/apiClient';
import type { ITaskRepository } from './interfaces';
import type { Task } from '@/types/task.types';

export class ApiTaskRepository implements ITaskRepository {
  async findAllAsync(boardId: string): Promise<Task[]> {
    return apiClient.get<Task[]>(`/boards/${boardId}/tasks`);
  }

  async findByIdAsync(id: string): Promise<Task | null> {
    try {
      return await apiClient.get<Task>(`/tasks/${id}`);
    } catch {
      return null;
    }
  }

  async saveAsync(task: Task): Promise<Task> {
    const existing = task.id ? await this.findByIdAsync(task.id) : null;
    if (existing) {
      return apiClient.put<Task>(`/tasks/${task.id}`, {
        title: task.title,
        description: task.description,
        priority: task.priority,
        labels: task.labels,
        dueDate: task.dueDate,
        estimatedHours: task.estimatedHours,
      });
    } else {
      return apiClient.post<Task>('/tasks', {
        title: task.title,
        columnId: task.columnId,
        boardId: task.boardId,
        workspaceId: task.workspaceId,
        description: task.description,
        priority: task.priority,
        labels: task.labels,
        dueDate: task.dueDate,
        estimatedHours: task.estimatedHours,
      });
    }
  }

  async moveAsync(taskId: string, sourceColumnId: string, destinationColumnId: string, newOrder: number): Promise<Task> {
    return apiClient.put<Task>(`/tasks/${taskId}/move`, {
      sourceColumnId,
      destinationColumnId,
      newOrder,
    });
  }

  async toggleCompleteAsync(taskId: string): Promise<Task> {
    return apiClient.put<Task>(`/tasks/${taskId}/complete`);
  }

  async deleteAsync(id: string): Promise<void> {
    await apiClient.delete(`/tasks/${id}`);
  }

  async deleteByBoardAsync(boardId: string): Promise<void> {
    const tasks = await this.findAllAsync(boardId);
    for (const t of tasks) {
      await this.deleteAsync(t.id);
    }
  }

  // Legacy sync interface compliance
  findAll(): Task[] {
    throw new Error('Use async repository method for API-backed persistence');
  }
  findAllAcrossWorkspaces(): Task[] {
    throw new Error('Use async repository method for API-backed persistence');
  }
  findById(): Task | null {
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
  deleteByWorkspace(): void {
    throw new Error('Use async repository method for API-backed persistence');
  }
}

export const apiTaskRepository = new ApiTaskRepository();
