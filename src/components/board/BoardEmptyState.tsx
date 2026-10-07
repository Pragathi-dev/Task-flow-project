import { RiKanbanView2 } from 'react-icons/ri';
import { Button } from '@/components/common/Button';

interface BoardEmptyStateProps {
  onAddColumn: (name: string) => void;
}

export function BoardEmptyState({ onAddColumn }: BoardEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 text-center py-20 px-6">
      <div className="text-zinc-200 dark:text-zinc-700 mb-5">
        <RiKanbanView2 size={56} />
      </div>
      <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">
        No columns yet
      </h3>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs mb-6">
        Add a column to start organising your tasks into stages.
      </p>
      <Button
        variant="primary"
        size="sm"
        onClick={() => onAddColumn('To Do')}
      >
        Add first column
      </Button>
    </div>
  );
}
