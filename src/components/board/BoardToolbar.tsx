import { RiFilterLine, RiCloseLine } from 'react-icons/ri';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/common/Select';
import { Badge } from '@/components/common/Badge';
import { cn } from '@/utils/cn';
import type { TaskFilters, SortOption } from '@/types/task.types';
import type { Priority } from '@/types/common.types';

interface BoardToolbarProps {
  filters: TaskFilters;
  sortBy: SortOption;
  onSetFilters: (f: Partial<TaskFilters>) => void;
  onSetSortBy: (s: SortOption) => void;
  onClearFilters: () => void;
  className?: string;
}

const SORT_OPTIONS = [
  { value: 'order', label: 'Default order' },
  { value: 'priority', label: 'Priority' },
  { value: 'dueDate', label: 'Due date' },
  { value: 'createdAt', label: 'Newest first' },
  { value: 'title', label: 'Alphabetical' },
];

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'completed', label: 'Completed' },
  { value: 'overdue', label: 'Overdue' },
];

export function BoardToolbar({
  filters,
  sortBy,
  onSetFilters,
  onSetSortBy,
  onClearFilters,
  className,
}: BoardToolbarProps) {
  const hasActiveFilters =
    (filters.priority && filters.priority.length > 0) ||
    (filters.status && filters.status !== 'all') ||
    sortBy !== 'order';

  const togglePriority = (p: Priority) => {
    const current = filters.priority ?? [];
    const next = current.includes(p)
      ? current.filter((x) => x !== p)
      : [...current, p];
    onSetFilters({ priority: next.length > 0 ? next : undefined });
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-6 py-2.5 border-b border-zinc-100 dark:border-zinc-800 flex-shrink-0 overflow-x-auto',
        className,
      )}
    >
      <span className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 flex-shrink-0">
        <RiFilterLine size={13} />
        Filter:
      </span>

      {/* Priority filter chips */}
      <div className="flex gap-1 flex-shrink-0">
        {PRIORITY_OPTIONS.map(({ value, label }) => {
          const active = filters.priority?.includes(value);
          return (
            <button
              key={value}
              onClick={() => togglePriority(value)}
              aria-pressed={active}
              className={cn(
                'px-2 py-0.5 rounded-full text-xs font-medium border transition-colors duration-100',
                active
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600',
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Status */}
      <Select
        value={filters.status ?? 'all'}
        onChange={(e) => onSetFilters({ status: e.target.value as TaskFilters['status'] })}
        options={STATUS_OPTIONS}
        aria-label="Filter by status"
        className="h-7 text-xs w-32 flex-shrink-0"
      />

      <div className="flex-1" />

      {/* Sort */}
      <Select
        value={sortBy}
        onChange={(e) => onSetSortBy(e.target.value as SortOption)}
        options={SORT_OPTIONS}
        aria-label="Sort tasks"
        className="h-7 text-xs w-36 flex-shrink-0"
      />

      {/* Clear */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="xs"
          onClick={onClearFilters}
          aria-label="Clear filters"
          className="flex-shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          <RiCloseLine size={14} />
          <Badge variant="primary" size="sm">Active</Badge>
        </Button>
      )}
    </div>
  );
}
