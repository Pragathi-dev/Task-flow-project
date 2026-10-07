/**
 * PriorityBreakdownChart.tsx — Pure SVG donut & legend breakdown for Priority distribution.
 *
 * Single Responsibility: Visualize task count and proportion by priority level.
 */
import { motion } from 'framer-motion';
import { RiPieChart2Line } from 'react-icons/ri';
import { Card } from '@/components/common/Card';
import type { Priority } from '@/types/common.types';

export interface PriorityBreakdownChartProps {
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

export function PriorityBreakdownChart({
  byPriority,
  totalTasks,
}: PriorityBreakdownChartProps) {
  const priorities: Priority[] = ['urgent', 'high', 'medium', 'low'];

  const size = 160;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let currentOffset = 0;

  const segments = priorities.map((p) => {
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
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <RiPieChart2Line className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Priority Breakdown
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Distribution across urgency levels
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
        {/* SVG Donut */}
        <div className="sm:col-span-5 flex flex-col items-center justify-center relative">
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="transform -rotate-90"
          >
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-zinc-100 dark:text-zinc-800"
            />
            {totalTasks > 0 &&
              segments.map((seg) => {
                if (seg.count === 0) return null;
                return (
                  <motion.circle
                    key={seg.priority}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="transparent"
                    stroke={seg.config.hex}
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${seg.dashLength} ${circumference - seg.dashLength}`}
                    strokeDashoffset={seg.dashOffset}
                    initial={{ strokeDasharray: `0 ${circumference}` }}
                    animate={{
                      strokeDasharray: `${seg.dashLength} ${circumference - seg.dashLength}`,
                    }}
                    transition={{ duration: 0.8 }}
                  />
                );
              })}
          </svg>
          <div className="absolute text-center">
            <span className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
              {totalTasks}
            </span>
            <span className="text-[10px] font-semibold text-zinc-400 block uppercase">
              Total
            </span>
          </div>
        </div>

        {/* Priority breakdown legend list */}
        <div className="sm:col-span-7 space-y-3">
          {priorities.map((p) => {
            const count = byPriority[p] ?? 0;
            const pct = totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0;
            const cfg = PRIORITY_CONFIG[p];

            return (
              <div key={p} className="p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className={`w-3 h-3 rounded-full ${cfg.color}`} />
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    {cfg.label}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="font-medium text-zinc-500 dark:text-zinc-400">
                    {count} tasks
                  </span>
                  <span className={`px-2 py-0.5 rounded-full font-bold ${cfg.bgClass} ${cfg.textClass}`}>
                    {pct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
