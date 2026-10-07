import { memo } from 'react';
import { RiCalendarLine } from 'react-icons/ri';
import { formatDueDate, isOverdue, isDueSoon } from '@/utils/dateUtils';
import { cn } from '@/utils/cn';

interface TaskDueDateProps {
  dueDate: string | null;
  completedAt: string | null;
  className?: string;
}

export const TaskDueDate = memo(function TaskDueDate({
  dueDate,
  completedAt,
  className,
}: TaskDueDateProps) {
  const label = formatDueDate(dueDate);
  if (!label) return null;

  const overdue = isOverdue(dueDate, completedAt);
  const soon = !overdue && isDueSoon(dueDate);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs rounded-full px-1.5 py-0.5 font-medium',
        overdue
          ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
          : soon
            ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
            : 'text-zinc-400 dark:text-zinc-500',
        className,
      )}
      aria-label={`Due ${label}${overdue ? ' (overdue)' : ''}`}
    >
      <RiCalendarLine size={11} aria-hidden="true" />
      {label}
    </span>
  );
});
