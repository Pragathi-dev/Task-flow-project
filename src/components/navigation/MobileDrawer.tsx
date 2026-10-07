import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RiCloseLine } from 'react-icons/ri';
import { NavWorkspaceList } from './NavWorkspaceList';
import { NavBoardList } from './NavBoardList';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { ModalPortal } from '@/components/modals/ModalPortal';
import { cn } from '@/utils/cn';
import type { Workspace } from '@/types/workspace.types';
import type { Board } from '@/types/board.types';

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  onCreateWorkspace?: () => void;
  onEditWorkspace?: (workspace: Workspace) => void;
  onDeleteWorkspace?: (workspace: Workspace) => void;
  onCreateBoard?: () => void;
  onEditBoard?: (board: Board) => void;
  onDeleteBoard?: (board: Board) => void;
}

export function MobileDrawer({
  open,
  onClose,
  onCreateWorkspace,
  onEditWorkspace,
  onDeleteWorkspace,
  onCreateBoard,
  onEditBoard,
  onDeleteBoard,
}: MobileDrawerProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => closeRef.current?.focus(), 30);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <ModalPortal>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            aria-hidden="true"
            onClick={onClose}
          />
          {/* Drawer */}
          <motion.nav
            role="navigation"
            aria-label="Mobile navigation"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={cn(
              'fixed inset-y-0 left-0 z-50 w-72',
              'flex flex-col',
              'bg-white dark:bg-zinc-900',
              'border-r border-zinc-200 dark:border-zinc-800',
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 h-14 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
              <span className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                TaskFlow
              </span>
              <button
                ref={closeRef}
                onClick={onClose}
                aria-label="Close navigation"
                className="h-8 w-8 flex items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <RiCloseLine size={18} />
              </button>
            </div>

            {/* Nav content */}
            <div className="flex-1 overflow-y-auto py-4 space-y-6">
              <NavWorkspaceList
                onCreateWorkspace={onCreateWorkspace}
                onEditWorkspace={onEditWorkspace}
                onDeleteWorkspace={onDeleteWorkspace}
              />
              <NavBoardList
                onCreateBoard={onCreateBoard}
                onEditBoard={onEditBoard}
                onDeleteBoard={onDeleteBoard}
              />
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <span className="text-xs text-zinc-400 dark:text-zinc-500">v1.0</span>
              <ThemeToggle />
            </div>
          </motion.nav>
        </ModalPortal>
      )}
    </AnimatePresence>
  );
}
