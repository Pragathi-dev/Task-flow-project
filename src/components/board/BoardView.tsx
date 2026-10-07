import { useCallback } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import { ColumnContainer } from '@/components/column/ColumnContainer';
import { ColumnAddButton } from '@/components/column/ColumnAddButton';
import { BoardEmptyState } from './BoardEmptyState';
import { BoardErrorBoundary } from '@/components/common/BoardErrorBoundary';
import { cn } from '@/utils/cn';
import type { Column } from '@/types/board.types';
import type { Task } from '@/types/task.types';
import type { DropResult } from '@hello-pangea/dnd';

interface BoardViewProps {
  columns: Column[];
  tasksByColumnId: Record<string, Task[]>;
  workspaceId: string;
  boardId: string;
  onDragEnd: (result: DropResult) => void;
  onAddTask: (columnId: string, title: string) => void;
  onOpenTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onAddColumn: (name: string) => void;
  onRenameColumn: (columnId: string, name: string) => void;
  onDeleteColumn: (columnId: string) => void;
}

export function BoardView({
  columns,
  tasksByColumnId,
  onDragEnd,
  onAddTask,
  onOpenTask,
  onDeleteTask,
  onAddColumn,
  onRenameColumn,
  onDeleteColumn,
}: BoardViewProps) {
  const handleAddColumn = useCallback(
    (name: string) => onAddColumn(name),
    [onAddColumn],
  );

  if (columns.length === 0) {
    return <BoardEmptyState onAddColumn={handleAddColumn} />;
  }

  return (
    <BoardErrorBoundary level="board">
      <DragDropContext onDragEnd={onDragEnd}>
        <div
          className={cn(
            'flex gap-4 px-6 py-5 h-full overflow-x-auto',
            'items-start',
          )}
          aria-label="Board columns"
        >
          {columns.map((column) => (
            <ColumnContainer
              key={column.id}
              column={column}
              tasks={tasksByColumnId[column.id] ?? []}
              onAddTask={onAddTask}
              onOpenTask={onOpenTask}
              onDeleteTask={onDeleteTask}
              onRenameColumn={onRenameColumn}
              onDeleteColumn={onDeleteColumn}
            />
          ))}

          {/* Add column button */}
          <ColumnAddButton
            mode="column"
            onAdd={handleAddColumn}
            className="self-start mt-0"
          />
        </div>
      </DragDropContext>
    </BoardErrorBoundary>
  );
}
