import { cn } from '@/utils/cn';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg';

export interface AvatarProps {
  name: string;
  color?: string;
  icon?: string;
  size?: AvatarSize;
  className?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
  xs: 'h-5 w-5 text-[10px]',
  sm: 'h-7 w-7 text-xs',
  md: 'h-8 w-8 text-sm',
  lg: 'h-10 w-10 text-base',
};

/** Deterministic colour derived from the workspace/board name. */
function nameToColor(name: string): string {
  const colors = [
    '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b',
    '#10b981', '#ef4444', '#06b6d4', '#f97316',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export function Avatar({ name, color, icon, size = 'md', className }: AvatarProps) {
  const bg = color ?? nameToColor(name);
  const initials = getInitials(name);

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full font-semibold text-white flex-shrink-0 select-none overflow-hidden',
        sizeClasses[size],
        className,
      )}
      style={{ backgroundColor: bg }}
      aria-label={name}
      title={name}
    >
      {icon ? <span className="leading-none">{icon}</span> : initials}
    </span>
  );
}
