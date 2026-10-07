/**
 * AnalyticsOverviewCards.tsx — Displays 6 core analytics summary metric cards.
 *
 * Single Responsibility: Present top-level quantitative performance indicators.
 */
import { motion } from 'framer-motion';
import {
  RiStackLine,
  RiPercentLine,
  RiAlertLine,
  RiTimeLine,
  RiTimerLine,
  RiCheckDoubleLine,
} from 'react-icons/ri';
import { Card } from '@/components/common/Card';
import type { AnalyticsData } from '@/types/analytics.types';

export interface AnalyticsOverviewCardsProps {
  data: AnalyticsData;
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

export function AnalyticsOverviewCards({ data }: AnalyticsOverviewCardsProps) {
  const cards = [
    {
      id: 'total-tasks',
      title: 'Total Tasks',
      value: data.totalTasks,
      icon: RiStackLine,
      color: 'text-blue-500 dark:text-blue-400',
      bgColor: 'bg-blue-500/10 dark:bg-blue-400/10',
      borderColor: 'border-blue-200 dark:border-blue-900/50',
    },
    {
      id: 'completion-rate',
      title: 'Completion Rate',
      value: `${data.completionRate}%`,
      icon: RiPercentLine,
      color:
        data.completionRate >= 70
          ? 'text-emerald-500 dark:text-emerald-400'
          : data.completionRate >= 40
            ? 'text-amber-500 dark:text-amber-400'
            : 'text-rose-500 dark:text-rose-400',
      bgColor:
        data.completionRate >= 70
          ? 'bg-emerald-500/10 dark:bg-emerald-400/10'
          : data.completionRate >= 40
            ? 'bg-amber-500/10 dark:bg-amber-400/10'
            : 'bg-rose-500/10 dark:bg-rose-400/10',
      borderColor:
        data.completionRate >= 70
          ? 'border-emerald-200 dark:border-emerald-900/50'
          : data.completionRate >= 40
            ? 'border-amber-200 dark:border-amber-900/50'
            : 'border-rose-200 dark:border-rose-900/50',
    },
    {
      id: 'overdue-tasks',
      title: 'Overdue Tasks',
      value: data.overdueTasks,
      icon: RiAlertLine,
      color: data.overdueTasks > 0 ? 'text-rose-500 dark:text-rose-400' : 'text-zinc-500 dark:text-zinc-400',
      bgColor: data.overdueTasks > 0 ? 'bg-rose-500/10 dark:bg-rose-400/10' : 'bg-zinc-500/10 dark:bg-zinc-400/10',
      borderColor: data.overdueTasks > 0 ? 'border-rose-200 dark:border-rose-900/50' : 'border-zinc-200 dark:border-zinc-800',
    },
    {
      id: 'due-soon-tasks',
      title: 'Due Within 24h',
      value: data.dueSoonTasks,
      icon: RiTimeLine,
      color: 'text-amber-500 dark:text-amber-400',
      bgColor: 'bg-amber-500/10 dark:bg-amber-400/10',
      borderColor: 'border-amber-200 dark:border-amber-900/50',
    },
    {
      id: 'total-estimated',
      title: 'Total Estimated',
      value: `${data.totalEstimatedHours}h`,
      icon: RiTimerLine,
      color: 'text-indigo-500 dark:text-indigo-400',
      bgColor: 'bg-indigo-500/10 dark:bg-indigo-400/10',
      borderColor: 'border-indigo-200 dark:border-indigo-900/50',
    },
    {
      id: 'completed-estimated',
      title: 'Completed Hours',
      value: `${data.completedEstimatedHours}h`,
      icon: RiCheckDoubleLine,
      color: 'text-teal-500 dark:text-teal-400',
      bgColor: 'bg-teal-500/10 dark:bg-teal-400/10',
      borderColor: 'border-teal-200 dark:border-teal-900/50',
    },
  ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4"
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
                <div className={`p-2 rounded-xl ${card.bgColor} ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
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
