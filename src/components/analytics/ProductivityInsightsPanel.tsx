/**
 * ProductivityInsightsPanel.tsx — Panel displaying rule-based productivity insights.
 *
 * Single Responsibility: Present rule-based recommendations with severity filtering.
 * Does NOT use AI — strictly rule engine logic evaluated by AnalyticsService & productivityUtils.
 */
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  RiSparklingLine,
  RiAlertLine,
  RiInformationLine,
  RiCheckDoubleLine,
} from 'react-icons/ri';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import type { ProductivitySuggestion, SuggestionSeverity } from '@/types/productivity.types';

export interface ProductivityInsightsPanelProps {
  suggestions: ProductivitySuggestion[];
  productivityScore: number;
}

export function ProductivityInsightsPanel({
  suggestions,
  productivityScore,
}: ProductivityInsightsPanelProps) {
  const [severityFilter, setSeverityFilter] = useState<'all' | SuggestionSeverity>('all');

  const actionSuggestions = useMemo(
    () => suggestions.filter((s) => s.type !== 'productivity_score'),
    [suggestions],
  );

  const filteredSuggestions = useMemo(() => {
    if (severityFilter === 'all') return actionSuggestions;
    return actionSuggestions.filter((s) => s.severity === severityFilter);
  }, [actionSuggestions, severityFilter]);

  return (
    <Card className="p-5 sm:p-6 flex flex-col justify-between h-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-4 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <RiSparklingLine className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <span>Productivity Intelligence & Insights</span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Rule-based evaluation of bottleneck risk factors
            </p>
          </div>
        </div>

        {/* Severity Filter Tabs */}
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg self-start sm:self-auto">
          {(['all', 'critical', 'warning', 'info'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`text-[11px] font-bold capitalize px-2.5 py-1 rounded-md transition-colors ${
                severityFilter === sev
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Score Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-200/50 dark:border-indigo-900/30 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider block">
            Overall Productivity Rating
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Weighted composite of completion, overdue penalty & priority tasks
          </span>
        </div>
        <div className="text-right">
          <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {productivityScore}/100
          </span>
        </div>
      </div>

      {/* Action Suggestions List */}
      <div className="space-y-3">
        {filteredSuggestions.length === 0 ? (
          <div className="p-6 text-center rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 space-y-2">
            <RiCheckDoubleLine className="w-8 h-8 text-emerald-500 mx-auto" />
            <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
              No recommendations for this filter
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
              Your tasks meet all rule standards for the selected severity level.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSuggestions.map((suggestion) => {
              const isCritical = suggestion.severity === 'critical';
              const isWarning = suggestion.severity === 'warning';

              return (
                <motion.div
                  key={suggestion.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      {isCritical ? (
                        <RiAlertLine className="w-4 h-4 text-rose-500" />
                      ) : isWarning ? (
                        <RiAlertLine className="w-4 h-4 text-amber-500" />
                      ) : (
                        <RiInformationLine className="w-4 h-4 text-blue-500" />
                      )}
                      <span>{suggestion.title}</span>
                    </h4>

                    <Badge
                      variant={isCritical ? 'danger' : isWarning ? 'warning' : 'secondary'}
                      className="text-[10px] uppercase font-bold"
                    >
                      {suggestion.severity}
                    </Badge>
                  </div>

                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed pl-6">
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
