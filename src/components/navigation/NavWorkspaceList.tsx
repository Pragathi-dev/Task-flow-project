import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { RiAddLine, RiEditLine, RiDeleteBinLine } from 'react-icons/ri';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useBoardStore } from '@/store/boardStore';
import { usePreferencesStore } from '@/store/preferencesStore';
import { boardService } from '@/services/BoardService';
import { Avatar } from '@/components/common/Avatar';
import { Tooltip } from '@/components/common/Tooltip';
import { cn } from '@/utils/cn';
import type { Workspace } from '@/types/workspace.types';

interface NavWorkspaceListProps {
  collapsed?: boolean;
  onCreateWorkspace?: () => void;
  onEditWorkspace?: (workspace: Workspace) => void;
  onDeleteWorkspace?: (workspace: Workspace) => void;
}

export const NavWorkspaceList = memo(function NavWorkspaceList({
  collapsed = false,
  onCreateWorkspace,
  onEditWorkspace,
  onDeleteWorkspace,
}: NavWorkspaceListProps) {
  const { workspaces, activeWorkspaceId, setActiveWorkspace } = useWorkspace();
  const loadBoards = useBoardStore((s) => s.loadBoards);
  const navigate = useNavigate();

  const handleSelect = async (id: string) => {
    setActiveWorkspace(id);
    await loadBoards(id);

    const prefs = usePreferencesStore.getState();
    const preferredBoardId = prefs.activeBoardIds[id];
    const wsBoards = await boardService.getAll(id);
    const targetBoardId =
      preferredBoardId && wsBoards.some((b) => b.id === preferredBoardId)
        ? preferredBoardId
        : (wsBoards[0]?.id ?? null);

    if (targetBoardId) {
      navigate(`/board/${targetBoardId}`);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="px-2 space-y-0.5">
      {!collapsed && (
        <p className="px-2 text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
          Workspaces
        </p>
      )}
      {workspaces.map((ws) => {
        const isActive = ws.id === activeWorkspaceId;
        const btn = (
          <div
            key={ws.id}
            className={cn(
              'group relative w-full flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors duration-100',
              isActive
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100',
            )}
          >
            <button
              onClick={() => void handleSelect(ws.id)}
              aria-current={isActive ? 'page' : undefined}
              aria-label={collapsed ? ws.name : undefined}
              className="flex-1 flex items-center gap-2.5 min-w-0 text-left"
            >
              <Avatar name={ws.name} color={ws.color} icon={ws.icon} size="xs" />
              {!collapsed && (
                <span className="truncate font-medium text-sm">{ws.name}</span>
              )}
            </button>

            {!collapsed && (onEditWorkspace || onDeleteWorkspace) && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                {onEditWorkspace && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditWorkspace(ws);
                    }}
                    className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-md hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60"
                    aria-label={`Edit workspace ${ws.name}`}
                  >
                    <RiEditLine size={13} />
                  </button>
                )}
                {onDeleteWorkspace && workspaces.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteWorkspace(ws);
                    }}
                    className="p-1 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    aria-label={`Delete workspace ${ws.name}`}
                  >
                    <RiDeleteBinLine size={13} />
                  </button>
                )}
              </div>
            )}
          </div>
        );

        return collapsed ? (
          <Tooltip key={ws.id} content={ws.name} side="right">
            {btn}
          </Tooltip>
        ) : btn;
      })}

      {onCreateWorkspace && (
        <Tooltip content={collapsed ? 'New workspace' : ''} side="right" disabled={!collapsed}>
          <button
            onClick={onCreateWorkspace}
            aria-label="Create new workspace"
            className={cn(
              'w-full flex items-center gap-2.5 rounded-lg px-2 py-1.5',
              'text-xs text-zinc-400 dark:text-zinc-500',
              'hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800',
              'transition-colors duration-100',
            )}
          >
            <RiAddLine size={14} className="shrink-0" />
            {!collapsed && <span>New workspace</span>}
          </button>
        </Tooltip>
      )}
    </div>
  );
});
