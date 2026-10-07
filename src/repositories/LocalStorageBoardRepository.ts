import { storageService } from '@/services/StorageService';
import { STORAGE_KEYS } from '@/config/constants';
import type { IBoardRepository } from './interfaces';
import type { Board } from '@/types/board.types';

export class LocalStorageBoardRepository implements IBoardRepository {
  findAll(workspaceId: string): Board[] {
    const all = storageService.get<Board[]>(STORAGE_KEYS.BOARDS) ?? [];
    return all
      .filter((b) => b.workspaceId === workspaceId)
      .sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
  }

  findById(id: string): Board | null {
    const all = storageService.get<Board[]>(STORAGE_KEYS.BOARDS) ?? [];
    return all.find((b) => b.id === id) ?? null;
  }

  save(board: Board): void {
    const all = storageService.get<Board[]>(STORAGE_KEYS.BOARDS) ?? [];
    const idx = all.findIndex((b) => b.id === board.id);
    if (idx === -1) {
      storageService.set(STORAGE_KEYS.BOARDS, [...all, board]);
    } else {
      const updated = [...all];
      updated[idx] = board;
      storageService.set(STORAGE_KEYS.BOARDS, updated);
    }
  }

  delete(id: string): void {
    const all = storageService.get<Board[]>(STORAGE_KEYS.BOARDS) ?? [];
    storageService.set(STORAGE_KEYS.BOARDS, all.filter((b) => b.id !== id));
  }

  deleteByWorkspace(workspaceId: string): void {
    const all = storageService.get<Board[]>(STORAGE_KEYS.BOARDS) ?? [];
    storageService.set(
      STORAGE_KEYS.BOARDS,
      all.filter((b) => b.workspaceId !== workspaceId),
    );
  }
}

export const boardRepository: IBoardRepository =
  new LocalStorageBoardRepository();
