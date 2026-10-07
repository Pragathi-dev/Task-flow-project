import { useMemo } from 'react';
import { useBoardStore } from '@/store/boardStore';
import type { Board, Column } from '@/types/board.types';
import type {
  CreateBoardInput,
  UpdateBoardInput,
  CreateColumnInput,
  UpdateColumnInput,
} from '@/types/board.types';

export interface UseBoardReturn {
  boards: Board[];
  activeBoard: Board | null;
  activeBoardId: string | null;
  columns: Column[];
  activeBoardColumns: Column[];
  isLoading: boolean;
  loadBoards: (workspaceId: string) => Promise<void>;
  setActiveBoard: (workspaceId: string, boardId: string) => void;
  createBoard: (data: CreateBoardInput) => Promise<Board>;
  updateBoard: (id: string, data: UpdateBoardInput) => Promise<Board>;
  deleteBoard: (id: string) => Promise<void>;
  reorderColumns: (boardId: string, columnIds: string[]) => Promise<void>;
  createColumn: (data: CreateColumnInput) => Promise<Column>;
  updateColumn: (id: string, data: UpdateColumnInput) => Promise<Column>;
  deleteColumn: (id: string) => Promise<void>;
}

export function useBoard(): UseBoardReturn {
  const boards = useBoardStore((s) => s.boards);
  const columns = useBoardStore((s) => s.columns);
  const activeBoardId = useBoardStore((s) => s.activeBoardId);
  const isLoading = useBoardStore((s) => s.isLoading);
  const loadBoards = useBoardStore((s) => s.loadBoards);
  const setActiveBoard = useBoardStore((s) => s.setActiveBoard);
  const createBoard = useBoardStore((s) => s.createBoard);
  const updateBoard = useBoardStore((s) => s.updateBoard);
  const deleteBoard = useBoardStore((s) => s.deleteBoard);
  const reorderColumns = useBoardStore((s) => s.reorderColumns);
  const createColumn = useBoardStore((s) => s.createColumn);
  const updateColumn = useBoardStore((s) => s.updateColumn);
  const deleteColumn = useBoardStore((s) => s.deleteColumn);

  const activeBoard = useMemo(
    () => boards.find((b) => b.id === activeBoardId) ?? null,
    [boards, activeBoardId],
  );

  const activeBoardColumns = useMemo(() => {
    if (!activeBoardId) return [];
    return columns
      .filter((c) => c.boardId === activeBoardId)
      .sort((a, b) => a.order - b.order);
  }, [columns, activeBoardId]);

  return {
    boards,
    activeBoard,
    activeBoardId,
    columns,
    activeBoardColumns,
    isLoading,
    loadBoards,
    setActiveBoard: (workspaceId, boardId) => setActiveBoard(workspaceId, boardId),
    createBoard,
    updateBoard,
    deleteBoard,
    reorderColumns,
    createColumn,
    updateColumn,
    deleteColumn,
  };
}
