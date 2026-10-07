import { memo, useCallback } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { AnimatePresence } from 'framer-motion';
import { ColumnHeader } from './ColumnHeader';
import { ColumnAddButton } from './ColumnAddButton';
import { TaskCard } from '@/components/task/TaskCard';
import { BoardErrorBoundary } from '@/components/common/BoardErrorBoundary';
import { cn } from '@/utils/cn';
import type { Column } from '@/types/board.types';
import type { Task } from '@/types/task.types';

interface ColumnContainerProps {
  column: Column;
  tasks: Task[];
  onAddTask: (columnId: string, title: string) => void;
  onOpenTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onRenameColumn: (columnId: string, name: string) => void;
  onDeleteColumn: (columnId: string) => void;
}

export const ColumnContainer = memo(function ColumnContainer({
  column,
  tasks,
  onAddTask,
  onOpenTask,
  onDeleteTask,
  onRenameColumn,
  onDeleteColumn,
}: ColumnContainerProps) {
  const handleAddTask = useCallback(
    (title: string) => onAddTask(column.id, title),
    [onAddTask, column.id],
  );
  const handleRename = useCallback(
    (name: string) => onRenameColumn(column.id, name),
    [onRenameColumn, column.id],
  );
  const handleDeleteColumn = useCallback(
    () => onDeleteColumn(column.id),
    [onDeleteColumn, column.id],
  );

  return (
    <BoardErrorBoundary level="column">
      <div
        className={cn(
          'flex flex-col flex-shrink-0 w-72 rounded-2xl',
          'bg-zinc-50 dark:bg-zinc-800/50',
          'border border-zinc-200 dark:border-zinc-700',
        )}
        aria-label={`Column: ${column.name}`}
      >
        <ColumnHeader
          name={column.name}
          taskCount={tasks.length}
          onRename={handleRename}
          onDelete={handleDeleteColumn}
        />

        <Droppable droppableId={column.id} type="TASK">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={cn(
                'flex-1 min-h-[40px] px-2 pb-2 space-y-2 overflow-y-auto',
                'transition-colors duration-150',
                snapshot.isDraggingOver && 'bg-blue-50/60 dark:bg-blue-900/10 rounded-xl',
              )}
              aria-label={`Drop zone for ${column.name}`}
            >
              <AnimatePresence initial={false}>
                {tasks.map((task, index) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    index={index}
                    columnName={column.name}
                    onOpen={onOpenTask}
                    onDelete={onDeleteTask}
                  />
                ))}
              </AnimatePresence>
              {provided.placeholder}
            </div>
          )}
        </Droppable>

        <ColumnAddButton mode="task" onAdd={handleAddTask} />
      </div>
    </BoardErrorBoundary>
  );
});
