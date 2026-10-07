/**
 * WeeklyProgressChart.tsx — Pure SVG chart component for weekly activity trends.
 *
 * Single Responsibility: Visualize created vs completed task metrics over 7 days with pure SVG.
 * Strictly avoids third-party chart libraries (Recharts / Chart.js).
 */
import { motion } from 'framer-motion';
import { RiBarChartGroupedLine, RiCheckDoubleLine, RiAddCircleLine, RiPercentLine } from 'react-icons/ri';
import { Card } from '@/components/common/Card';
import type { WeeklyTrendData } from '@/types/analytics.types';

export interface WeeklyProgressChartProps {
  trend: WeeklyTrendData[];
  completedThisWeek: number;
  createdThisWeek: number;
  completionRateThisWeek: number;
}

export function WeeklyProgressChart({
  trend,
  completedThisWeek,
  createdThisWeek,
  completionRateThisWeek,
}: WeeklyProgressChartProps) {
  // Find maximum count for SVG bar height scaling (min value of 5 for visually appealing height)
  const maxVal = Math.max(
    5,
    ...trend.map((d) => Math.max(d.created, d.completed)),
  );

  return (
    <Card className="p-5 sm:p-6 flex flex-col justify-between space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <RiBarChartGroupedLine className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Weekly Progress
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Last 7 days creation & completion performance
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-indigo-500 dark:bg-indigo-400 inline-block" />
            <span className="text-zinc-600 dark:text-zinc-400">Created</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-emerald-500 dark:bg-emerald-400 inline-block" />
            <span className="text-zinc-600 dark:text-zinc-400">Completed</span>
          </div>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
            <RiAddCircleLine className="w-4 h-4 text-indigo-500" />
            <span>Created</span>
          </div>
          <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            {createdThisWeek}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
            <RiCheckDoubleLine className="w-4 h-4 text-emerald-500" />
            <span>Completed</span>
          </div>
          <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            {completedThisWeek}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
            <RiPercentLine className="w-4 h-4 text-purple-500" />
            <span>Rate</span>
          </div>
          <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            {completionRateThisWeek}%
          </span>
        </div>
      </div>

      {/* SVG Bar Chart Area */}
      <div className="w-full pt-2">
        <div className="h-44 w-full flex items-end justify-between gap-2 sm:gap-4 px-2">
          {trend.map((day, idx) => {
            const createdHeightPct = Math.round((day.created / maxVal) * 100);
            const completedHeightPct = Math.round((day.completed / maxVal) * 100);

            return (
              <div key={day.date} className="flex-1 flex flex-col items-center h-full justify-end group">
                <div className="w-full flex items-end justify-center gap-1 sm:gap-1.5 h-36">
                  {/* Created Bar */}
                  <div className="w-1/2 max-w-[16px] h-full flex items-end">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(createdHeightPct, 4)}%` }}
                      transition={{ duration: 0.5, delay: idx * 0.05 }}
                      className="w-full bg-indigo-500/80 hover:bg-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400 rounded-t-sm transition-colors relative"
                    >
                      {/* Tooltip on hover */}
                      <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-[10px] font-bold px-1.5 py-0.5 rounded shadow z-10 whitespace-nowrap transition-opacity">
                        {day.created} created
                      </div>
                    </motion.div>
                  </div>

                  {/* Completed Bar */}
                  <div className="w-1/2 max-w-[16px] h-full flex items-end">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(completedHeightPct, 4)}%` }}
                      transition={{ duration: 0.5, delay: idx * 0.05 + 0.1 }}
                      className="w-full bg-emerald-500/80 hover:bg-emerald-600 dark:bg-emerald-500 dark:hover:bg-emerald-400 rounded-t-sm transition-colors relative"
                    >
                      {/* Tooltip on hover */}
                      <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-[10px] font-bold px-1.5 py-0.5 rounded shadow z-10 whitespace-nowrap transition-opacity">
                        {day.completed} done
                      </div>
                    </motion.div>
                  </div>
                </div>

                {/* Day Label */}
                <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mt-2">
                  {day.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
