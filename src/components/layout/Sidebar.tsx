import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  RiDashboardLine,
  RiBarChartLine,
  RiTimeLine,
  RiMenuFoldLine,
  RiMenuUnfoldLine,
} from 'react-icons/ri';
import { NavWorkspaceList } from '@/components/navigation/NavWorkspaceList';
import { NavBoardList } from '@/components/navigation/NavBoardList';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { Tooltip } from '@/components/common/Tooltip';
import { usePreferencesStore } from '@/store/preferencesStore';
import { cn } from '@/utils/cn';
import type { Workspace } from '@/types/workspace.types';
import type { Board } from '@/types/board.types';

interface NavLinkProps {
  to: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  collapsed: boolean;
}

function NavLink({ to, icon: Icon, label, collapsed }: NavLinkProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = location.pathname === to;

  const btn = (
    <button
      onClick={() => navigate(to)}
      aria-current={isActive ? 'page' : undefined}
      aria-label={collapsed ? label : undefined}
      className={cn(
        'w-full flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm',
        'transition-colors duration-100',
        isActive
          ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
          : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100',
      )}
    >
      <Icon size={16} className="shrink-0" />
      {!collapsed && <span>{label}</span>}
    </button>
  );

  return collapsed ? (
    <Tooltip content={label} side="right">{btn}</Tooltip>
  ) : btn;
}

interface SidebarProps {
  onCreateWorkspace: () => void;
  onEditWorkspace?: (workspace: Workspace) => void;
  onDeleteWorkspace?: (workspace: Workspace) => void;
  onCreateBoard: () => void;
  onEditBoard?: (board: Board) => void;
  onDeleteBoard?: (board: Board) => void;
}

export function Sidebar({
  onCreateWorkspace,
  onEditWorkspace,
  onDeleteWorkspace,
  onCreateBoard,
  onEditBoard,
  onDeleteBoard,
}: SidebarProps) {
  const collapsed = usePreferencesStore((s) => s.sidebarCollapsed);
  const setSidebarCollapsed = usePreferencesStore((s) => s.setSidebarCollapsed);
  const [_hover, setHover] = useState(false);
  void _hover;

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col h-full border-r border-zinc-200 dark:border-zinc-800',
        'bg-white dark:bg-zinc-900 flex-shrink-0',
        'transition-all duration-300',
        collapsed ? 'w-14' : 'w-60',
      )}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Logo */}
      <div
        className={cn(
          'flex items-center h-14 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0 px-3',
          collapsed ? 'justify-center' : 'justify-between',
        )}
      >
        {!collapsed && (
          <span className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            TaskFlow
          </span>
        )}
        <button
          onClick={() => setSidebarCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="h-7 w-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          {collapsed ? <RiMenuUnfoldLine size={15} /> : <RiMenuFoldLine size={15} />}
        </button>
      </div>

      {/* Primary nav */}
      <div className="px-2 pt-3 pb-2 space-y-0.5">
        <NavLink to="/" icon={RiDashboardLine} label="Dashboard" collapsed={collapsed} />
        <NavLink to="/analytics" icon={RiBarChartLine} label="Analytics" collapsed={collapsed} />
        <NavLink to="/activity" icon={RiTimeLine} label="Activity" collapsed={collapsed} />
      </div>

      <div className="border-t border-zinc-100 dark:border-zinc-800 my-1" />

      {/* Workspaces */}
      <div className="flex-1 overflow-y-auto py-2 space-y-4 min-h-0">
        <NavWorkspaceList
          collapsed={collapsed}
          onCreateWorkspace={onCreateWorkspace}
          onEditWorkspace={onEditWorkspace}
          onDeleteWorkspace={onDeleteWorkspace}
        />
        <NavBoardList
          collapsed={collapsed}
          onCreateBoard={onCreateBoard}
          onEditBoard={onEditBoard}
          onDeleteBoard={onDeleteBoard}
        />
      </div>

      {/* Footer */}
      <div
        className={cn(
          'border-t border-zinc-200 dark:border-zinc-800 px-2 py-2 flex-shrink-0',
          collapsed ? 'flex justify-center' : 'flex items-center justify-between',
        )}
      >
        {!collapsed && (
          <span className="text-xs text-zinc-400 dark:text-zinc-500 px-2">v1.0</span>
        )}
        <ThemeToggle />
      </div>
    </aside>
  );
}
