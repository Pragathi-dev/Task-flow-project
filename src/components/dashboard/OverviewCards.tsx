/**
 * OverviewCards.tsx — Independent widget displaying the 8 main overview metrics.
 *
 * Single Responsibility: Render stat metrics grid with micro-animations & dark mode styling.
 */
import { motion } from 'framer-motion';
import {
  RiCheckboxCircleLine,
  RiTimeLine,
  RiAlertLine,
  RiCalendarCheckLine,
  RiKanbanView2,
  RiFolder3Line,
  RiTrophyLine,
  RiStackLine,
} from 'react-icons/ri';
import { Card } from '@/components/common/Card';

export interface OverviewStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  dueTodayTasks: number;
  activeBoardsCount: number;
  activeWorkspacesCount: number;
  productivityScore: number;
}

export interface OverviewCardsProps {
  stats: OverviewStats;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemAnim = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0 },
};

export function OverviewCards({ stats }: OverviewCardsProps) {
  const cards = [
    {
      id: 'total-tasks',
      title: 'Total Tasks',
      value: stats.totalTasks,
      icon: RiStackLine,
      color: 'text-blue-500 dark:text-blue-400',
      bgColor: 'bg-blue-500/10 dark:bg-blue-400/10',
      borderColor: 'border-blue-200 dark:border-blue-900/50',
    },
    {
      id: 'completed-tasks',
      title: 'Completed',
      value: stats.completedTasks,
      icon: RiCheckboxCircleLine,
      color: 'text-emerald-500 dark:text-emerald-400',
      bgColor: 'bg-emerald-500/10 dark:bg-emerald-400/10',
      borderColor: 'border-emerald-200 dark:border-emerald-900/50',
    },
    {
      id: 'in-progress-tasks',
      title: 'In Progress',
      value: stats.inProgressTasks,
      icon: RiTimeLine,
      color: 'text-amber-500 dark:text-amber-400',
      bgColor: 'bg-amber-500/10 dark:bg-amber-400/10',
      borderColor: 'border-amber-200 dark:border-amber-900/50',
    },
    {
      id: 'overdue-tasks',
      title: 'Overdue Tasks',
      value: stats.overdueTasks,
      icon: RiAlertLine,
      color: stats.overdueTasks > 0 ? 'text-rose-500 dark:text-rose-400' : 'text-zinc-500 dark:text-zinc-400',
      bgColor: stats.overdueTasks > 0 ? 'bg-rose-500/10 dark:bg-rose-400/10' : 'bg-zinc-500/10 dark:bg-zinc-400/10',
      borderColor: stats.overdueTasks > 0 ? 'border-rose-200 dark:border-rose-900/50' : 'border-zinc-200 dark:border-zinc-800',
    },
    {
      id: 'due-today-tasks',
      title: 'Due Today',
      value: stats.dueTodayTasks,
      icon: RiCalendarCheckLine,
      color: 'text-purple-500 dark:text-purple-400',
      bgColor: 'bg-purple-500/10 dark:bg-purple-400/10',
      borderColor: 'border-purple-200 dark:border-purple-900/50',
    },
    {
      id: 'active-boards',
      title: 'Active Boards',
      value: stats.activeBoardsCount,
      icon: RiKanbanView2,
      color: 'text-cyan-500 dark:text-cyan-400',
      bgColor: 'bg-cyan-500/10 dark:bg-cyan-400/10',
      borderColor: 'border-cyan-200 dark:border-cyan-900/50',
    },
    {
      id: 'active-workspaces',
      title: 'Active Workspaces',
      value: stats.activeWorkspacesCount,
      icon: RiFolder3Line,
      color: 'text-indigo-500 dark:text-indigo-400',
      bgColor: 'bg-indigo-500/10 dark:bg-indigo-400/10',
      borderColor: 'border-indigo-200 dark:border-indigo-900/50',
    },
    {
      id: 'productivity-score',
      title: 'Productivity Score',
      value: `${stats.productivityScore}%`,
      icon: RiTrophyLine,
      color:
        stats.productivityScore >= 75
          ? 'text-emerald-500 dark:text-emerald-400'
          : stats.productivityScore >= 50
            ? 'text-amber-500 dark:text-amber-400'
            : 'text-rose-500 dark:text-rose-400',
      bgColor:
        stats.productivityScore >= 75
          ? 'bg-emerald-500/10 dark:bg-emerald-400/10'
          : stats.productivityScore >= 50
            ? 'bg-amber-500/10 dark:bg-amber-400/10'
            : 'bg-rose-500/10 dark:bg-rose-400/10',
      borderColor:
        stats.productivityScore >= 75
          ? 'border-emerald-200 dark:border-emerald-900/50'
          : stats.productivityScore >= 50
            ? 'border-amber-200 dark:border-amber-900/50'
            : 'border-rose-200 dark:border-rose-900/50',
    },
  ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <motion.div key={card.id} variants={itemAnim}>
            <Card
              className={`p-4 sm:p-5 transition-all duration-200 hover:shadow-md border ${card.borderColor}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  {card.title}
                </span>
                <div className={`p-2.5 rounded-xl ${card.bgColor} ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
                  {card.value}
                </span>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
