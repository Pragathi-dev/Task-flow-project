import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { RiAddLine, RiKanbanView2, RiEditLine, RiDeleteBinLine } from 'react-icons/ri';
import { useBoard } from '@/hooks/useBoard';
import { useWorkspace } from '@/hooks/useWorkspace';
import { Tooltip } from '@/components/common/Tooltip';
import { cn } from '@/utils/cn';
import type { Board } from '@/types/board.types';

interface NavBoardListProps {
  collapsed?: boolean;
  onCreateBoard?: () => void;
  onEditBoard?: (board: Board) => void;
  onDeleteBoard?: (board: Board) => void;
}

export const NavBoardList = memo(function NavBoardList({
  collapsed = false,
  onCreateBoard,
  onEditBoard,
  onDeleteBoard,
}: NavBoardListProps) {
  const { boards, activeBoardId, setActiveBoard } = useBoard();
  const { activeWorkspaceId } = useWorkspace();
  const navigate = useNavigate();

  const handleSelect = (boardId: string) => {
    if (activeWorkspaceId) setActiveBoard(activeWorkspaceId, boardId);
    navigate(`/board/${boardId}`);
  };

  if (boards.length === 0 && !onCreateBoard) return null;

  return (
    <div className="px-2 space-y-0.5">
      {!collapsed && (
        <p className="px-2 text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
          Boards
        </p>
      )}
      {boards.map((board) => {
        const isActive = board.id === activeBoardId;
        const btn = (
          <div
            key={board.id}
            className={cn(
              'group relative w-full flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors duration-100',
              isActive
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100',
            )}
          >
            <button
              onClick={() => handleSelect(board.id)}
              aria-current={isActive ? 'page' : undefined}
              aria-label={collapsed ? board.name : undefined}
              className="flex-1 flex items-center gap-2.5 min-w-0 text-left"
            >
              {board.color ? (
                <span
                  className="h-4 w-4 rounded shrink-0 flex items-center justify-center text-white text-[10px]"
                  style={{ backgroundColor: board.color }}
                  aria-hidden="true"
                >
                  {board.icon ?? <RiKanbanView2 size={10} />}
                </span>
              ) : (
                <RiKanbanView2 size={14} className="shrink-0 text-zinc-400" aria-hidden="true" />
              )}
              {!collapsed && <span className="truncate text-sm font-medium">{board.name}</span>}
            </button>

            {!collapsed && (onEditBoard || onDeleteBoard) && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                {onEditBoard && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditBoard(board);
                    }}
                    className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-md hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60"
                    aria-label={`Edit board ${board.name}`}
                  >
                    <RiEditLine size={13} />
                  </button>
                )}
                {onDeleteBoard && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteBoard(board);
                    }}
                    className="p-1 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    aria-label={`Delete board ${board.name}`}
                  >
                    <RiDeleteBinLine size={13} />
                  </button>
                )}
              </div>
            )}
          </div>
        );

        return collapsed ? (
          <Tooltip key={board.id} content={board.name} side="right">
            {btn}
          </Tooltip>
        ) : btn;
      })}

      {onCreateBoard && (
        <Tooltip content={collapsed ? 'New board' : ''} side="right" disabled={!collapsed}>
          <button
            onClick={onCreateBoard}
            aria-label="Create new board"
            className={cn(
              'w-full flex items-center gap-2.5 rounded-lg px-2 py-1.5',
              'text-xs text-zinc-400 dark:text-zinc-500',
              'hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800',
              'transition-colors duration-100',
            )}
          >
            <RiAddLine size={14} className="shrink-0" />
            {!collapsed && <span>New board</span>}
          </button>
        </Tooltip>
      )}
    </div>
  );
});
