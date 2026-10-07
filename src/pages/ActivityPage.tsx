/**
 * ActivityPage.tsx — Production-ready Global Activity Timeline Page.
 *
 * Single Responsibility: Composition container assembling independent activity widgets.
 * Consumes useActivities() hook to display grouped events across all workspaces & boards.
 */
import { useActivities } from '@/hooks/useActivities';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useTaskStore } from '@/store/taskStore';
import {
  ActivityHeader,
  ActivityGroup,
  ActivitySkeleton,
} from '@/components/activity';
import { EmptyState } from '@/components/common/EmptyState';
import { RiHistoryLine } from 'react-icons/ri';

export default function ActivityPage() {
  const {
    activities,
    groupedActivities,
    categoryFilter,
    setCategoryFilter,
    selectedWorkspaceId,
    setSelectedWorkspaceId,
    totalCount,
  } = useActivities();

  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const isLoading = useTaskStore((s) => s.isLoading);

  if (isLoading) {
    return <ActivitySkeleton />;
  }

  const hasEvents = activities.length > 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8 max-w-5xl mx-auto pb-16">
      {/* 1. Header Widget with Filter Controls */}
      <ActivityHeader
        categoryFilter={categoryFilter}
        onSelectCategory={setCategoryFilter}
        selectedWorkspaceId={selectedWorkspaceId}
        onSelectWorkspace={setSelectedWorkspaceId}
        workspaces={workspaces}
        totalCount={totalCount}
      />

      {/* 2. Grouped Activity Timeline Stream */}
      {!hasEvents ? (
        <div className="py-12 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl">
          <EmptyState
            icon={<RiHistoryLine />}
            title="No activity recorded"
            description="Actions performed across tasks, boards, and workspaces will appear here automatically."
          />
        </div>
      ) : (
        <div className="space-y-8">
          <ActivityGroup title="Today" activities={groupedActivities.today} />
          <ActivityGroup title="Yesterday" activities={groupedActivities.yesterday} />
          <ActivityGroup title="Earlier" activities={groupedActivities.earlier} />
        </div>
      )}
    </div>
  );
}
