import { storageService } from '@/services/StorageService';
import { STORAGE_KEYS } from '@/config/constants';
import type { IWorkspaceRepository } from './interfaces';
import type { Workspace } from '@/types/workspace.types';

export class LocalStorageWorkspaceRepository implements IWorkspaceRepository {
  findAll(): Workspace[] {
    const all = storageService.get<Workspace[]>(STORAGE_KEYS.WORKSPACES) ?? [];
    return [...all].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }

  findById(id: string): Workspace | null {
    const all = storageService.get<Workspace[]>(STORAGE_KEYS.WORKSPACES) ?? [];
    return all.find((w) => w.id === id) ?? null;
  }

  save(workspace: Workspace): void {
    const all = storageService.get<Workspace[]>(STORAGE_KEYS.WORKSPACES) ?? [];
    const idx = all.findIndex((w) => w.id === workspace.id);
    if (idx === -1) {
      storageService.set(STORAGE_KEYS.WORKSPACES, [...all, workspace]);
    } else {
      const updated = [...all];
      updated[idx] = workspace;
      storageService.set(STORAGE_KEYS.WORKSPACES, updated);
    }
  }

  delete(id: string): void {
    const all = storageService.get<Workspace[]>(STORAGE_KEYS.WORKSPACES) ?? [];
    storageService.set(
      STORAGE_KEYS.WORKSPACES,
      all.filter((w) => w.id !== id),
    );
  }
}

export const workspaceRepository: IWorkspaceRepository =
  new LocalStorageWorkspaceRepository();
