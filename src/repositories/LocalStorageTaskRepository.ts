import { storageService } from '@/services/StorageService';
import { STORAGE_KEYS } from '@/config/constants';
import type { ITaskRepository } from './interfaces';
import type { Task } from '@/types/task.types';

export class LocalStorageTaskRepository implements ITaskRepository {
  findAll(boardId: string): Task[] {
    const all = storageService.get<Task[]>(STORAGE_KEYS.TASKS) ?? [];
    return all
      .filter((t) => t.boardId === boardId)
      .sort((a, b) => a.order - b.order);
  }

  findAllAcrossWorkspaces(): Task[] {
    return storageService.get<Task[]>(STORAGE_KEYS.TASKS) ?? [];
  }

  findById(id: string): Task | null {
    const all = storageService.get<Task[]>(STORAGE_KEYS.TASKS) ?? [];
    return all.find((t) => t.id === id) ?? null;
  }

  save(task: Task): void {
    const all = storageService.get<Task[]>(STORAGE_KEYS.TASKS) ?? [];
    const idx = all.findIndex((t) => t.id === task.id);
    if (idx === -1) {
      storageService.set(STORAGE_KEYS.TASKS, [...all, task]);
    } else {
      const updated = [...all];
      updated[idx] = task;
      storageService.set(STORAGE_KEYS.TASKS, updated);
    }
  }

  delete(id: string): void {
    const all = storageService.get<Task[]>(STORAGE_KEYS.TASKS) ?? [];
    storageService.set(STORAGE_KEYS.TASKS, all.filter((t) => t.id !== id));
  }

  deleteByBoard(boardId: string): void {
    const all = storageService.get<Task[]>(STORAGE_KEYS.TASKS) ?? [];
    storageService.set(
      STORAGE_KEYS.TASKS,
      all.filter((t) => t.boardId !== boardId),
    );
  }

  deleteByWorkspace(workspaceId: string): void {
    const all = storageService.get<Task[]>(STORAGE_KEYS.TASKS) ?? [];
    storageService.set(
      STORAGE_KEYS.TASKS,
      all.filter((t) => t.workspaceId !== workspaceId),
    );
  }
}

export const taskRepository: ITaskRepository = new LocalStorageTaskRepository();
