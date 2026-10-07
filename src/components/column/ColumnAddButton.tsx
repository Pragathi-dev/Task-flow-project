import { useState, useRef, useEffect } from 'react';
import { RiAddLine } from 'react-icons/ri';
import { Button } from '@/components/common/Button';
import { cn } from '@/utils/cn';

interface ColumnAddButtonProps {
  /** 'task' = inline add at bottom of column, 'column' = add new column */
  mode: 'task' | 'column';
  onAdd: (name: string) => void;
  placeholder?: string;
  className?: string;
}

export function ColumnAddButton({
  mode,
  onAdd,
  placeholder,
  className,
}: ColumnAddButtonProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const commit = () => {
    const trimmed = value.trim();
    if (trimmed) { onAdd(trimmed); }
    setValue('');
    setOpen(false);
  };

  const cancel = () => { setValue(''); setOpen(false); };

  if (open) {
    return (
      <div className={cn('px-2 pb-2', className)}>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') cancel();
          }}
          onBlur={cancel}
          placeholder={placeholder ?? (mode === 'task' ? 'Task title…' : 'Column name…')}
          aria-label={mode === 'task' ? 'New task title' : 'New column name'}
          className={cn(
            'w-full text-sm rounded-lg border px-3 py-2',
            'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100',
            'border-zinc-200 dark:border-zinc-700 placeholder:text-zinc-400',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            'mb-2',
          )}
        />
        <div className="flex gap-1.5">
          <Button
            size="xs"
            variant="primary"
            onMouseDown={(e) => { e.preventDefault(); commit(); }}
          >
            Add
          </Button>
          <Button
            size="xs"
            variant="ghost"
            onMouseDown={(e) => { e.preventDefault(); cancel(); }}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  if (mode === 'task') {
    return (
      <button
        onClick={() => setOpen(true)}
        className={cn(
          'w-full flex items-center gap-1.5 px-3 py-2 rounded-lg',
          'text-xs text-zinc-400 dark:text-zinc-500',
          'hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800',
          'transition-colors duration-100',
          className,
        )}
        aria-label="Add task"
      >
        <RiAddLine size={13} />
        Add task
      </button>
    );
  }

  // Column mode — wider card style
  return (
    <button
      onClick={() => setOpen(true)}
      className={cn(
        'flex-shrink-0 flex items-center gap-2 h-10 px-4 rounded-xl',
        'border-2 border-dashed border-zinc-200 dark:border-zinc-700',
        'text-sm text-zinc-400 dark:text-zinc-500',
        'hover:border-zinc-300 dark:hover:border-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-300',
        'transition-colors duration-150 whitespace-nowrap',
        className,
      )}
      aria-label="Add column"
    >
      <RiAddLine size={14} />
      Add column
    </button>
  );
}
