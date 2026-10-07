import {
  useEffect,
  useRef,
  useCallback,
  useState,
  memo,
} from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import {
  RiCloseLine,
  RiCalendarLine,
  RiTimeLine,
  RiCheckboxLine,
  RiAddLine,
  RiDeleteBinLine,
  RiChat1Line,
  RiHistoryLine,
  RiCheckLine,
  RiArrowGoBackLine,
} from 'react-icons/ri';
import { ModalPortal } from './ModalPortal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Textarea } from '@/components/common/Textarea';
import { Select } from '@/components/common/Select';
import { Badge } from '@/components/common/Badge';
import { TaskPriorityIcon } from '@/components/task/TaskPriorityIcon';
import { useTaskActivities } from '@/hooks/useTaskActivities';
import { formatRelativeTime, isOverdue } from '@/utils/dateUtils';
import { cn } from '@/utils/cn';
import { UpdateTaskSchema } from '@/schemas/task.schema';
import { v4 as uuidv4 } from 'uuid';
import type { Task, ChecklistItem, UpdateTaskInput } from '@/types/task.types';
import type { UpdateTaskFormData } from '@/schemas/task.schema';
import type { Priority } from '@/types/common.types';

// ─── Props ────────────────────────────────────────────────────────────────────

interface TaskModalProps {
  task: Task;
  onClose: () => void;
  onUpdate: (id: string, data: UpdateTaskInput) => Promise<Task> | Task | void;
  onDelete: (id: string) => void;
  onComplete: (id: string) => void;
  onReopen: (id: string) => void;
  onAddComment: (taskId: string, text: string) => void;
  onDeleteComment: (taskId: string, commentId: string) => void;
  onUpdateChecklist: (taskId: string, items: ChecklistItem[]) => void;
}

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function useFocusTrap(ref: React.RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    if (!active || !ref.current) return;
    const el = ref.current;
    const focusable = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    el.addEventListener('keydown', handleKeyDown);
    return () => el.removeEventListener('keydown', handleKeyDown);
  }, [active, ref]);
}

