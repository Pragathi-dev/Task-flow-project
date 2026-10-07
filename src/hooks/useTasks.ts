import { useMemo, useCallback } from 'react';
import type { DropResult } from '@hello-pangea/dnd';
import { useTaskStore } from '@/store/taskStore';
import { priorityToSortWeight } from '@/utils/priorityUtils';
import { isOverdue } from '@/utils/dateUtils';
import type { Task } from '@/types/task.types';
import type {
  CreateTaskInput,
  UpdateTaskInput,
  TaskFilters,
  SortOption,
  ChecklistItem,
} from '@/types/task.types';

export interface UseTasksReturn {
  tasks: Task[];
  filteredTasks: Task[];
  tasksByColumnId: Record<string, Task[]>;
  selectedTask: Task | null;
  filters: TaskFilters;
  sortBy: SortOption;
  isLoading: boolean;
  createTask: (data: CreateTaskInput) => Promise<Task>;
  updateTask: (id: string, data: UpdateTaskInput) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  completeTask: (id: string) => Promise<void>;
  reopenTask: (id: string) => Promise<void>;
  addComment: (taskId: string, text: string) => Promise<void>;
  deleteComment: (taskId: string, commentId: string) => Promise<void>;
  updateChecklist: (taskId: string, items: ChecklistItem[]) => Promise<void>;
  setSelectedTask: (id: string | null) => void;
  setFilters: (filters: Partial<TaskFilters>) => void;
  setSortBy: (sort: SortOption) => void;
  clearFilters: () => void;
  handleDragEnd: (result: DropResult) => void;
}

function applyFilters(tasks: Task[], filters: TaskFilters): Task[] {
  let result = tasks;

  if (filters.priority && filters.priority.length > 0) {
    result = result.filter((t) => filters.priority!.includes(t.priority));
  }

  if (filters.labelIds && filters.labelIds.length > 0) {
    result = result.filter((t) =>
      filters.labelIds!.some((lid) => t.labels.includes(lid)),
    );
  }

  if (filters.status && filters.status !== 'all') {
    const now = new Date();
    if (filters.status === 'completed') {
      result = result.filter((t) => t.completedAt !== null);
    } else if (filters.status === 'open') {
      result = result.filter((t) => t.completedAt === null);
    } else if (filters.status === 'overdue') {
      result = result.filter((t) => isOverdue(t.dueDate, t.completedAt) && new Date(t.dueDate!) < now);
    }
  }

  return result;
}

function applySort(tasks: Task[], sortBy: SortOption): Task[] {
  const sorted = [...tasks];
  switch (sortBy) {
    case 'priority':
      return sorted.sort(
        (a, b) => priorityToSortWeight(b.priority) - priorityToSortWeight(a.priority),
      );
    case 'dueDate':
      return sorted.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
    case 'createdAt':
      return sorted.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    case 'title':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case 'order':
    default:
      return sorted.sort((a, b) => a.order - b.order);
  }
}

export function useTasks(boardId: string): UseTasksReturn {
  const allTasks = useTaskStore((s) => s.allTasks);
  const selectedTaskId = useTaskStore((s) => s.selectedTaskId);
  const filters = useTaskStore((s) => s.filters);
  const sortBy = useTaskStore((s) => s.sortBy);
  const isLoading = useTaskStore((s) => s.isLoading);

  const createTask = useTaskStore((s) => s.createTask);
  const updateTask = useTaskStore((s) => s.updateTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const moveTask = useTaskStore((s) => s.moveTask);
  const completeTask = useTaskStore((s) => s.completeTask);
  const reopenTask = useTaskStore((s) => s.reopenTask);
  const addComment = useTaskStore((s) => s.addComment);
  const deleteComment = useTaskStore((s) => s.deleteComment);
  const updateChecklist = useTaskStore((s) => s.updateChecklist);
  const setSelectedTask = useTaskStore((s) => s.setSelectedTask);
  const setFilters = useTaskStore((s) => s.setFilters);
  const setSortBy = useTaskStore((s) => s.setSortBy);
  const clearFilters = useTaskStore((s) => s.clearFilters);

  const tasks = useMemo(
    () => allTasks.filter((t) => t.boardId === boardId),
    [allTasks, boardId],
  );

  const filteredTasks = useMemo(
    () => applySort(applyFilters(tasks, filters), sortBy),
    [tasks, filters, sortBy],
  );

  const tasksByColumnId = useMemo(() => {
    return tasks.reduce<Record<string, Task[]>>((acc, task) => {
      const col = acc[task.columnId] ?? [];
      acc[task.columnId] = [...col, task].sort((a, b) => a.order - b.order);
      return acc;
    }, {});
  }, [tasks]);

  const selectedTask = useMemo(
    () => (selectedTaskId ? (allTasks.find((t) => t.id === selectedTaskId) ?? null) : null),
    [allTasks, selectedTaskId],
  );

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      const { source, destination, draggableId } = result;
      if (!destination) return;
      if (
        source.droppableId === destination.droppableId &&
        source.index === destination.index
      ) return;

      void moveTask(
        draggableId,
        source.droppableId,
        destination.droppableId,
        destination.index,
      );
    },
    [moveTask],
  );

  return {
    tasks,
    filteredTasks,
    tasksByColumnId,
    selectedTask,
    filters,
    sortBy,
    isLoading,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    reopenTask,
    addComment,
    deleteComment,
    updateChecklist,
    setSelectedTask,
    setFilters,
    setSortBy,
    clearFilters,
    handleDragEnd,
  };
}
