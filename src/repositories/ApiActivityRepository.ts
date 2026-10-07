import { apiClient } from '@/services/apiClient';
import type { IActivityRepository } from './interfaces';
import type { Activity } from '@/types/activity.types';

export class ApiActivityRepository implements IActivityRepository {
  async findAllAsync(): Promise<Activity[]> {
    return apiClient.get<Activity[]>('/activities');
  }

  async findByWorkspaceAsync(workspaceId: string): Promise<Activity[]> {
    return apiClient.get<Activity[]>(`/activities/workspace/${workspaceId}`);
  }

  async findByTaskAsync(taskId: string): Promise<Activity[]> {
    return apiClient.get<Activity[]>(`/activities/task/${taskId}`);
  }

  // Legacy sync interface compliance
  findAll(): Activity[] {
    throw new Error('Use async repository method for API-backed persistence');
  }
  findByTask(): Activity[] {
    throw new Error('Use async repository method for API-backed persistence');
  }
  findByWorkspace(): Activity[] {
    throw new Error('Use async repository method for API-backed persistence');
  }
  save(): void {
    // Activities are recorded automatically on backend
  }
  deleteByEntity(): void {
    // Handled via backend cascade
  }
}

export const apiActivityRepository = new ApiActivityRepository();
