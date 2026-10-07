/**
 * useTheme — wraps themeStore and exposes a clean API for components.
 * Components never import themeStore directly — they use this hook.
 */
import { useThemeStore } from '@/store/themeStore';
import type { ThemeMode } from '@/types/preferences.types';

export interface UseThemeReturn {
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
}

export function useTheme(): UseThemeReturn {
  const mode = useThemeStore((s) => s.mode);
  const isDark = useThemeStore((s) => s.isDark);
  const setMode = useThemeStore((s) => s.setMode);

  return { mode, isDark, setMode };
}
