/**
 * User preferences — persisted via preferencesStore (Zustand persist middleware).
 * Never synced to a backend.
 */

/** Application colour scheme preference. 'system' follows OS dark-mode setting. */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Per-device user preferences.
 */
export interface UserPreferences {
  theme: ThemeMode;
  /** The workspace the user last had open */
  activeWorkspaceId: string | null;
  /**
   * Map of workspaceId → activeBoardId.
   * Remembers the last-viewed board per workspace.
   */
  activeBoardIds: Record<string, string>;
  /** Whether the desktop sidebar is collapsed to icon-only mode */
  sidebarCollapsed: boolean;
}
