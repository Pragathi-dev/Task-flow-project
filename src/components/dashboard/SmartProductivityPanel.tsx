/**
 * SmartProductivityPanel.tsx — Independent widget displaying rule-based productivity insights.
 *
 * Single Responsibility: Present rule-based suggestions and score explanation.
 * Does NOT use AI — strictly deterministic evaluation via AnalyticsService / productivityUtils.
 */
import { motion } from 'framer-motion';
import {
  RiSparklingLine,
  RiAlertLine,
  RiInformationLine,
  RiCheckDoubleLine,
  RiScales3Line,
} from 'react-icons/ri';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import type { ProductivitySuggestion } from '@/types/productivity.types';

export interface SmartProductivityPanelProps {
  suggestions: ProductivitySuggestion[];
  productivityScore: number;
  totalTasksCount: number;
  overdueCount: number;
}

export function SmartProductivityPanel({
  suggestions,
  productivityScore,
  totalTasksCount,
  overdueCount,
}: SmartProductivityPanelProps) {
  // Filter out the score suggestion itself from the action items list (it's displayed in score breakdown)
  const actionSuggestions = suggestions.filter((s) => s.type !== 'productivity_score');

  // Rule-based high workload detector
  const isHighWorkload = totalTasksCount > 15 || overdueCount >= 3;

  return (
    <Card className="p-5 sm:p-6 flex flex-col justify-between h-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <RiSparklingLine className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <span>Smart Productivity Assistant</span>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                Rule-Based Engine
              </span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Automated workload analysis & improvement suggestions
            </p>
          </div>
        </div>
      </div>

      {/* Score Explanation Box */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-zinc-50 to-indigo-50/30 dark:from-zinc-900/80 dark:to-indigo-950/20 border border-zinc-200/80 dark:border-zinc-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <RiScales3Line className="w-4 h-4 text-indigo-500" />
            Productivity Score Explanation
          </span>
          <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
            {productivityScore}/100
          </span>
        </div>

        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
          Score is calculated deterministically based on three weighted productivity factors:
        </p>

        <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
          <div className="p-2 rounded bg-white dark:bg-zinc-800/80 border border-zinc-100 dark:border-zinc-700/50 text-center">
            <span className="block font-bold text-zinc-900 dark:text-zinc-100">50% Weight</span>
            <span className="text-zinc-500 dark:text-zinc-400">Completion Rate</span>
          </div>
          <div className="p-2 rounded bg-white dark:bg-zinc-800/80 border border-zinc-100 dark:border-zinc-700/50 text-center">
            <span className="block font-bold text-zinc-900 dark:text-zinc-100">30% Weight</span>
            <span className="text-zinc-500 dark:text-zinc-400">Overdue Penalty</span>
          </div>
          <div className="p-2 rounded bg-white dark:bg-zinc-800/80 border border-zinc-100 dark:border-zinc-700/50 text-center">
            <span className="block font-bold text-zinc-900 dark:text-zinc-100">20% Weight</span>
            <span className="text-zinc-500 dark:text-zinc-400">High Priority Done</span>
          </div>
        </div>
      </div>

      {/* High Workload Alert if triggered */}
      {isHighWorkload && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 rounded-xl bg-amber-500/10 dark:bg-amber-400/10 border border-amber-200 dark:border-amber-900/50 flex items-start gap-3"
        >
          <RiAlertLine className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-bold text-amber-900 dark:text-amber-200">
              High Workload Detected
            </h4>
            <p className="text-amber-800 dark:text-amber-300 mt-0.5 leading-relaxed">
              You have {totalTasksCount} total tasks with {overdueCount} overdue. Consider prioritizing urgent tasks or delegating work.
            </p>
          </div>
        </motion.div>
      )}

      {/* Actionable Rule Suggestions */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
          Actionable Suggestions ({actionSuggestions.length})
        </h4>

        {actionSuggestions.length === 0 ? (
          <div className="p-4 rounded-xl bg-emerald-500/5 dark:bg-emerald-400/5 border border-emerald-200/50 dark:border-emerald-900/30 flex items-center gap-3">
            <RiCheckDoubleLine className="w-5 h-5 text-emerald-500" />
            <span className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
              No productivity warnings! All tasks are in healthy standing.
            </span>
          </div>
        ) : (
          <div className="space-y-2.5">
            {actionSuggestions.map((suggestion) => {
              const isCritical = suggestion.severity === 'critical';
              const isWarning = suggestion.severity === 'warning';

              return (
                <motion.div
                  key={suggestion.id}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h5 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      {isCritical ? (
                        <RiAlertLine className="w-4 h-4 text-rose-500" />
                      ) : isWarning ? (
                        <RiAlertLine className="w-4 h-4 text-amber-500" />
                      ) : (
                        <RiInformationLine className="w-4 h-4 text-blue-500" />
                      )}
                      <span>{suggestion.title}</span>
                    </h5>

                    <Badge
                      variant={isCritical ? 'danger' : isWarning ? 'warning' : 'secondary'}
                      className="text-[10px] uppercase font-bold"
                    >
                      {suggestion.severity}
                    </Badge>
                  </div>

                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed pl-5">
                    {suggestion.message}
                  </p>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
