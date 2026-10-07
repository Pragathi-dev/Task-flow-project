/**
 * PriorityDistributionChart.tsx — Pure SVG donut & progress bar chart for Priority Distribution.
 *
 * Single Responsibility: Visualize task breakdown by priority (Urgent, High, Medium, Low).
 * Strictly avoids third-party chart libraries (Recharts / Chart.js).
 */
import { motion } from 'framer-motion';
import { RiPieChartLine } from 'react-icons/ri';
import { Card } from '@/components/common/Card';
import type { Priority } from '@/types/common.types';

export interface PriorityDistributionChartProps {
  byPriority: Record<Priority, number>;
  totalTasks: number;
}

const PRIORITY_CONFIG: Record<
  Priority,
  { label: string; color: string; hex: string; bgClass: string; textClass: string }
> = {
  urgent: {
    label: 'Urgent',
    color: 'bg-rose-500',
    hex: '#f43f5e',
    bgClass: 'bg-rose-500/10 dark:bg-rose-400/10',
    textClass: 'text-rose-600 dark:text-rose-400',
  },
  high: {
    label: 'High',
    color: 'bg-amber-500',
    hex: '#f59e0b',
    bgClass: 'bg-amber-500/10 dark:bg-amber-400/10',
    textClass: 'text-amber-600 dark:text-amber-400',
  },
  medium: {
    label: 'Medium',
    color: 'bg-blue-500',
    hex: '#3b82f6',
    bgClass: 'bg-blue-500/10 dark:bg-blue-400/10',
    textClass: 'text-blue-600 dark:text-blue-400',
  },
  low: {
    label: 'Low',
    color: 'bg-emerald-500',
    hex: '#10b981',
    bgClass: 'bg-emerald-500/10 dark:bg-emerald-400/10',
    textClass: 'text-emerald-600 dark:text-emerald-400',
  },
};

export function PriorityDistributionChart({
  byPriority,
  totalTasks,
}: PriorityDistributionChartProps) {
  const priorities: Priority[] = ['urgent', 'high', 'medium', 'low'];

  // SVG Donut calculation constants
  const size = 160;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let currentOffset = 0;

  const donutSegments = priorities.map((p) => {
    const count = byPriority[p] ?? 0;
    const percentage = totalTasks > 0 ? (count / totalTasks) * 100 : 0;
    const dashLength = (percentage / 100) * circumference;
    const dashOffset = currentOffset;
    currentOffset -= dashLength;

    return {
      priority: p,
      count,
      percentage: Math.round(percentage),
      dashLength,
      dashOffset,
      config: PRIORITY_CONFIG[p],
    };
  });

  return (
    <Card className="p-5 sm:p-6 flex flex-col justify-between space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <RiPieChartLine className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Priority Distribution
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Task workload by urgency level
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-full">
          {totalTasks} Total
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
        {/* SVG Donut Chart */}
        <div className="sm:col-span-5 flex flex-col items-center justify-center relative">
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="transform -rotate-90"
          >
            {/* Background Circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-zinc-100 dark:text-zinc-800"
            />

            {/* Segment Arcs */}
            {totalTasks > 0 &&
              donutSegments.map((segment) => {
                if (segment.count === 0) return null;
                return (
                  <motion.circle
                    key={segment.priority}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="transparent"
                    stroke={segment.config.hex}
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${segment.dashLength} ${circumference - segment.dashLength}`}
                    strokeDashoffset={segment.dashOffset}
                    initial={{ strokeDasharray: `0 ${circumference}` }}
                    animate={{
                      strokeDasharray: `${segment.dashLength} ${circumference - segment.dashLength}`,
                    }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                );
              })}
          </svg>

          {/* Center Label */}
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
              {totalTasks}
            </span>
            <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
              Tasks
            </span>
          </div>
        </div>

        {/* Priority Breakdown Progress Bars */}
        <div className="sm:col-span-7 space-y-3">
          {priorities.map((priority) => {
            const count = byPriority[priority] ?? 0;
            const pct = totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0;
            const cfg = PRIORITY_CONFIG[priority];

            return (
              <div key={priority} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${cfg.color}`} />
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                      {cfg.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-medium text-zinc-500 dark:text-zinc-400">
                    <span>{count} tasks</span>
                    <span className="text-zinc-300 dark:text-zinc-700">•</span>
                    <span className="font-bold text-zinc-700 dark:text-zinc-300">{pct}%</span>
                  </div>
                </div>

                {/* Bar track */}
                <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6 }}
                    className={`h-full ${cfg.color} rounded-full`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
