import { memo, useCallback } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { RiMoreLine, RiDeleteBinLine, RiChat1Line } from 'react-icons/ri';
import { TaskPriorityIcon } from './TaskPriorityIcon';
import { TaskDueDate } from './TaskDueDate';
import { TaskProgress } from './TaskProgress';
import { Badge } from '@/components/common/Badge';
import { cn } from '@/utils/cn';
import type { Task } from '@/types/task.types';

interface TaskCardProps {
  task: Task;
  index: number;
  columnName?: string;
  onOpen: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}

export const TaskCard = memo(function TaskCard({
  task,
  index,
  onOpen,
  onDelete,
}: TaskCardProps) {
  const handleOpen = useCallback(() => onOpen(task.id), [onOpen, task.id]);
  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete(task.id);
    },
    [onDelete, task.id],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleOpen();
      }
    },
    [handleOpen],
  );

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={provided.draggableProps.style}
          className={cn(
            'group relative rounded-xl border bg-white dark:bg-zinc-900',
            'border-zinc-200 dark:border-zinc-800',
            'p-3 cursor-grab active:cursor-grabbing select-none',
            'transition-shadow duration-150',
            snapshot.isDragging
              ? 'shadow-modal rotate-1 ring-2 ring-blue-500 opacity-90'
              : 'shadow-card hover:shadow-card-hover',
          )}
          onClick={handleOpen}
          onKeyDown={handleKeyDown}
          role="button"
          tabIndex={0}
          aria-label={`Open task: ${task.title}`}
        >
          {/* Visual drag indicator icon */}
          <div
            aria-hidden="true"
            className="absolute top-2.5 right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-100 p-0.5 rounded text-zinc-300 dark:text-zinc-600 hover:text-zinc-500 dark:hover:text-zinc-400"
          >
            <RiMoreLine size={14} />
          </div>

          {/* Delete button */}
          <button
            onClick={handleDelete}
            aria-label={`Delete task: ${task.title}`}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-100 p-1 rounded text-zinc-300 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400"
          >
            <RiDeleteBinLine size={12} />
          </button>

          {/* Title */}
          <p
            className={cn(
              'text-sm font-medium text-zinc-900 dark:text-zinc-100 leading-snug pr-6',
              task.completedAt && 'line-through text-zinc-400 dark:text-zinc-500',
            )}
          >
            {task.title}
          </p>

          {/* Labels */}
          {task.labels.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {task.labels.slice(0, 3).map((label) => (
                <Badge key={label} variant="primary" size="sm">
                  {label}
                </Badge>
              ))}
              {task.labels.length > 3 && (
                <Badge variant="default" size="sm">+{task.labels.length - 3}</Badge>
              )}
            </div>
          )}

          {/* Checklist progress */}
          {task.checklist.length > 0 && (
            <TaskProgress checklist={task.checklist} className="mt-2" />
          )}

          {/* Footer row */}
          <div className="flex items-center gap-2 mt-2.5 flex-wrap">
            <TaskPriorityIcon priority={task.priority} size={13} />

            <TaskDueDate dueDate={task.dueDate} completedAt={task.completedAt} />

            {(task.estimatedHours ?? 0) > 0 && (
              <span className="text-xs text-zinc-400 dark:text-zinc-500">
                {task.estimatedHours}h
              </span>
            )}

            {task.comments.length > 0 && (
              <span className="ml-auto flex items-center gap-0.5 text-xs text-zinc-400 dark:text-zinc-500">
                <RiChat1Line size={11} aria-hidden="true" />
                {task.comments.length}
              </span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
});
