/**
 * ActivityHeader.tsx — Independent header widget for the Activity Timeline page.
 *
 * Single Responsibility: Render page title, category filter tabs, and workspace scope filter.
 */
import { motion } from 'framer-motion';
import { RiHistoryLine, RiFilter3Line } from 'react-icons/ri';
import type { ActivityCategoryFilter } from '@/hooks/useActivities';
import type { Workspace } from '@/types/workspace.types';

export interface ActivityHeaderProps {
  categoryFilter: ActivityCategoryFilter;
  onSelectCategory: (filter: ActivityCategoryFilter) => void;
  selectedWorkspaceId: string | null;
  onSelectWorkspace: (id: string | null) => void;
  workspaces: Workspace[];
  totalCount: number;
}

export function ActivityHeader({
  categoryFilter,
  onSelectCategory,
  selectedWorkspaceId,
  onSelectWorkspace,
  workspaces,
  totalCount,
}: ActivityHeaderProps) {
  const filterOptions: { id: ActivityCategoryFilter; label: string }[] = [
    { id: 'all', label: 'All Activity' },
    { id: 'tasks', label: 'Tasks' },
    { id: 'boards', label: 'Boards & Columns' },
    { id: 'workspaces', label: 'Workspaces' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-indigo-500/10 dark:from-teal-500/20 dark:via-emerald-500/20 dark:to-indigo-500/20 p-6 md:p-8 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
            <RiHistoryLine className="w-4 h-4" />
            <span>Audit & Timeline Trail</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Activity History
          </h1>

          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Audit log tracking {totalCount} events across your workspaces
          </p>
        </div>

        {/* Workspace Scope Filter */}
        <div className="flex items-center gap-2.5 bg-white/80 dark:bg-zinc-900/80 backdrop-blur border border-zinc-200 dark:border-zinc-800 p-2 rounded-xl shadow-xs self-start md:self-auto">
          <RiFilter3Line className="w-4 h-4 text-zinc-500 dark:text-zinc-400 ml-1" />
          <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
            Scope:
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

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-1.5 border-t border-zinc-200/60 dark:border-zinc-800/60 pt-4 overflow-x-auto">
        {filterOptions.map((opt) => {
          const isActive = categoryFilter === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onSelectCategory(opt.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                  : 'bg-white/60 dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