export const TaskModal = memo(function TaskModal({
  task,
  onClose,
  onUpdate,
  onDelete,
  onComplete,
  onReopen,
  onAddComment,
  onDeleteComment,
  onUpdateChecklist,
}: TaskModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const [newCommentText, setNewCommentText] = useState('');
  const [newChecklistText, setNewChecklistText] = useState('');
  const [isEditingDescription, setIsEditingDescription] = useState(false);

  const { activities } = useTaskActivities(task.id);

  // Store element that opened modal for focus restoration
  useEffect(() => {
    triggerRef.current = document.activeElement as HTMLElement;
    return () => {
      triggerRef.current?.focus();
    };
  }, []);

  useFocusTrap(modalRef, true);

  // Form setup via RHF + Zod
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<UpdateTaskFormData>({
    resolver: zodResolver(UpdateTaskSchema),
    defaultValues: {
      title: task.title,
      description: task.description ?? '',
      priority: task.priority,
      dueDate: task.dueDate ?? '',
      estimatedHours: task.estimatedHours ?? 0,
    },
  });

  const watchedPriority = useWatch({ control, name: 'priority' });
  const currentPriority = watchedPriority ?? task.priority;

  const isCompleted = Boolean(task.completedAt);
  const isTaskOverdue = isOverdue(task.dueDate, task.completedAt);

  // Handle Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Form submit handler
  const onSubmitForm = (data: UpdateTaskFormData) => {
    onUpdate(task.id, {
      title: data.title,
      description: data.description || undefined,
      priority: data.priority,
      dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
      estimatedHours: data.estimatedHours,
    });
  };

  // Field change handler — auto saves title, priority, due date, estimated hours
  const handleFieldBlur = () => {
    handleSubmit(onSubmitForm)();
  };

  const handlePriorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const priority = e.target.value as Priority;
    setValue('priority', priority);
    onUpdate(task.id, { priority });
  };

  // Description save
  const handleSaveDescription = () => {
    handleSubmit((data) => {
      onUpdate(task.id, { description: data.description || undefined });
      setIsEditingDescription(false);
    })();
  };

  // Checklist actions
  const handleAddChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistText.trim()) return;

    const newItem: ChecklistItem = {
      id: uuidv4(),
      text: newChecklistText.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
    };

    onUpdateChecklist(task.id, [...task.checklist, newItem]);
    setNewChecklistText('');
  };

  const handleToggleChecklist = (itemId: string) => {
    const updated = task.checklist.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item,
    );
    onUpdateChecklist(task.id, updated);
  };

  const handleDeleteChecklistItem = (itemId: string) => {
    const updated = task.checklist.filter((item) => item.id !== itemId);
    onUpdateChecklist(task.id, updated);
  };

  // Comment actions
  const handleAddCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    onAddComment(task.id, newCommentText.trim());
    setNewCommentText('');
  };

  return (
    <ModalPortal>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
        aria-hidden="true"
      >
        {/* Dialog Container */}
        <motion.div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="task-modal-title"
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', duration: 0.25 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0 bg-zinc-50/50 dark:bg-zinc-900/50">
            <div className="flex items-center gap-2">
              <Button
                variant={isCompleted ? 'secondary' : 'primary'}
                size="sm"
                onClick={() => (isCompleted ? onReopen(task.id) : onComplete(task.id))}
                leftIcon={isCompleted ? <RiArrowGoBackLine /> : <RiCheckLine />}
              >
                {isCompleted ? 'Reopen Task' : 'Complete Task'}
              </Button>

              {isCompleted && (
                <Badge variant="success" dot>
                  Completed
                </Badge>
              )}

              {isTaskOverdue && !isCompleted && (
                <Badge variant="danger" dot>
                  Overdue
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(task.id)}
                className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                aria-label="Delete task"
              >
                <RiDeleteBinLine size={16} />
              </Button>
              <button
                onClick={onClose}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                aria-label="Close task details"
              >
                <RiCloseLine size={20} />
              </button>
            </div>
          </div>

          {/* Scrollable Content Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Title Input */}
            <form onBlur={handleFieldBlur} onSubmit={handleSubmit(onSubmitForm)}>
              <Input
                id="task-modal-title"
                {...register('title')}
                error={errors.title?.message}
                className="text-lg font-bold border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 focus:border-blue-500 bg-transparent px-2 py-1 -ml-2 rounded-lg transition-colors"
              />
            </form>

            {/* Metadata Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800">
              {/* Priority */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
                  Priority
                </label>
                <div className="flex items-center gap-2">
                  <TaskPriorityIcon priority={currentPriority} size={16} />
                  <Select
                    value={currentPriority}
                    onChange={handlePriorityChange}
                    options={[
                      { value: 'low', label: 'Low' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'high', label: 'High' },
                      { value: 'urgent', label: 'Urgent' },
                    ]}
                    className="py-1 text-xs"
                  />
                </div>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
                  Due Date
                </label>
                <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                  <RiCalendarLine className="text-zinc-400" />
                  <input
                    type="date"
                    {...register('dueDate')}
                    onBlur={handleFieldBlur}
                    className="bg-transparent text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none"
                  />
                </div>
              </div>

              {/* Estimated Hours */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
                  Estimated Hours
                </label>
                <div className="flex items-center gap-1.5 text-xs">
                  <RiTimeLine className="text-zinc-400" />
                  <input
                    type="number"
                    min={0}
                    max={100}
                    {...register('estimatedHours', { valueAsNumber: true })}
                    onBlur={handleFieldBlur}
                    className="w-16 bg-transparent text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none border-b border-zinc-200 dark:border-zinc-700"
                  />
                  <span className="text-zinc-400">hrs</span>
                </div>
              </div>
            </div>

            {/* Description Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Description
                </h3>
                {!isEditingDescription && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingDescription(true)}
                    className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                  >
                    Edit
                  </Button>
                )}
              </div>

              {isEditingDescription ? (
                <div className="space-y-2">
                  <Textarea
                    {...register('description')}
                    rows={4}
                    placeholder="Add a detailed description..."
                    className="text-sm"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingDescription(false)}
                    >
                      Cancel
                    </Button>
                    <Button variant="primary" size="sm" onClick={handleSaveDescription}>
                      Save Description
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setIsEditingDescription(true)}
                  className="p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 min-h-[80px] text-sm text-zinc-700 dark:text-zinc-300 cursor-pointer transition-colors whitespace-pre-wrap"
                >
                  {task.description || (
                    <span className="text-zinc-400 dark:text-zinc-500 italic">
                      No description provided. Click to add details...
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Checklist Section */}
            <div className="space-y-3 pt-2 border-t border-zinc-200/80 dark:border-zinc-800/80">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <RiCheckboxLine size={16} /> Checklist
                </h3>
                {task.checklist.length > 0 && (
                  <span className="text-xs text-zinc-400">
                    {task.checklist.filter((i) => i.completed).length}/{task.checklist.length}{' '}
                    done
                  </span>
                )}
              </div>

              {/* Progress bar */}
              {task.checklist.length > 0 && (
                <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full transition-all duration-300"
                    style={{
                      width: `${Math.round(
                        (task.checklist.filter((i) => i.completed).length /
                          task.checklist.length) *
                          100,
                      )}%`,
                    }}
                  />
                </div>
              )}

              {/* Items */}
              <div className="space-y-1.5">
                {task.checklist.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between group p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <label className="flex items-center gap-2.5 cursor-pointer text-sm flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => handleToggleChecklist(item.id)}
                        className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <span
                        className={cn(
                          'text-zinc-700 dark:text-zinc-300 truncate',
                          item.completed && 'line-through text-zinc-400 dark:text-zinc-500',
                        )}
                      >
                        {item.text}
                      </span>
                    </label>
                    <button
                      onClick={() => handleDeleteChecklistItem(item.id)}
                      className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-rose-500 p-1 transition-opacity"
                      aria-label="Delete item"
                    >
                      <RiCloseLine size={16} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Checklist Input */}
              <form onSubmit={handleAddChecklistItem} className="flex gap-2 pt-1">
                <Input
                  value={newChecklistText}
                  onChange={(e) => setNewChecklistText(e.target.value)}
                  placeholder="Add a subtask item..."
                  className="text-xs py-1.5"
                />
                <Button type="submit" size="sm" variant="secondary" leftIcon={<RiAddLine />}>
                  Add
                </Button>
              </form>
            </div>

            {/* Comments Section */}
            <div className="space-y-3 pt-2 border-t border-zinc-200/80 dark:border-zinc-800/80">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <RiChat1Line size={16} /> Comments ({task.comments.length})
              </h3>

              {/* Add Comment Form */}
              <form onSubmit={handleAddCommentSubmit} className="space-y-2">
                <Textarea
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  rows={2}
                  className="text-xs"
                />
                <div className="flex justify-end">
                  <Button type="submit" size="sm" variant="primary" disabled={!newCommentText.trim()}>
                    Post Comment
                  </Button>
                </div>
              </form>

              {/* Comments List */}
              <div className="space-y-3 pt-2">
                {task.comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800 text-xs space-y-1 relative group"
                  >
                    <div className="flex justify-between items-center text-zinc-400">
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                        User
                      </span>
                      <span className="text-[10px]">
                        {formatRelativeTime(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                      {comment.text}
                    </p>
                    <button
                      onClick={() => onDeleteComment(task.id, comment.id)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-rose-500 p-1 transition-opacity"
                      aria-label="Delete comment"
                    >
                      <RiCloseLine size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity Stream Section */}
            <div className="space-y-3 pt-2 border-t border-zinc-200/80 dark:border-zinc-800/80">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <RiHistoryLine size={16} /> Task Activity History
              </h3>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {activities.length === 0 ? (
                  <p className="text-xs text-zinc-400 italic">No activity recorded yet.</p>
                ) : (
                  activities.map((act) => (
                    <div
                      key={act.id}
                      className="text-xs flex items-center justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800/60 last:border-0"
                    >
                      <span className="text-zinc-600 dark:text-zinc-400 capitalize">
                        {act.eventType.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        {formatRelativeTime(act.timestamp)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </ModalPortal>
  );
});
