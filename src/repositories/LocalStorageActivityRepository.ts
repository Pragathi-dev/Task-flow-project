import { storageService } from '@/services/StorageService';
import { STORAGE_KEYS, APP_LIMITS } from '@/config/constants';
import type { IActivityRepository } from './interfaces';
import type { Activity } from '@/types/activity.types';

export class LocalStorageActivityRepository implements IActivityRepository {
  async findAllAsync(): Promise<Activity[]> {
    return this.findAll();
  }

  async findByTaskAsync(taskId: string): Promise<Activity[]> {
    return this.findByTask(taskId);
  }

  async findByWorkspaceAsync(workspaceId: string): Promise<Activity[]> {
    return this.findByWorkspace(workspaceId);
  }

  findAll(): Activity[] {
    return storageService.get<Activity[]>(STORAGE_KEYS.ACTIVITIES) ?? [];
  }

  findByTask(taskId: string): Activity[] {
    const all = this.findAll();
    return all
      .filter((a) => a.entityId === taskId)
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );
  }

  findByWorkspace(workspaceId: string): Activity[] {
    const all = this.findAll();
    return all.filter((a) => a.workspaceId === workspaceId);
  }

  save(activity: Activity): void {
    const all = this.findAll();
    const updated = [...all, activity];

    // Enforce the activity cap — keep only the most recent entries
    const capped =
      updated.length > APP_LIMITS.MAX_ACTIVITIES_STORED
        ? updated.slice(updated.length - APP_LIMITS.MAX_ACTIVITIES_STORED)
        : updated;

    storageService.set(STORAGE_KEYS.ACTIVITIES, capped);
  }

  deleteByEntity(entityId: string): void {
    const all = this.findAll();
    storageService.set(
      STORAGE_KEYS.ACTIVITIES,
      all.filter((a) => a.entityId !== entityId),
    );
  }
}

export const activityRepository: IActivityRepository =
  new LocalStorageActivityRepository();
