import { storageService } from '@/services/StorageService';
import { STORAGE_KEYS } from '@/config/constants';
import type { IPreferencesRepository } from './interfaces';
import type { UserPreferences } from '@/types/preferences.types';

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'system',
  activeWorkspaceId: null,
  activeBoardIds: {},
  sidebarCollapsed: false,
};

export class LocalStoragePreferencesRepository
  implements IPreferencesRepository
{
  get(): UserPreferences {
    const stored = storageService.get<UserPreferences>(STORAGE_KEYS.PREFERENCES);
    // Merge with defaults to handle missing keys from older persisted data
    return { ...DEFAULT_PREFERENCES, ...stored };
  }

  save(prefs: UserPreferences): void {
    storageService.set(STORAGE_KEYS.PREFERENCES, prefs);
  }
}

export const preferencesRepository: IPreferencesRepository =
  new LocalStoragePreferencesRepository();
