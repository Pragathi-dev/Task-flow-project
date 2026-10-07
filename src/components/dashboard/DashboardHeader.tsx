/**
 * DashboardHeader.tsx — Composable, independent header widget for the Dashboard.
 *
 * Single Responsibility: Display workspace context, welcome banner, and quick stats summary.
 */
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { RiKanbanView2, RiCalendarLine, RiSparklingLine } from 'react-icons/ri';
import { Button } from '@/components/common/Button';

export interface DashboardHeaderProps {
  workspaceName?: string;
  activeBoardName?: string;
  activeBoardId?: string | null;
  totalTasksCount: number;
  completedTasksCount: number;
}

export function DashboardHeader({
  workspaceName,
  activeBoardName,
  activeBoardId,
  totalTasksCount,
  completedTasksCount,
}: DashboardHeaderProps) {
  const navigate = useNavigate();
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 dark:from-indigo-500/20 dark:via-purple-500/20 dark:to-pink-500/20 p-6 md:p-8 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            <RiSparklingLine className="w-4 h-4" />
            <span>{workspaceName ? `${workspaceName} Workspace` : 'TaskFlow Overview'}</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Welcome Back 👋
          </h1>

          <p className="text-sm text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
            <RiCalendarLine className="w-4 h-4 text-zinc-400" />
            <span>{currentDate}</span>
            <span className="text-zinc-300 dark:text-zinc-700">•</span>
            <span>
              {completedTasksCount} of {totalTasksCount} tasks completed
            </span>
          </p>
        </div>

        {activeBoardId && (
          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate(`/board/${activeBoardId}`)}
              className="shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              <RiKanbanView2 className="w-5 h-5" />
              <span>Go to {activeBoardName || 'Active Board'}</span>
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
