import { RiMenuLine, RiLogoutBoxRLine, RiUser3Line } from 'react-icons/ri';
import { SearchBar } from '@/components/common/SearchBar';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/utils/cn';

interface TopBarProps {
  title?: string;
  onMenuClick: () => void;
  actions?: React.ReactNode;
  className?: string;
}

export function TopBar({ title, onMenuClick, actions, className }: TopBarProps) {
  const { user, logout } = useAuthStore();

  return (
    <header
      className={cn(
        'h-14 flex items-center gap-3 px-4 border-b border-zinc-200 dark:border-zinc-800',
        'bg-white dark:bg-zinc-900 flex-shrink-0',
        className,
      )}
    >
      {/* Mobile hamburger */}
      <button
        onClick={onMenuClick}
        aria-label="Open navigation"
        className="md:hidden h-8 w-8 flex items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
      >
        <RiMenuLine size={18} />
      </button>

      {/* Page title */}
      {title && (
        <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate flex-shrink-0 hidden sm:block">
          {title}
        </h1>
      )}

      <div className="flex-1" />

      {/* Search */}
      <SearchBar />

      {/* Page-level actions */}
      {actions && <div className="flex items-center gap-2">{actions}</div>}

      {/* User Info & Logout */}
      {user && (
        <div className="flex items-center gap-2 pl-2 border-l border-zinc-200 dark:border-zinc-800">
          <div className="hidden lg:flex flex-col text-right">
            <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 leading-tight">
              {user.fullName || user.email.split('@')[0]}
            </span>
            <span className="text-[10px] text-zinc-500 truncate max-w-[120px]">
              {user.email}
            </span>
          </div>

          <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-semibold">
            {user.fullName ? user.fullName[0].toUpperCase() : <RiUser3Line />}
          </div>

          <button
            onClick={logout}
            title="Log out"
            aria-label="Log out"
            className="h-8 w-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
          >
            <RiLogoutBoxRLine size={16} />
          </button>
        </div>
      )}

      {/* Theme toggle */}
      <div className="hidden md:block">
        <ThemeToggle />
      </div>
    </header>
  );
}
