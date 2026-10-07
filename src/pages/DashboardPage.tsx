/**
 * DashboardPage.tsx — Fully composable, production-ready Dashboard page.
 *
 * Single Responsibility: Pure composition container assembling independent dashboard widgets.
 * Follows SOLID principles: Zero business math inside DashboardPage — all metrics and
 * visualization logic live in decoupled widget components under @/components/dashboard/.
 */
import { useState, useEffect, useMemo } from 'react';
import { useTaskStore } from '@/store/taskStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useBoardStore } from '@/store/boardStore';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useAnalytics } from '@/hooks/useAnalytics';
import { activityRepository } from '@/repositories';
import { isToday } from 'date-fns';
import type { Activity } from '@/types/activity.types';

import {
  DashboardHeader,
  OverviewCards,
  WeeklyProgressChart,
  PriorityDistributionChart,
  UpcomingDeadlines,
  RecentActivityWidget,
  SmartProductivityPanel,
  DashboardSkeleton,
} from '@/components/dashboard';

import { TaskModal } from '@/components/modals/TaskModal';

export default function DashboardPage() {
  // ── Subscriptions to Zustand Stores & Hooks ─────────────────────────────
  const allTasks = useTaskStore((s) => s.allTasks);
  const selectedTaskId = useTaskStore((s) => s.selectedTaskId);
  const setSelectedTask = useTaskStore((s) => s.setSelectedTask);
  const updateTask = useTaskStore((s) => s.updateTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const completeTask = useTaskStore((s) => s.completeTask);
  const reopenTask = useTaskStore((s) => s.reopenTask);
  const addComment = useTaskStore((s) => s.addComment);
  const deleteComment = useTaskStore((s) => s.deleteComment);
  const updateChecklist = useTaskStore((s) => s.updateChecklist);
  const isTasksLoading = useTaskStore((s) => s.isLoading);

  const { activeWorkspace } = useWorkspace();
  const workspaces = useWorkspaceStore((s) => s.workspaces);

  const boards = useBoardStore((s) => s.boards);
  const activeBoardId = useBoardStore((s) => s.activeBoardId);
  const isBoardLoading = useBoardStore((s) => s.isLoading);

  const { data, suggestions, productivityScore } = useAnalytics();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [isActivitiesLoading, setIsActivitiesLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    const loadActivities = async () => {
      try {
        const list = await activityRepository.findAllAsync();
        if (isMounted) {
          setActivities(list);
          setIsActivitiesLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error('[DashboardPage] Failed to load activities:', err);
          setActivities([]);
          setIsActivitiesLoading(false);
        }
      }
    };

    void loadActivities();

    return () => {
      isMounted = false;
    };
  }, [allTasks]);

  // ── Derived Reactive Metrics ─────────────────────────────────────────────
  const stats = useMemo(() => {
    const now = new Date();
    const completedTasks = allTasks.filter((t) => t.completedAt !== null).length;
    const inProgressTasks = allTasks.filter((t) => t.completedAt === null).length;
    const overdueTasks = allTasks.filter(
      (t) => t.dueDate !== null && t.completedAt === null && new Date(t.dueDate) < now,
    ).length;
    const dueTodayTasks = allTasks.filter(
      (t) => t.dueDate !== null && t.completedAt === null && isToday(new Date(t.dueDate)),
    ).length;

    return {
      totalTasks: allTasks.length,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      dueTodayTasks,
      activeBoardsCount: boards.length,
      activeWorkspacesCount: workspaces.length,
      productivityScore,
    };
  }, [allTasks, boards.length, workspaces.length, productivityScore]);

  const activeBoard = useMemo(() => {
    return boards.find((b) => b.id === activeBoardId);
  }, [boards, activeBoardId]);

  const selectedTask = useMemo(() => {
    if (!selectedTaskId) return null;
    return allTasks.find((t) => t.id === selectedTaskId) ?? null;
  }, [selectedTaskId, allTasks]);

  const createdThisWeek = useMemo(
    () => data.weeklyTrend.reduce((sum, d) => sum + d.created, 0),
    [data.weeklyTrend],
  );
  const completedThisWeek = useMemo(
    () => data.weeklyTrend.reduce((sum, d) => sum + d.completed, 0),
    [data.weeklyTrend],
  );
  const completionRateThisWeek = useMemo(
    () => (createdThisWeek > 0 ? Math.round((completedThisWeek / createdThisWeek) * 100) : 0),
    [createdThisWeek, completedThisWeek],
  );

  // ── Loading Skeleton State ──────────────────────────────────────────────
  if (isTasksLoading || isBoardLoading || isActivitiesLoading) {
    return <DashboardSkeleton />;
  }

  // ── Composed Dashboard View ─────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8 max-w-7xl mx-auto pb-16">
      {/* 1. Header Widget */}
      <DashboardHeader
        workspaceName={activeWorkspace?.name}
        activeBoardName={activeBoard?.name}
        activeBoardId={activeBoardId}
        totalTasksCount={stats.totalTasks}
        completedTasksCount={stats.completedTasks}
      />

      {/* 2. Overview Stats Cards Widget */}
      <OverviewCards stats={stats} />

      {/* 3. Middle Section: Weekly Progress + Priority Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WeeklyProgressChart
          trend={data.weeklyTrend}
          createdThisWeek={createdThisWeek}
          completedThisWeek={completedThisWeek}
          completionRateThisWeek={completionRateThisWeek}
        />
        <PriorityDistributionChart
          byPriority={data.byPriority}
          totalTasks={stats.totalTasks}
        />
      </div>

      {/* 4. Bottom Section: Upcoming Deadlines, Recent Activity, Smart Productivity */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <UpcomingDeadlines
          tasks={allTasks}
          onSelectTask={(id) => setSelectedTask(id)}
        />
        <RecentActivityWidget activities={activities} />
        <SmartProductivityPanel
          suggestions={suggestions}
          productivityScore={productivityScore}
          totalTasksCount={stats.totalTasks}
          overdueCount={stats.overdueTasks}
        />
      </div>

      {/* 5. Task Detail Modal (rendered when a task is selected) */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={(id, data) => void updateTask(id, data)}
          onDelete={(id) => {
            void deleteTask(id);
            setSelectedTask(null);
          }}
          onComplete={(id) => void completeTask(id)}
          onReopen={(id) => void reopenTask(id)}
          onAddComment={(id, text) => void addComment(id, text)}
          onDeleteComment={(id, cId) => void deleteComment(id, cId)}
          onUpdateChecklist={(id, items) => void updateChecklist(id, items)}
        />
      )}
    </div>
  );
}
