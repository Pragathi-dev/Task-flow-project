import { create } from 'zustand';
import { taskService } from '@/services/TaskService';
import type { Task, ChecklistItem } from '@/types/task.types';
import type {
  CreateTaskInput,
  UpdateTaskInput,
  TaskFilters,
  SortOption,
} from '@/types/task.types';

interface TaskState {
  allTasks: Task[];
  selectedTaskId: string | null;
  filters: TaskFilters;
  sortBy: SortOption;
  isLoading: boolean;
  error: string | null;

  loadAllTasks(): Promise<void>;
  createTask(data: CreateTaskInput): Promise<Task>;
  updateTask(id: string, data: UpdateTaskInput): Promise<Task>;
  deleteTask(id: string): Promise<void>;
  moveTask(
    taskId: string,
    sourceColumnId: string,
    destinationColumnId: string,
    newOrder: number,
  ): Promise<void>;
  completeTask(id: string): Promise<void>;
  reopenTask(id: string): Promise<void>;
  addComment(taskId: string, text: string): Promise<void>;
  deleteComment(taskId: string, commentId: string): Promise<void>;
  updateChecklist(taskId: string, items: ChecklistItem[]): Promise<void>;
  setSelectedTask(id: string | null): void;
  setFilters(filters: Partial<TaskFilters>): void;
  setSortBy(sort: SortOption): void;
  clearFilters(): void;
}

const DEFAULT_FILTERS: TaskFilters = {
  priority: undefined,
  labelIds: undefined,
  status: 'all',
};

export const useTaskStore = create<TaskState>((set, get) => ({
  allTasks: [],
  selectedTaskId: null,
  filters: { ...DEFAULT_FILTERS },
  sortBy: 'order',
  isLoading: false,
  error: null,

  async loadAllTasks() {
    set({ isLoading: true, error: null });
    try {
      const allTasks = await taskService.getAllAcrossWorkspaces();
      set({ allTasks, isLoading: false });
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message || 'Failed to load tasks';
      set({ isLoading: false, error: msg });
    }
  },

  async createTask(data) {
    set({ isLoading: true, error: null });
    try {
      const task = await taskService.create(data);
      set((s) => ({ allTasks: [...s.allTasks, task], isLoading: false }));
      return task;
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message || 'Failed to create task';
      set({ isLoading: false, error: msg });
      throw err;
    }
  },

  async updateTask(id, data) {
    set({ isLoading: true, error: null });
    try {
      const updated = await taskService.update(id, data);
      set((s) => ({
        allTasks: s.allTasks.map((t) => (t.id === id ? updated : t)),
        isLoading: false,
      }));
      return updated;
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message || 'Failed to update task';
      set({ isLoading: false, error: msg });
      throw err;
    }
  },

  async deleteTask(id) {
    set({ isLoading: true, error: null });
    try {
      await taskService.delete(id);
      set((s) => ({
        allTasks: s.allTasks.filter((t) => t.id !== id),
        selectedTaskId: s.selectedTaskId === id ? null : s.selectedTaskId,
        isLoading: false,
      }));
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message || 'Failed to delete task';
      set({ isLoading: false, error: msg });
      throw err;
    }
  },

  async moveTask(taskId, sourceColumnId, destinationColumnId, newOrder) {
    // Optimistic update
    set((s) => {
      const task = s.allTasks.find((t) => t.id === taskId);
      if (!task) return s;

      const destTasks = s.allTasks
        .filter((t) => t.columnId === destinationColumnId && t.id !== taskId)
        .sort((a, b) => a.order - b.order);

      destTasks.splice(newOrder, 0, { ...task, columnId: destinationColumnId, order: newOrder });
      const reordered = destTasks.map((t, i) => ({ ...t, order: i }));
      const updatedMap = new Map(reordered.map((t) => [t.id, t]));

      const newAllTasks = s.allTasks.map((t) => {
        if (updatedMap.has(t.id)) return updatedMap.get(t.id)!;
        return t;
      });

      return { allTasks: newAllTasks };
    });

    try {
      const persisted = await taskService.move(
        taskId,
        sourceColumnId,
        destinationColumnId,
        newOrder,
      );
      set((s) => ({
        allTasks: s.allTasks.map((t) => (t.id === persisted.id ? persisted : t)),
      }));
    } catch (err) {
      console.error('[taskStore] moveTask persist failed — reloading', err);
      await get().loadAllTasks();
    }
  },

  async completeTask(id) {
    try {
      const updated = await taskService.complete(id);
      set((s) => ({
        allTasks: s.allTasks.map((t) => (t.id === id ? updated : t)),
      }));
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message || 'Failed to complete task';
      set({ error: msg });
    }
  },

  async reopenTask(id) {
    try {
      const updated = await taskService.reopen(id);
      set((s) => ({
        allTasks: s.allTasks.map((t) => (t.id === id ? updated : t)),
      }));
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message || 'Failed to reopen task';
      set({ error: msg });
    }
  },

  async addComment(taskId, text) {
    try {
      const updated = await taskService.addComment(taskId, text);
      set((s) => ({
        allTasks: s.allTasks.map((t) => (t.id === taskId ? updated : t)),
      }));
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message || 'Failed to add comment';
      set({ error: msg });
    }
  },

  async deleteComment(taskId, commentId) {
    try {
      const updated = await taskService.deleteComment(taskId, commentId);
      set((s) => ({
        allTasks: s.allTasks.map((t) => (t.id === taskId ? updated : t)),
      }));
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message || 'Failed to delete comment';
      set({ error: msg });
    }
  },

  async updateChecklist(taskId, items) {
    try {
      const updated = await taskService.updateChecklist(taskId, items);
      set((s) => ({
        allTasks: s.allTasks.map((t) => (t.id === taskId ? updated : t)),
      }));
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message || 'Failed to update checklist';
      set({ error: msg });
    }
  },

  setSelectedTask(id) {
    set({ selectedTaskId: id });
  },

  setFilters(filters) {
    set((s) => ({ filters: { ...s.filters, ...filters } }));
  },

  setSortBy(sort) {
    set({ sortBy: sort });
  },

  clearFilters() {
    set({ filters: { ...DEFAULT_FILTERS } });
  },
}));
