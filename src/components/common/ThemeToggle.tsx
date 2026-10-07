import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/utils/cn';
import { RiSunLine, RiMoonLine, RiComputerLine } from 'react-icons/ri';
import type { ThemeMode } from '@/types/preferences.types';

interface ThemeToggleProps {
  className?: string;
  /** 'icon' shows a single cycling button; 'segmented' shows 3 options */
  variant?: 'icon' | 'segmented';
}

const modes: { mode: ThemeMode; icon: React.ComponentType<{ size?: number; className?: string }>; label: string }[] = [
  { mode: 'light', icon: RiSunLine, label: 'Light' },
  { mode: 'dark', icon: RiMoonLine, label: 'Dark' },
  { mode: 'system', icon: RiComputerLine, label: 'System' },
];

export function ThemeToggle({ className, variant = 'icon' }: ThemeToggleProps) {
  const { mode, setMode } = useTheme();

  if (variant === 'segmented') {
    return (
      <div
        className={cn(
          'flex items-center rounded-lg border border-zinc-200 dark:border-zinc-700 p-0.5 bg-zinc-50 dark:bg-zinc-800',
          className,
        )}
        role="group"
        aria-label="Choose theme"
      >
        {modes.map(({ mode: m, icon: Icon, label }) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            aria-pressed={mode === m}
            aria-label={`${label} theme`}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-150',
              mode === m
                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300',
            )}
          >
            <Icon size={13} />
            <span>{label}</span>
          </button>
        ))}
      </div>
    );
  }

  // Single cycling icon button
  const current = modes.find((m) => m.mode === mode) ?? modes[2];
  const next = modes[(modes.indexOf(current) + 1) % modes.length];
  const Icon = current.icon;

  return (
    <button
      onClick={() => setMode(next.mode)}
      aria-label={`Switch to ${next.label} theme`}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-lg',
        'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100',
        'dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800',
        'transition-colors duration-150',
        className,
      )}
    >
      <Icon size={16} />
    </button>
  );
}
