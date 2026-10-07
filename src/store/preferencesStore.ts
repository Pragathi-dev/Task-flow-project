/**
 * preferencesStore — persists per-device UI preferences via Zustand persist middleware.
 *
 * This is one of only two stores using `persist` (the other is themeStore).
 * All other stores read from this store on mount — they never call storageService directly.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PreferencesState {
  activeWorkspaceId: string | null;
  /** Map of workspaceId → last-viewed boardId */
  activeBoardIds: Record<string, string>;
  sidebarCollapsed: boolean;

  setActiveWorkspace(id: string): void;
  setActiveBoard(workspaceId: string, boardId: string): void;
  setSidebarCollapsed(collapsed: boolean): void;
  reset(): void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      activeWorkspaceId: null,
      activeBoardIds: {},
      sidebarCollapsed: false,

      setActiveWorkspace(id) {
        set({ activeWorkspaceId: id });
      },

      setActiveBoard(workspaceId, boardId) {
        set((s) => ({
          activeBoardIds: { ...s.activeBoardIds, [workspaceId]: boardId },
        }));
      },

      setSidebarCollapsed(collapsed) {
        set({ sidebarCollapsed: collapsed });
      },

      reset() {
        set({ activeWorkspaceId: null, activeBoardIds: {}, sidebarCollapsed: false });
      },
    }),
    { name: 'taskflow:preferences' },
  ),
);
