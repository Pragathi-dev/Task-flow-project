/**
 * ActivityService — domain logic for reading Activity audit records.
 * Communicates with IActivityRepository.
 */
import { activityRepository } from '@/repositories';
import type { Activity } from '@/types/activity.types';

export const activityService = {
  /** Return all activities sorted newest-first. */
  async getAll(): Promise<Activity[]> {
    return activityRepository.findAllAsync();
  },

  /** Return all activities for a workspace sorted newest-first. */
  async getByWorkspace(workspaceId: string): Promise<Activity[]> {
    return activityRepository.findByWorkspaceAsync(workspaceId);
  },

  /** Return all activities for a task sorted newest-first. */
  async getByTask(taskId: string): Promise<Activity[]> {
    return activityRepository.findByTaskAsync(taskId);
  },
};
