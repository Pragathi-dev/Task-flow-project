import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { MobileDrawer } from '@/components/navigation/MobileDrawer';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { WorkspaceModal } from '@/components/modals/WorkspaceModal';
import { BoardModal } from '@/components/modals/BoardModal';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useBoardStore } from '@/store/boardStore';
import { useTaskStore } from '@/store/taskStore';
import type { Workspace } from '@/types/workspace.types';
import type { Board } from '@/types/board.types';

export function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();

  // Store selectors
  const loadWorkspaces = useWorkspaceStore((s) => s.loadWorkspaces);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const setActiveWorkspace = useWorkspaceStore((s) => s.setActiveWorkspace);
  const createWorkspace = useWorkspaceStore((s) => s.createWorkspace);
  const updateWorkspace = useWorkspaceStore((s) => s.updateWorkspace);
  const deleteWorkspace = useWorkspaceStore((s) => s.deleteWorkspace);

  const loadBoards = useBoardStore((s) => s.loadBoards);
  const boards = useBoardStore((s) => s.boards);
  const createBoard = useBoardStore((s) => s.createBoard);
  const updateBoard = useBoardStore((s) => s.updateBoard);
  const deleteBoard = useBoardStore((s) => s.deleteBoard);
  const setActiveBoard = useBoardStore((s) => s.setActiveBoard);

  const loadAllTasks = useTaskStore((s) => s.loadAllTasks);

  // Modal State
  const [workspaceModalOpen, setWorkspaceModalOpen] = useState(false);
  const [workspaceToEdit, setWorkspaceToEdit] = useState<Workspace | null>(null);
  const [workspaceToDelete, setWorkspaceToDelete] = useState<Workspace | null>(null);

  const [boardModalOpen, setBoardModalOpen] = useState(false);
  const [boardToEdit, setBoardToEdit] = useState<Board | null>(null);
  const [boardToDelete, setBoardToDelete] = useState<Board | null>(null);

  // 1. Hydrate workspaces once on mount
  useEffect(() => {
    void loadWorkspaces();
  }, [loadWorkspaces]);

  // 2. When active workspace changes, load its boards
  useEffect(() => {
    if (activeWorkspaceId) {
      void loadBoards(activeWorkspaceId);
    }
  }, [activeWorkspaceId, loadBoards]);

  // 3. Load all tasks into the global in-memory index once
  useEffect(() => {
    void loadAllTasks();
  }, [loadAllTasks]);

  // ── Workspace CRUD Handlers ──────────────────────────────────────────────────
  const handleCreateWorkspace = () => {
    setWorkspaceToEdit(null);
    setWorkspaceModalOpen(true);
  };

  const handleEditWorkspace = (workspace: Workspace) => {
    setWorkspaceToEdit(workspace);
    setWorkspaceModalOpen(true);
  };

  const handleDeleteWorkspacePrompt = (workspace: Workspace) => {
    setWorkspaceToDelete(workspace);
  };

  const handleWorkspaceSubmit = async (data: { name: string; color: string; icon?: string }) => {
    if (workspaceToEdit) {
      await updateWorkspace(workspaceToEdit.id, data);
    } else {
      const newWs = await createWorkspace(data);
      const starterBoard = await createBoard({
        name: 'General',
        workspaceId: newWs.id,
        color: '#3b82f6',
      });
      setActiveWorkspace(newWs.id);
      setActiveBoard(newWs.id, starterBoard.id);
      navigate(`/board/${starterBoard.id}`);
    }
    setWorkspaceModalOpen(false);
    setWorkspaceToEdit(null);
  };

  const handleConfirmWorkspaceDelete = async () => {
    if (!workspaceToDelete) return;
    const deletedId = workspaceToDelete.id;
    await deleteWorkspace(deletedId);
    setWorkspaceToDelete(null);

    const remaining = useWorkspaceStore.getState().workspaces;
    if (remaining.length > 0) {
      const nextWs = remaining[0];
      setActiveWorkspace(nextWs.id);
      await loadBoards(nextWs.id);
      const remainingBoards = useBoardStore.getState().boards;
      if (remainingBoards.length > 0) {
        navigate(`/board/${remainingBoards[0].id}`);
      } else {
        navigate('/');
      }
    } else {
      navigate('/');
    }
  };

  // ── Board CRUD Handlers ──────────────────────────────────────────────────────
  const handleCreateBoard = () => {
    if (!activeWorkspaceId) return;
    setBoardToEdit(null);
    setBoardModalOpen(true);
  };

  const handleEditBoard = (board: Board) => {
    setBoardToEdit(board);
    setBoardModalOpen(true);
  };

  const handleDeleteBoardPrompt = (board: Board) => {
    setBoardToDelete(board);
  };

  const handleBoardSubmit = async (data: { name: string; color?: string; icon?: string }) => {
    if (!activeWorkspaceId) return;

    if (boardToEdit) {
      await updateBoard(boardToEdit.id, data);
    } else {
      const newBoard = await createBoard({
        name: data.name,
        workspaceId: activeWorkspaceId,
        color: data.color,
        icon: data.icon,
      });
      setActiveBoard(activeWorkspaceId, newBoard.id);
      navigate(`/board/${newBoard.id}`);
    }
    setBoardModalOpen(false);
    setBoardToEdit(null);
  };

  const handleConfirmBoardDelete = async () => {
    if (!boardToDelete || !activeWorkspaceId) return;
    const deletedId = boardToDelete.id;
    await deleteBoard(deletedId);
    setBoardToDelete(null);

    const remaining = boards.filter((b) => b.id !== deletedId);
    if (remaining.length > 0) {
      setActiveBoard(activeWorkspaceId, remaining[0].id);
      navigate(`/board/${remaining[0].id}`);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-medium"
      >
        Skip to main content
      </a>

      <Sidebar
        onCreateWorkspace={handleCreateWorkspace}
        onEditWorkspace={handleEditWorkspace}
        onDeleteWorkspace={handleDeleteWorkspacePrompt}
        onCreateBoard={handleCreateBoard}
        onEditBoard={handleEditBoard}
        onDeleteBoard={handleDeleteBoardPrompt}
      />

      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onCreateWorkspace={handleCreateWorkspace}
        onEditWorkspace={handleEditWorkspace}
        onDeleteWorkspace={handleDeleteWorkspacePrompt}
        onCreateBoard={handleCreateBoard}
        onEditBoard={handleEditBoard}
        onDeleteBoard={handleDeleteBoardPrompt}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar onMenuClick={() => setDrawerOpen(true)} />

        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 overflow-auto focus:outline-none"
        >
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>

      <WorkspaceModal
        open={workspaceModalOpen}
        workspace={workspaceToEdit}
        onClose={() => {
          setWorkspaceModalOpen(false);
          setWorkspaceToEdit(null);
        }}
        onSubmit={handleWorkspaceSubmit}
      />

      <BoardModal
        open={boardModalOpen}
        board={boardToEdit}
        workspaceId={activeWorkspaceId ?? ''}
        onClose={() => {
          setBoardModalOpen(false);
          setBoardToEdit(null);
        }}
        onSubmit={handleBoardSubmit}
      />

      <ConfirmDialog
        open={Boolean(workspaceToDelete)}
        title={`Delete Workspace "${workspaceToDelete?.name ?? ''}"?`}
        description="Are you sure you want to delete this workspace? This will permanently remove all associated boards, columns, tasks, and audit logs."
        confirmLabel="Delete Workspace"
        variant="danger"
        onConfirm={handleConfirmWorkspaceDelete}
        onCancel={() => setWorkspaceToDelete(null)}
      />

      <ConfirmDialog
        open={Boolean(boardToDelete)}
        title={`Delete Board "${boardToDelete?.name ?? ''}"?`}
        description="Are you sure you want to delete this board? All columns and tasks inside this board will be permanently deleted."
        confirmLabel="Delete Board"
        variant="danger"
        onConfirm={handleConfirmBoardDelete}
        onCancel={() => setBoardToDelete(null)}
      />
    </div>
  );
}
