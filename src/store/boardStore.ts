import { create } from 'zustand';
import { boardService } from '@/services/BoardService';
import { usePreferencesStore } from './preferencesStore';
import type { Board, Column } from '@/types/board.types';
import type {
  CreateBoardInput,
  UpdateBoardInput,
  CreateColumnInput,
  UpdateColumnInput,
} from '@/types/board.types';

interface BoardState {
  boards: Board[];
  columns: Column[];
  activeBoardId: string | null;
  isLoading: boolean;
  error: string | null;

  loadBoards(workspaceId: string): Promise<void>;
  setActiveBoard(workspaceId: string, boardId: string): void;
  createBoard(data: CreateBoardInput): Promise<Board>;
  updateBoard(id: string, data: UpdateBoardInput): Promise<Board>;
  deleteBoard(id: string): Promise<void>;
  reorderColumns(boardId: string, columnIds: string[]): Promise<void>;
  createColumn(data: CreateColumnInput): Promise<Column>;
  updateColumn(id: string, data: UpdateColumnInput): Promise<Column>;
  deleteColumn(id: string): Promise<void>;
  refreshColumns(boardId: string): Promise<void>;
}

export const useBoardStore = create<BoardState>((set, get) => ({
  boards: [],
  columns: [],
  activeBoardId: null,
  isLoading: false,
  error: null,

  async loadBoards(workspaceId) {
    set({ boards: [], columns: [], activeBoardId: null, isLoading: true, error: null });

    try {
      let boards = await boardService.getAll(workspaceId);

      // Auto-create a default General Board if workspace has no boards
      if (boards.length === 0 && workspaceId) {
        try {
          const defaultBoard = await boardService.create({
            name: 'General',
            workspaceId,
            color: '#3b82f6',
            icon: '📋',
          });
          boards = [defaultBoard];
        } catch {
          // Ignore auto-create error
        }
      }

      // Fetch columns for each board
      const columnsList: Column[][] = await Promise.all(
        boards.map((b) => boardService.getColumns(b.id))
      );
      const columns = columnsList.flat();

      const prefs = usePreferencesStore.getState();
      const preferredBoardId = prefs.activeBoardIds[workspaceId];
      const activeBoardId =
        preferredBoardId && boards.some((b) => b.id === preferredBoardId)
          ? preferredBoardId
          : (boards[0]?.id ?? null);

      set({ boards, columns, activeBoardId, isLoading: false });
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message || 'Failed to load boards';
      set({ isLoading: false, error: msg });
    }
  },

  setActiveBoard(workspaceId, boardId) {
    const currentBoards = get().boards;
    if (currentBoards.length > 0 && !currentBoards.some((b) => b.id === boardId)) {
      return;
    }
    set({ activeBoardId: boardId });
    usePreferencesStore.getState().setActiveBoard(workspaceId, boardId);
  },

  async createBoard(data) {
    set({ isLoading: true, error: null });
    try {
      const board = await boardService.create(data);
      const newColumns = await boardService.getColumns(board.id);
      set((s) => ({
        boards: [...s.boards, board],
        columns: [...s.columns, ...newColumns],
        activeBoardId: board.id,
        isLoading: false,
      }));
      usePreferencesStore.getState().setActiveBoard(data.workspaceId, board.id);
      return board;
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message || 'Failed to create board';
      set({ isLoading: false, error: msg });
      throw err;
    }
  },

  async updateBoard(id, data) {
    set({ isLoading: true, error: null });
    try {
      const updated = await boardService.update(id, data);
      set((s) => ({
        boards: s.boards.map((b) => (b.id === id ? updated : b)),
        isLoading: false,
      }));
      return updated;
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message || 'Failed to update board';
      set({ isLoading: false, error: msg });
      throw err;
    }
  },

  async deleteBoard(id) {
    set({ isLoading: true, error: null });
    try {
      await boardService.delete(id);
      const remaining = get().boards.filter((b) => b.id !== id);
      const activeId = get().activeBoardId === id ? (remaining[0]?.id ?? null) : get().activeBoardId;

      set({
        boards: remaining,
        columns: get().columns.filter((c) => c.boardId !== id),
        activeBoardId: activeId,
        isLoading: false,
      });
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message || 'Failed to delete board';
      set({ isLoading: false, error: msg });
      throw err;
    }
  },

  async reorderColumns(boardId, columnIds) {
    try {
      await boardService.reorderColumns(boardId, columnIds);
      const refreshed = await boardService.getColumns(boardId);
      set((s) => ({
        boards: s.boards.map((b) => (b.id === boardId ? { ...b, columnIds } : b)),
        columns: [...s.columns.filter((c) => c.boardId !== boardId), ...refreshed],
      }));
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message || 'Failed to reorder columns';
      set({ error: msg });
    }
  },

  async createColumn(data) {
    set({ isLoading: true, error: null });
    try {
      const column = await boardService.createColumn(data);
      set((s) => ({
        boards: s.boards.map((b) =>
          b.id === data.boardId ? { ...b, columnIds: [...b.columnIds, column.id] } : b
        ),
        columns: [...s.columns, column],
        isLoading: false,
      }));
      return column;
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message || 'Failed to create column';
      set({ isLoading: false, error: msg });
      throw err;
    }
  },

  async updateColumn(id, data) {
    set({ isLoading: true, error: null });
    try {
      const updated = await boardService.updateColumn(id, data);
      set((s) => ({
        columns: s.columns.map((c) => (c.id === id ? updated : c)),
        isLoading: false,
      }));
      return updated;
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message || 'Failed to update column';
      set({ isLoading: false, error: msg });
      throw err;
    }
  },

  async deleteColumn(id) {
    const column = get().columns.find((c) => c.id === id);
    if (!column) return;
    set({ isLoading: true, error: null });
    try {
      await boardService.deleteColumn(id);
      set((s) => ({
        boards: s.boards.map((b) =>
          b.id === column.boardId
            ? { ...b, columnIds: b.columnIds.filter((cid) => cid !== id) }
            : b
        ),
        columns: s.columns.filter((c) => c.id !== id),
        isLoading: false,
      }));
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message || 'Failed to delete column';
      set({ isLoading: false, error: msg });
      throw err;
    }
  },

  async refreshColumns(boardId) {
    try {
      const refreshed = await boardService.getColumns(boardId);
      set((s) => ({
        columns: [...s.columns.filter((c) => c.boardId !== boardId), ...refreshed],
      }));
    } catch {
      // Ignore refresh error
    }
  },
}));
