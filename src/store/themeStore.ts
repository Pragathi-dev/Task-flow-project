/**
 * themeStore — manages the application colour scheme.
 *
 * Uses Zustand `persist` middleware so the theme survives page refreshes
 * without a flash of incorrect colour scheme.
 * The `initTheme` action is called once in App.tsx on mount.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ThemeMode } from '@/types/preferences.types';

interface ThemeState {
  mode: ThemeMode;
  /** Derived helper — true when the active resolved theme is dark. */
  isDark: boolean;

  /** Apply a new theme mode and persist it. */
  setMode(mode: ThemeMode): void;
  /**
   * Read the persisted mode, resolve 'system' via matchMedia,
   * apply the CSS class to <html>, and attach a media query listener.
   * Call once on App mount.
   */
  initTheme(): void;
}

function resolveIsDark(mode: ThemeMode): boolean {
  if (mode === 'dark') return true;
  if (mode === 'light') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function applyThemeClass(dark: boolean): void {
  if (dark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'system' as ThemeMode,
      isDark: false,

      setMode(mode) {
        const dark = resolveIsDark(mode);
        applyThemeClass(dark);
        set({ mode, isDark: dark });
      },

      initTheme() {
        const { mode } = get();
        const dark = resolveIsDark(mode);
        applyThemeClass(dark);
        set({ isDark: dark });

        // Keep 'system' mode in sync if the OS preference changes
        if (mode === 'system') {
          const mq = window.matchMedia('(prefers-color-scheme: dark)');
          const handler = (e: MediaQueryListEvent) => {
            const newDark = e.matches;
            applyThemeClass(newDark);
            set({ isDark: newDark });
          };
          mq.addEventListener('change', handler);
          // Note: listener is intentionally persistent for the app lifetime.
          // It will be cleaned up when the browser context closes.
        }
      },
    }),
    {
      name: 'taskflow:theme',
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.initTheme();
        }
      },
    },
  ),
);
