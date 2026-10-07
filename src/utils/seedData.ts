/**
 * seedData — creates default workspace, board, columns, and sample tasks
 * on first launch when storage is empty.
 */
import { workspaceService } from '@/services/WorkspaceService';
import { boardService } from '@/services/BoardService';
import { taskService } from '@/services/TaskService';
import { WORKSPACE_COLORS } from '@/config/constants';

export async function seedDefaultData(): Promise<void> {
  try {
    const workspace = await workspaceService.create({
      name: 'My Workspace',
      color: WORKSPACE_COLORS[0],
      icon: '🚀',
    });

    const board = await boardService.create({
      name: 'Getting Started',
      workspaceId: workspace.id,
      color: '#3b82f6',
    });

    const columns = await boardService.getColumns(board.id);
    const todoColumn = columns.find((c) => c.name === 'To Do');
    const inProgressColumn = columns.find((c) => c.name === 'In Progress');

    if (!todoColumn || !inProgressColumn) return;

    await taskService.create({
      title: 'Welcome to TaskFlow 👋',
      description:
        'This is your first task. Click it to explore the full task detail view — you can add a description, set a due date, track a checklist, and leave comments.',
      priority: 'medium',
      columnId: todoColumn.id,
      boardId: board.id,
      workspaceId: workspace.id,
    });

    await taskService.create({
      title: 'Explore the board view',
      description:
        'Try dragging this task to another column. You can reorder tasks within a column or move them across columns.',
      priority: 'low',
      columnId: todoColumn.id,
      boardId: board.id,
      workspaceId: workspace.id,
    });

    await taskService.create({
      title: 'Set up your first project',
      description:
        'Create a new workspace and board for your next project. Use the sidebar to switch between workspaces.',
      priority: 'high',
      columnId: inProgressColumn.id,
      boardId: board.id,
      workspaceId: workspace.id,
      estimatedHours: 2,
    });
  } catch (err) {
    console.error('[seedData] Failed to seed default data:', err);
  }
}
