/**
 * AnalyticsPage.tsx — Full analytics and productivity metrics page view.
 *
 * Single Responsibility: Composition container for the analytics dashboard widgets.
 * Leverages useAnalytics() and AnalyticsService — no duplicated business logic.
 */
import { useAnalytics } from '@/hooks/useAnalytics';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useTaskStore } from '@/store/taskStore';
import {
  AnalyticsHeader,
  AnalyticsOverviewCards,
  CompletionTrendChart,
  PriorityBreakdownChart,
  WorkloadChart,
  ProductivityInsightsPanel,
  AnalyticsSkeleton,
} from '@/components/analytics';

export default function AnalyticsPage() {
  const {
    data,
    suggestions,
    productivityScore,
    selectedWorkspaceId,
    setSelectedWorkspace,
  } = useAnalytics();

  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const isLoading = useTaskStore((s) => s.isLoading);

  if (isLoading) {
    return <AnalyticsSkeleton />;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8 max-w-7xl mx-auto pb-16">
      {/* 1. Header Widget with Workspace Selector */}
      <AnalyticsHeader
        selectedWorkspaceId={selectedWorkspaceId}
        onSelectWorkspace={setSelectedWorkspace}
        workspaces={workspaces}
        totalTasksCount={data.totalTasks}
      />

      {/* 2. Overview Metrics Cards */}
      <AnalyticsOverviewCards data={data} />

      {/* 3. Trend & Priority Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CompletionTrendChart trend={data.weeklyTrend} />
        <PriorityBreakdownChart
          byPriority={data.byPriority}
          totalTasks={data.totalTasks}
        />
      </div>

      {/* 4. Workload Breakdown & Productivity Rule Suggestions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WorkloadChart
          byColumn={data.byColumn}
          totalTasks={data.totalTasks}
        />
        <ProductivityInsightsPanel
          suggestions={suggestions}
          productivityScore={productivityScore}
        />
      </div>
    </div>
  );
}
