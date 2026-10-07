/**
 * WorkspaceModal.tsx — Accessible modal dialog for creating or editing a workspace.
 *
 * Single Responsibility: Form state management, validation against CreateWorkspaceSchema,
 * and presenting color/icon selection UI.
 */
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RiCloseLine, RiCheckLine } from 'react-icons/ri';
import { ModalPortal } from './ModalPortal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { WORKSPACE_COLORS } from '@/config/constants';
import { CreateWorkspaceSchema } from '@/schemas/workspace.schema';
import { cn } from '@/utils/cn';
import type { Workspace } from '@/types/workspace.types';

export interface WorkspaceModalProps {
  open: boolean;
  workspace?: Workspace | null;
  onClose: () => void;
  onSubmit: (data: { name: string; color: string; icon?: string }) => void;
  isLoading?: boolean;
}

const EMOJI_OPTIONS = ['🚀', '💼', '⚡', '🎯', '🔥', '🎨', '🌟', '📊', '💻', '🛠️'];

export function WorkspaceModal({
  open,
  workspace,
  onClose,
  onSubmit,
  isLoading = false,
}: WorkspaceModalProps) {
  const isEditing = Boolean(workspace);
  const [prevOpen, setPrevOpen] = useState(open);
  const [prevWorkspaceId, setPrevWorkspaceId] = useState<string | null>(workspace?.id ?? null);

  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(WORKSPACE_COLORS[0]);
  const [icon, setIcon] = useState<string>('🚀');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const nameInputRef = useRef<HTMLInputElement>(null);

  const currentWorkspaceId = workspace?.id ?? null;
  if (open !== prevOpen || (open && currentWorkspaceId !== prevWorkspaceId)) {
    setPrevOpen(open);
    setPrevWorkspaceId(currentWorkspaceId);
    if (open) {
      if (workspace) {
        setName(workspace.name);
        setColor(workspace.color);
        setIcon(workspace.icon ?? '🚀');
      } else {
        setName('');
        setColor(WORKSPACE_COLORS[0]);
        setIcon('🚀');
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
    const result = CreateWorkspaceSchema.safeParse({ name, color, icon });

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
      icon: result.data.icon,
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
            aria-labelledby="workspace-modal-title"
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-modal space-y-6"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <h2
                id="workspace-modal-title"
                className="text-lg font-bold text-zinc-900 dark:text-zinc-100"
              >
                {isEditing ? 'Edit Workspace' : 'Create New Workspace'}
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
              {/* Workspace Name Input */}
              <Input
                ref={nameInputRef}
                label="Workspace Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Acme Corp, Engineering, Personal"
                error={errors.name}
                required
              />

              {/* Icon / Emoji Picker */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Workspace Icon
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {EMOJI_OPTIONS.map((e) => {
                    const isSelected = icon === e;
                    return (
                      <button
                        key={e}
                        type="button"
                        onClick={() => setIcon(e)}
                        aria-pressed={isSelected}
                        className={cn(
                          'relative h-10 w-10 flex items-center justify-center rounded-xl text-lg transition-all duration-150 cursor-pointer',
                          isSelected
                            ? 'bg-blue-100 dark:bg-blue-900/50 border-2 border-blue-600 dark:border-blue-400 ring-2 ring-blue-500/20 dark:ring-blue-400/30 scale-105 shadow-xs'
                            : 'bg-zinc-100 dark:bg-zinc-800 border-2 border-transparent hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400',
                        )}
                      >
                        <span>{e}</span>
                        {isSelected && (
                          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                            <RiCheckLine size={12} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {errors.icon && (
                  <p className="text-xs text-rose-500 font-medium">{errors.icon}</p>
                )}
              </div>

              {/* Accent Color Picker */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Accent Color
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {WORKSPACE_COLORS.map((c) => (
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
                  {isEditing ? 'Save Changes' : 'Create Workspace'}
                </Button>
              </div>
            </form>
          </motion.div>
        </ModalPortal>
      )}
    </AnimatePresence>
  );
}
