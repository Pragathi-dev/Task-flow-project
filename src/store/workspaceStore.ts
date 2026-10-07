import { create } from 'zustand';
import { workspaceService } from '@/services/WorkspaceService';
import { usePreferencesStore } from './preferencesStore';
import type { Workspace } from '@/types/workspace.types';
import type {
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
} from '@/types/workspace.types';

interface WorkspaceState {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  isLoading: boolean;
  error: string | null;

  loadWorkspaces(): Promise<void>;
  setActiveWorkspace(id: string): void;
  createWorkspace(data: CreateWorkspaceInput): Promise<Workspace>;
  updateWorkspace(id: string, data: UpdateWorkspaceInput): Promise<Workspace>;
  deleteWorkspace(id: string): Promise<void>;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: [],
  activeWorkspaceId: null,
  isLoading: false,
  error: null,

  async loadWorkspaces() {
    set({ isLoading: true, error: null });
    try {
      let workspaces = await workspaceService.getAll();

      // If user has 0 workspaces, create a default workspace automatically
      if (workspaces.length === 0) {
        try {
          const defaultWs = await workspaceService.create({
            name: 'General Workspace',
            color: '#3b82f6',
            icon: '💼',
          });
          workspaces = [defaultWs];
        } catch {
          // Ignore auto-create error if any
        }
      }

      const prefs = usePreferencesStore.getState();
      const activeId =
        prefs.activeWorkspaceId &&
        workspaces.some((w) => w.id === prefs.activeWorkspaceId)
          ? prefs.activeWorkspaceId
          : (workspaces[0]?.id ?? null);

      set({ workspaces, activeWorkspaceId: activeId, isLoading: false });
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message || 'Failed to load workspaces';
      set({ isLoading: false, error: msg });
    }
  },

  setActiveWorkspace(id) {
    set({ activeWorkspaceId: id });
    usePreferencesStore.getState().setActiveWorkspace(id);
  },

  async createWorkspace(data) {
    set({ isLoading: true, error: null });
    try {
      const workspace = await workspaceService.create(data);
      set((s) => ({
        workspaces: [...s.workspaces, workspace],
        activeWorkspaceId: workspace.id,
        isLoading: false,
      }));
      usePreferencesStore.getState().setActiveWorkspace(workspace.id);
      return workspace;
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message || 'Failed to create workspace';
      set({ isLoading: false, error: msg });
      throw err;
    }
  },

  async updateWorkspace(id, data) {
    set({ isLoading: true, error: null });
    try {
      const updated = await workspaceService.update(id, data);
      set((s) => ({
        workspaces: s.workspaces.map((w) => (w.id === id ? updated : w)),
        isLoading: false,
      }));
      return updated;
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message || 'Failed to update workspace';
      set({ isLoading: false, error: msg });
      throw err;
    }
  },

  async deleteWorkspace(id) {
    set({ isLoading: true, error: null });
    try {
      await workspaceService.delete(id);
      const remaining = get().workspaces.filter((w) => w.id !== id);
      const currentActiveId = get().activeWorkspaceId;
      const newActiveId = currentActiveId === id ? (remaining[0]?.id ?? null) : currentActiveId;

      set({
        workspaces: remaining,
        activeWorkspaceId: newActiveId,
        isLoading: false,
      });

      if (newActiveId) {
        usePreferencesStore.getState().setActiveWorkspace(newActiveId);
      }
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message || 'Failed to delete workspace';
      set({ isLoading: false, error: msg });
      throw err;
    }
  },
}));
