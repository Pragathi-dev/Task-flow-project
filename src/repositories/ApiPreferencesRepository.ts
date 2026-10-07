import type { IPreferencesRepository } from './interfaces';
import type { UserPreferences } from '@/types/preferences.types';

const STORAGE_KEY = 'taskflow:preferences';

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'system',
  sidebarCollapsed: false,
  activeWorkspaceId: null,
  activeBoardIds: {},
};

export class ApiPreferencesRepository implements IPreferencesRepository {
  get(): UserPreferences {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_PREFERENCES };
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
    } catch {
      return { ...DEFAULT_PREFERENCES };
    }
  }

  save(prefs: UserPreferences): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch (err) {
      console.error('[ApiPreferencesRepository] Failed to save preferences', err);
    }
  }
}

export const apiPreferencesRepository = new ApiPreferencesRepository();
