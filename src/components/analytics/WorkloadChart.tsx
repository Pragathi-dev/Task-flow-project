/**
 * WorkloadChart.tsx — Pure SVG Horizontal Bar chart for Column & Workload Distribution.
 *
 * Single Responsibility: Visualize task volume across board column stages.
 * Strictly avoids third-party chart libraries (Recharts / Chart.js).
 */
import { motion } from 'framer-motion';
import { RiStackOverflowLine } from 'react-icons/ri';
import { Card } from '@/components/common/Card';

export interface WorkloadChartProps {
  byColumn: Record<string, number>;
  totalTasks: number;
}

export function WorkloadChart({ byColumn, totalTasks }: WorkloadChartProps) {
  const entries = Object.entries(byColumn);

  // If no columns or empty, fallback to standard column stage names
  const columnData =
    entries.length > 0
      ? entries.map(([name, count]) => ({ name, count }))
      : [
          { name: 'To Do', count: 0 },
          { name: 'In Progress', count: 0 },
          { name: 'Done', count: 0 },
        ];

  const maxCount = Math.max(1, ...columnData.map((c) => c.count));

  return (
    <Card className="p-5 sm:p-6 flex flex-col justify-between space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <RiStackOverflowLine className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Workload Stage Breakdown
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Task distribution across workflow columns
            </p>
          </div>
        </div>
      </div>

      {/* SVG Horizontal Bars */}
      <div className="space-y-4">
        {columnData.map((col, idx) => {
          const pct = totalTasks > 0 ? Math.round((col.count / totalTasks) * 100) : 0;
          const barWidthPct = Math.round((col.count / maxCount) * 100);

          return (
            <div key={col.name} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-zinc-800 dark:text-zinc-200 capitalize">
                  {col.name}
                </span>
                <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                  <span>{col.count} tasks</span>
                  <span className="text-zinc-300 dark:text-zinc-700">•</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">
                    {pct}%
                  </span>
                </div>
              </div>

              {/* Progress track */}
              <div className="w-full h-3 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden relative">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(barWidthPct, 2)}%` }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                  className="h-full bg-gradient-to-r from-teal-500 to-indigo-500 rounded-full"
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
