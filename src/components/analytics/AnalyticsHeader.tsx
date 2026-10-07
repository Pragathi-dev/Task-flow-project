/**
 * AnalyticsHeader.tsx — Independent header widget for the Analytics view.
 *
 * Single Responsibility: Display title, workspace scope selector, and data status.
 */
import { motion } from 'framer-motion';
import { RiBarChartBoxLine, RiFilter3Line } from 'react-icons/ri';
import type { Workspace } from '@/types/workspace.types';

export interface AnalyticsHeaderProps {
  selectedWorkspaceId: string | null;
  onSelectWorkspace: (id: string | null) => void;
  workspaces: Workspace[];
  totalTasksCount: number;
}

export function AnalyticsHeader({
  selectedWorkspaceId,
  onSelectWorkspace,
  workspaces,
  totalTasksCount,
}: AnalyticsHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-violet-500/10 dark:from-blue-500/20 dark:via-indigo-500/20 dark:to-violet-500/20 p-6 md:p-8 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            <RiBarChartBoxLine className="w-4 h-4" />
            <span>Productivity & Metrics Intelligence</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Analytics Overview
          </h1>

          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Real-time analysis of {totalTasksCount} tasks across your workflows
          </p>
        </div>

        {/* Workspace Scope Filter */}
        <div className="flex items-center gap-2.5 bg-white/80 dark:bg-zinc-900/80 backdrop-blur border border-zinc-200 dark:border-zinc-800 p-2 rounded-xl shadow-xs">
          <RiFilter3Line className="w-4 h-4 text-zinc-500 dark:text-zinc-400 ml-1" />
          <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
            Workspace:
          </span>
          <select
            value={selectedWorkspaceId ?? ''}
            onChange={(e) => onSelectWorkspace(e.target.value || null)}
            className="bg-transparent text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:outline-hidden cursor-pointer pr-2"
          >
            <option value="" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
              All Workspaces
            </option>
            {workspaces.map((ws) => (
              <option
                key={ws.id}
                value={ws.id}
                className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
              >
                {ws.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </motion.div>
  );
}
