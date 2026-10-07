/**
 * BoardService — domain logic for Board and Column operations.
 * Communicates with IBoardRepository and IColumnRepository.
 */
import {
  boardRepository,
  columnRepository,
} from '@/repositories';
import { APP_LIMITS } from '@/config/constants';
import type { Board, Column } from '@/types/board.types';
import type {
  CreateBoardInput,
  UpdateBoardInput,
  CreateColumnInput,
  UpdateColumnInput,
} from '@/types/board.types';

export const boardService = {
  // ── Boards ──────────────────────────────────────────────────────────────────

  /** Return all boards for a workspace. */
  async getAll(workspaceId: string): Promise<Board[]> {
    return boardRepository.findAllAsync(workspaceId);
  },

  /** Return a board by ID, or null. */
  async getById(id: string): Promise<Board | null> {
    return boardRepository.findByIdAsync(id);
  },

  /** Create a new board within a workspace. */
  async create(data: CreateBoardInput): Promise<Board> {
    const existing = await boardRepository.findAllAsync(data.workspaceId);
    if (existing.length >= APP_LIMITS.MAX_BOARDS_PER_WORKSPACE) {
      throw new Error(
        `Maximum of ${APP_LIMITS.MAX_BOARDS_PER_WORKSPACE} boards per workspace reached.`,
      );
    }

    const dummyBoard: Board = {
      id: '',
      name: data.name.trim(),
      workspaceId: data.workspaceId,
      columnIds: [],
      color: data.color,
      icon: data.icon,
      createdAt: '',
      updatedAt: '',
    };

    return boardRepository.saveAsync(dummyBoard);
  },

  /** Update board name, color, or icon. */
  async update(id: string, data: UpdateBoardInput): Promise<Board> {
    const existing = await boardRepository.findByIdAsync(id);
    const updatedBoard: Board = {
      id,
      name: data.name !== undefined ? data.name.trim() : (existing?.name ?? ''),
      workspaceId: existing?.workspaceId ?? '',
      columnIds: existing?.columnIds ?? [],
      color: data.color !== undefined ? data.color : (existing?.color ?? '#3b82f6'),
      icon: data.icon !== undefined ? data.icon : (existing?.icon ?? '📋'),
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return boardRepository.saveAsync(updatedBoard);
  },

  /** Delete a board. */
  async delete(id: string): Promise<void> {
    await boardRepository.deleteAsync(id);
  },

  /** Reorder columns within a board. */
  async reorderColumns(boardId: string, columnIds: string[]): Promise<Board> {
    const board = await boardRepository.findByIdAsync(boardId);
    if (!board) throw new Error(`Board "${boardId}" not found.`);

    // If API endpoint reorder is supported
    const columns = await columnRepository.findAllAsync(boardId);
    for (let i = 0; i < columnIds.length; i++) {
      const col = columns.find((c) => c.id === columnIds[i]);
      if (col) {
        await columnRepository.saveAsync({ ...col, order: i });
      }
    }

    return { ...board, columnIds };
  },

  // ── Columns ─────────────────────────────────────────────────────────────────

  /** Return all columns for a board. */
  async getColumns(boardId: string): Promise<Column[]> {
    return columnRepository.findAllAsync(boardId);
  },

  /** Create a column within a board. */
  async createColumn(data: CreateColumnInput): Promise<Column> {
    const existing = await columnRepository.findAllAsync(data.boardId);
    if (existing.length >= APP_LIMITS.MAX_COLUMNS_PER_BOARD) {
      throw new Error(
        `Maximum of ${APP_LIMITS.MAX_COLUMNS_PER_BOARD} columns per board reached.`,
      );
    }

    const dummyColumn: Column = {
      id: '',
      name: data.name.trim(),
      boardId: data.boardId,
      taskIds: [],
      order: existing.length,
      createdAt: '',
    };

    return columnRepository.saveAsync(dummyColumn);
  },

  /** Rename a column. */
  async updateColumn(id: string, data: UpdateColumnInput): Promise<Column> {
    const existing = await columnRepository.findByIdAsync(id);
    const updatedColumn: Column = {
      id,
      name: data.name !== undefined ? data.name.trim() : (existing?.name ?? ''),
      boardId: existing?.boardId ?? '',
      taskIds: existing?.taskIds ?? [],
      order: existing?.order ?? 0,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };

    return columnRepository.saveAsync(updatedColumn);
  },

  /** Delete a column. */
  async deleteColumn(id: string): Promise<void> {
    await columnRepository.deleteAsync(id);
  },
};
