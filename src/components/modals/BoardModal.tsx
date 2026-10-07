/**
 * BoardModal.tsx — Accessible modal dialog for creating or editing a board within a workspace.
 *
 * Single Responsibility: Manage form state and validate against CreateBoardSchema.
 */
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RiCloseLine, RiCheckLine } from 'react-icons/ri';
import { ModalPortal } from './ModalPortal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { CreateBoardSchema } from '@/schemas/board.schema';
import type { Board } from '@/types/board.types';

export interface BoardModalProps {
  open: boolean;
  board?: Board | null;
  workspaceId: string;
  onClose: () => void;
  onSubmit: (data: { name: string; color?: string; icon?: string }) => void;
  isLoading?: boolean;
}

const BOARD_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#6366f1', // Indigo
];

export function BoardModal({
  open,
  board,
  workspaceId,
  onClose,
  onSubmit,
  isLoading = false,
}: BoardModalProps) {
  const isEditing = Boolean(board);
  const [prevBoard, setPrevBoard] = useState(board);
  const [prevOpen, setPrevOpen] = useState(open);

  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(BOARD_COLORS[0]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const nameInputRef = useRef<HTMLInputElement>(null);

  if (open !== prevOpen || board !== prevBoard) {
    setPrevOpen(open);
    setPrevBoard(board);
    if (open) {
      if (board) {
        setName(board.name);
        setColor(board.color ?? BOARD_COLORS[0]);
      } else {
        setName('');
        setColor(BOARD_COLORS[0]);
      }
      setErrors({});
    }
  }

  useEffect(() => {
    if (open) {
      setTimeout(() => nameInputRef.current?.focus(), 50);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = CreateBoardSchema.safeParse({
      name,
      workspaceId,
      color,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        if (issue.path[0]) {
          fieldErrors[issue.path[0].toString()] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    onSubmit({
      name: result.data.name,
      color: result.data.color,
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <ModalPortal>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="board-modal-title"
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-modal space-y-6"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <h2
                id="board-modal-title"
                className="text-lg font-bold text-zinc-900 dark:text-zinc-100"
              >
                {isEditing ? 'Edit Board' : 'Create New Board'}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                aria-label="Close modal"
              >
                <RiCloseLine size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Board Name Input */}
              <Input
                ref={nameInputRef}
                label="Board Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Q3 Roadmap, Sprint Backlog, Bug Tracker"
                error={errors.name}
                required
              />

              {/* Accent Color Picker */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Board Accent Color
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {BOARD_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      style={{ backgroundColor: c }}
                      className="h-7 w-7 rounded-full flex items-center justify-center transition-transform hover:scale-110 focus:outline-hidden"
                      aria-label={`Select color ${c}`}
                    >
                      {color === c && <RiCheckLine size={14} className="text-white drop-shadow-xs" />}
                    </button>
                  ))}
                </div>
                {errors.color && (
                  <p className="text-xs text-rose-500 font-medium">{errors.color}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
                  {isEditing ? 'Save Changes' : 'Create Board'}
                </Button>
              </div>
            </form>
          </motion.div>
        </ModalPortal>
      )}
    </AnimatePresence>
  );
}
