/**
 * BoardPage — the Kanban board route.
 *
 * Route: /board/:boardId
 *
 * Responsibilities:
 *  - Sync the URL boardId with the active board in boardStore
 *  - Orchestrate useTasks + useBoard into BoardView
 *  - Handle task CRUD, column CRUD, and confirm dialogs
 *  - Open the selected task modal (TaskModal — Phase 5)
 */
import { useEffect, useCallback, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { BoardView } from '@/components/board/BoardView';
import { BoardHeader } from '@/components/board/BoardHeader';
import { BoardToolbar } from '@/components/board/BoardToolbar';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { TaskModal } from '@/components/modals/TaskModal';
import { Skeleton } from '@/components/common/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { useTasks } from '@/hooks/useTasks';
import { useBoard } from '@/hooks/useBoard';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useBoardStore } from '@/store/boardStore';
import { useTaskStore } from '@/store/taskStore';
import { RiKanbanView2 } from 'react-icons/ri';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { boardService } from '@/services/BoardService';
import type { CreateTaskInput } from '@/types/task.types';

// ─── Confirm Dialog State ─────────────────────────────────────────────────────

interface ConfirmState {
  open: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
}

const CLOSED_CONFIRM: ConfirmState = {
  open: false,
  title: '',
  description: '',
  onConfirm: () => {},
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();

  const {
    activeBoard,
    activeBoardColumns,
    isLoading: boardLoading,
    setActiveBoard,
    updateBoard,
    deleteBoard,
    createColumn,
    updateColumn,
    deleteColumn,
  } = useBoard();

  const { activeWorkspaceId } = useWorkspace();
  const setActiveWorkspace = useWorkspaceStore((s) => s.setActiveWorkspace);

  const loadBoards = useBoardStore((s) => s.loadBoards);
  const activeBoardId = useBoardStore((s) => s.activeBoardId);
  const boards = useBoardStore((s) => s.boards);

  // Sync URL param → active board & workspace alignment
  useEffect(() => {
    if (!boardId) return;

    // Check if boardId belongs to current active workspace's loaded boards
    const belongsToCurrentWorkspace = boards.some((b) => b.id === boardId);

    if (belongsToCurrentWorkspace) {
      if (boardId !== activeBoardId && activeWorkspaceId) {
        setActiveBoard(activeWorkspaceId, boardId);
      }
      return;
    }

    // If boards are loading, wait until loaded
    if (boardLoading) return;

    // If boardId is not in current workspace's loaded boards, check if board exists in storage
    boardService.getById(boardId).then((targetBoard) => {
      if (targetBoard) {
        // Board exists under another workspace (e.g. direct URL visit or browser refresh)
        if (targetBoard.workspaceId !== activeWorkspaceId) {
          setActiveWorkspace(targetBoard.workspaceId);
          void loadBoards(targetBoard.workspaceId);
          setActiveBoard(targetBoard.workspaceId, boardId);
        }
      } else {
        // Board does not exist at all or workspace was switched away from stale URL
        if (activeBoardId) {
          navigate(`/board/${activeBoardId}`, { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      }
    });
  }, [
    boardId,
    activeBoardId,
    activeWorkspaceId,
    boards,
    boardLoading,
    setActiveBoard,
    setActiveWorkspace,
    loadBoards,
    navigate,
  ]);

  // ── Task hook ──────────────────────────────────────────────────────────────
  const effectiveBoardId = boardId ?? activeBoardId ?? '';
  const {
    tasksByColumnId,
    selectedTask,
    filters,
    sortBy,
    setFilters,
    setSortBy,
    clearFilters,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    reopenTask,
    addComment,
    deleteComment,
    updateChecklist,
    setSelectedTask,
    handleDragEnd,
  } = useTasks(effectiveBoardId);

  // Track the element that triggered a task open so focus can be restored
  const triggerRef = useRef<HTMLElement | null>(null);
  const setSelectedTaskStore = useTaskStore((s) => s.setSelectedTask);

  // ── Confirm dialog ─────────────────────────────────────────────────────────
  const [confirm, setConfirm] = useState<ConfirmState>(CLOSED_CONFIRM);

  const closeConfirm = useCallback(() => setConfirm(CLOSED_CONFIRM), []);

  // ── Board actions ──────────────────────────────────────────────────────────
  const handleRenameBoard = useCallback(
    (name: string) => {
      if (!activeBoard) return;
      updateBoard(activeBoard.id, { name });
    },
    [activeBoard, updateBoard],
  );

  const handleDeleteBoard = useCallback(() => {
    if (!activeBoard) return;
    setConfirm({
      open: true,
      title: `Delete "${activeBoard.name}"?`,
      description:
        'This will permanently delete the board and all its columns and tasks. This cannot be undone.',
      onConfirm: () => {
        deleteBoard(activeBoard.id);
        closeConfirm();
        navigate('/');
      },
    });
  }, [activeBoard, deleteBoard, closeConfirm, navigate]);

  // ── Column actions ─────────────────────────────────────────────────────────
  const handleAddColumn = useCallback(
    (name: string) => {
      if (!effectiveBoardId) return;
      createColumn({ name, boardId: effectiveBoardId });
    },
    [createColumn, effectiveBoardId],
  );

  const handleRenameColumn = useCallback(
    (columnId: string, name: string) => {
      updateColumn(columnId, { name });
    },
    [updateColumn],
  );

  const handleDeleteColumn = useCallback(
    (columnId: string) => {
      const col = activeBoardColumns.find((c) => c.id === columnId);
      const taskCount = (tasksByColumnId[columnId] ?? []).length;
      setConfirm({
        open: true,
        title: `Delete column "${col?.name ?? ''}"?`,
        description:
          taskCount > 0
            ? `This will permanently delete the column and its ${taskCount} task${taskCount !== 1 ? 's' : ''}. This cannot be undone.`
            : 'The column will be permanently deleted.',
        onConfirm: () => {
          deleteColumn(columnId);
          closeConfirm();
        },
      });
    },
    [activeBoardColumns, tasksByColumnId, deleteColumn, closeConfirm],
  );

  // ── Task actions ───────────────────────────────────────────────────────────
  const handleAddTask = useCallback(
    (columnId: string, title: string) => {
      if (!effectiveBoardId || !activeWorkspaceId) return;
      const input: CreateTaskInput = {
        title,
        columnId,
        boardId: effectiveBoardId,
        workspaceId: activeWorkspaceId,
      };
      createTask(input);
    },
    [createTask, effectiveBoardId, activeWorkspaceId],
  );

  const handleOpenTask = useCallback(
    (taskId: string) => {
      // Store trigger element for focus restoration when modal closes
      triggerRef.current = document.activeElement as HTMLElement;
      setSelectedTask(taskId);
    },
    [setSelectedTask],
  );

  const handleDeleteTask = useCallback(
    (taskId: string) => {
      setConfirm({
        open: true,
        title: 'Delete task?',
        description: 'This task will be permanently deleted. This cannot be undone.',
        onConfirm: () => {
          deleteTask(taskId);
          closeConfirm();
        },
      });
    },
    [deleteTask, closeConfirm],
  );

  // ── Close task modal ───────────────────────────────────────────────────────
  const handleCloseTask = useCallback(() => {
    setSelectedTaskStore(null);
    setTimeout(() => (triggerRef.current as HTMLElement | null)?.focus(), 50);
  }, [setSelectedTaskStore]);

  // ── Loading state ──────────────────────────────────────────────────────────
  if (boardLoading) {
    return (
      <div className="flex gap-4 px-6 py-5 overflow-x-auto">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex-shrink-0 w-72 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 p-3 space-y-2"
          >
            <Skeleton height={16} className="w-28 mb-3" />
            {[1, 2].map((j) => (
              <div key={j} className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 space-y-2">
                <Skeleton height={14} className="w-full" />
                <Skeleton height={12} className="w-2/3" />
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  // Board not found
  if (!activeBoard && !boardLoading) {
    return (
      <EmptyState
        icon={<RiKanbanView2 />}
        title="Board not found"
        description="This board may have been deleted. Select a board from the sidebar."
        className="min-h-full"
      />
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full min-h-0">
      {activeBoard && (
        <BoardHeader
          board={activeBoard}
          onRename={handleRenameBoard}
          onDelete={handleDeleteBoard}
        />
      )}

      <BoardToolbar
        filters={filters}
        sortBy={sortBy}
        onSetFilters={setFilters}
        onSetSortBy={setSortBy}
        onClearFilters={clearFilters}
      />

      <div className="flex-1 min-h-0 overflow-hidden">
        <BoardView
          columns={activeBoardColumns}
          tasksByColumnId={tasksByColumnId}
          workspaceId={activeWorkspaceId ?? ''}
          boardId={effectiveBoardId}
          onDragEnd={handleDragEnd}
          onAddTask={handleAddTask}
          onOpenTask={handleOpenTask}
          onDeleteTask={handleDeleteTask}
          onAddColumn={handleAddColumn}
          onRenameColumn={handleRenameColumn}
          onDeleteColumn={handleDeleteColumn}
        />
      </div>

      <ConfirmDialog
        open={confirm.open}
        title={confirm.title}
        description={confirm.description}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={confirm.onConfirm}
        onCancel={closeConfirm}
      />

      <AnimatePresence>
        {selectedTask && (
          <TaskModal
            task={selectedTask}
            onClose={handleCloseTask}
            onUpdate={(id, data) => void updateTask(id, data)}
            onDelete={(id) => {
              handleCloseTask();
              void deleteTask(id);
            }}
            onComplete={(id) => void completeTask(id)}
            onReopen={(id) => void reopenTask(id)}
            onAddComment={(id, text) => void addComment(id, text)}
            onDeleteComment={(id, cId) => void deleteComment(id, cId)}
            onUpdateChecklist={(id, items) => void updateChecklist(id, items)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
