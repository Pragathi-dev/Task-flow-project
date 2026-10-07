/**
 * TaskService — domain logic for all Task operations.
 * Communicates with ITaskRepository.
 */
import { apiClient } from '@/services/apiClient';
import { taskRepository } from '@/repositories';
import { APP_LIMITS } from '@/config/constants';
import type { Task, ChecklistItem } from '@/types/task.types';
import type { CreateTaskInput, UpdateTaskInput } from '@/types/task.types';

export const taskService = {
  /** Return all tasks for a board. */
  async getAll(boardId: string): Promise<Task[]> {
    return taskRepository.findAllAsync(boardId);
  },

  /** Return ALL tasks across all workspaces. */
  async getAllAcrossWorkspaces(): Promise<Task[]> {
    try {
      const workspaces = await apiClient.get<{ id: string }[]>('/workspaces');
      const allTasks: Task[] = [];
      for (const ws of workspaces) {
        const boards = await apiClient.get<{ id: string }[]>(`/workspaces/${ws.id}/boards`);
        for (const b of boards) {
          const tasks = await taskRepository.findAllAsync(b.id);
          allTasks.push(...tasks);
        }
      }
      return allTasks;
    } catch {
      return [];
    }
  },

  /** Return a task by ID, or null. */
  async getById(id: string): Promise<Task | null> {
    return taskRepository.findByIdAsync(id);
  },

  /** Create a task in the specified column. */
  async create(data: CreateTaskInput): Promise<Task> {
    const tasksInColumn = (await taskRepository.findAllAsync(data.boardId)).filter(
      (t) => t.columnId === data.columnId,
    );
    if (tasksInColumn.length >= APP_LIMITS.MAX_TASKS_PER_COLUMN) {
      throw new Error(
        `Column has reached the limit of ${APP_LIMITS.MAX_TASKS_PER_COLUMN} tasks.`,
      );
    }

    const dummyTask: Task = {
      id: '',
      title: data.title.trim(),
      description: data.description,
      priority: data.priority ?? 'medium',
      labels: data.labels ?? [],
      dueDate: data.dueDate ?? null,
      estimatedHours: data.estimatedHours ?? 0,
      createdAt: '',
      updatedAt: '',
      completedAt: null,
      columnId: data.columnId,
      boardId: data.boardId,
      workspaceId: data.workspaceId,
      checklist: [],
      comments: [],
      order: tasksInColumn.length,
    };

    return taskRepository.saveAsync(dummyTask);
  },

  /** Update mutable task fields. */
  async update(id: string, data: UpdateTaskInput): Promise<Task> {
    const existing = await taskRepository.findByIdAsync(id);
    const updatedTask: Task = {
      id,
      title: data.title !== undefined ? data.title.trim() : (existing?.title ?? ''),
      description: data.description !== undefined ? data.description : existing?.description,
      priority: data.priority !== undefined ? data.priority : (existing?.priority ?? 'medium'),
      labels: data.labels !== undefined ? data.labels : (existing?.labels ?? []),
      dueDate: data.dueDate !== undefined ? data.dueDate : (existing?.dueDate ?? null),
      estimatedHours: data.estimatedHours !== undefined ? data.estimatedHours : (existing?.estimatedHours ?? 0),
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: existing?.completedAt ?? null,
      columnId: existing?.columnId ?? '',
      boardId: existing?.boardId ?? '',
      workspaceId: existing?.workspaceId ?? '',
      checklist: existing?.checklist ?? [],
      comments: existing?.comments ?? [],
      order: existing?.order ?? 0,
    };

    return taskRepository.saveAsync(updatedTask);
  },

  /** Delete a task. */
  async delete(id: string): Promise<void> {
    await taskRepository.deleteAsync(id);
  },

  /** Move a task between columns (or reorder within the same column). */
  async move(
    taskId: string,
    sourceColumnId: string,
    destinationColumnId: string,
    newOrder: number,
  ): Promise<Task> {
    return taskRepository.moveAsync(taskId, sourceColumnId, destinationColumnId, newOrder);
  },

  /** Mark a task complete. */
  async complete(taskId: string): Promise<Task> {
    return taskRepository.toggleCompleteAsync(taskId);
  },

  /** Reopen a completed task. */
  async reopen(taskId: string): Promise<Task> {
    return taskRepository.toggleCompleteAsync(taskId);
  },

  /** Append a comment to the task. */
  async addComment(taskId: string, text: string): Promise<Task> {
    const res = await apiClient.post<{ id: string; text: string; createdAt: string }>(
      `/tasks/${taskId}/comments`,
      { text }
    );
    const task = await taskRepository.findByIdAsync(taskId);
    if (!task) throw new Error(`Task ${taskId} not found.`);
    return {
      ...task,
      comments: [...task.comments, { id: res.id, text: res.text, createdAt: res.createdAt }],
    };
  },

  /** Remove a comment from the task. */
  async deleteComment(taskId: string, commentId: string): Promise<Task> {
    await apiClient.delete(`/comments/${commentId}`);
    const task = await taskRepository.findByIdAsync(taskId);
    if (!task) throw new Error(`Task ${taskId} not found.`);
    return {
      ...task,
      comments: task.comments.filter((c) => c.id !== commentId),
    };
  },

  /** Replace/update checklist items for a task. */
  async updateChecklist(taskId: string, items: ChecklistItem[]): Promise<Task> {
    if (items.length > APP_LIMITS.MAX_CHECKLIST_ITEMS) {
      throw new Error(
        `Checklist cannot exceed ${APP_LIMITS.MAX_CHECKLIST_ITEMS} items.`,
      );
    }
    const task = await taskRepository.findByIdAsync(taskId);
    if (!task) throw new Error(`Task ${taskId} not found.`);

    for (const item of items) {
      const existing = task.checklist.find((c) => c.id === item.id);
      if (!existing) {
        await apiClient.post(`/tasks/${taskId}/checklist`, {
          text: item.text,
          order: item.order,
        });
      } else if (existing.completed !== item.completed || existing.text !== item.text) {
        await apiClient.put(`/checklist/${item.id}`, {
          text: item.text,
          completed: item.completed,
          order: item.order,
        });
      }
    }

    for (const existing of task.checklist) {
      if (!items.some((i) => i.id === existing.id)) {
        await apiClient.delete(`/checklist/${existing.id}`);
      }
    }

    const updatedTask = await taskRepository.findByIdAsync(taskId);
    return updatedTask ?? task;
  },
};
