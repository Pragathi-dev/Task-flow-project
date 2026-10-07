import { memo } from 'react';
import { RiCheckboxLine } from 'react-icons/ri';
import { cn } from '@/utils/cn';
import type { ChecklistItem } from '@/types/task.types';

interface TaskProgressProps {
  checklist: ChecklistItem[];
  className?: string;
}

export const TaskProgress = memo(function TaskProgress({
  checklist,
  className,
}: TaskProgressProps) {
  if (checklist.length === 0) return null;

  const done = checklist.filter((i) => i.completed).length;
  const total = checklist.length;
  const pct = Math.round((done / total) * 100);
  const complete = done === total;

  return (
    <div
      className={cn('flex items-center gap-1.5', className)}
      aria-label={`Checklist: ${done} of ${total} complete`}
    >
      <RiCheckboxLine
        size={12}
        className={complete ? 'text-green-500' : 'text-zinc-400'}
        aria-hidden="true"
      />
      <span
        className={cn(
          'text-xs font-medium',
          complete ? 'text-green-600 dark:text-green-400' : 'text-zinc-400 dark:text-zinc-500',
        )}
      >
        {done}/{total}
      </span>
      {/* Thin progress bar */}
      <div
        className="flex-1 h-1 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden"
        role="meter"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300',
            complete ? 'bg-green-500' : 'bg-blue-500',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
});
