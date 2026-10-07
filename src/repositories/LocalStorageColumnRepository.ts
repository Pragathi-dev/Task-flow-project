import { storageService } from '@/services/StorageService';
import { STORAGE_KEYS } from '@/config/constants';
import type { IColumnRepository } from './interfaces';
import type { Column } from '@/types/board.types';

export class LocalStorageColumnRepository implements IColumnRepository {
  findAll(boardId: string): Column[] {
    const all = storageService.get<Column[]>(STORAGE_KEYS.COLUMNS) ?? [];
    return all
      .filter((c) => c.boardId === boardId)
      .sort((a, b) => a.order - b.order);
  }

  findById(id: string): Column | null {
    const all = storageService.get<Column[]>(STORAGE_KEYS.COLUMNS) ?? [];
    return all.find((c) => c.id === id) ?? null;
  }

  save(column: Column): void {
    const all = storageService.get<Column[]>(STORAGE_KEYS.COLUMNS) ?? [];
    const idx = all.findIndex((c) => c.id === column.id);
    if (idx === -1) {
      storageService.set(STORAGE_KEYS.COLUMNS, [...all, column]);
    } else {
      const updated = [...all];
      updated[idx] = column;
      storageService.set(STORAGE_KEYS.COLUMNS, updated);
    }
  }

  delete(id: string): void {
    const all = storageService.get<Column[]>(STORAGE_KEYS.COLUMNS) ?? [];
    storageService.set(STORAGE_KEYS.COLUMNS, all.filter((c) => c.id !== id));
  }

  deleteByBoard(boardId: string): void {
    const all = storageService.get<Column[]>(STORAGE_KEYS.COLUMNS) ?? [];
    storageService.set(
      STORAGE_KEYS.COLUMNS,
      all.filter((c) => c.boardId !== boardId),
    );
  }
}

export const columnRepository: IColumnRepository =
  new LocalStorageColumnRepository();
