/**
 * useAnalytics — derives analytics data and productivity suggestions
 * directly from the in-memory task store.
 *
 * No separate analyticsStore. Data is always fresh because it's computed
 * via useMemo on [allTasks] — Zustand creates a new array reference on every mutation.
 */
import { useState, useEffect, useMemo } from 'react';
import { useTaskStore } from '@/store/taskStore';
import { activityRepository } from '@/repositories';
import { analyticsService } from '@/services/AnalyticsService';
import { evaluateAllRules } from '@/utils/productivityUtils';
import type { AnalyticsData } from '@/types/analytics.types';
import type { ProductivitySuggestion } from '@/types/productivity.types';
import type { Activity } from '@/types/activity.types';

export interface UseAnalyticsReturn {
  data: AnalyticsData;
  suggestions: ProductivitySuggestion[];
  productivityScore: number;
  selectedWorkspaceId: string | null;
  setSelectedWorkspace: (id: string | null) => void;
  isLoading?: boolean;
  error?: Error | null;
}

export function useAnalytics(): UseAnalyticsReturn {
  const allTasks = useTaskStore((s) => s.allTasks);
  const [selectedWorkspaceId, setSelectedWorkspace] = useState<string | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadActivities = async () => {
      try {
        const list = await activityRepository.findAllAsync();
        if (isMounted) {
          setActivities(list);
          setError(null);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error('[useAnalytics] Failed to load activities:', err);
          setError(err instanceof Error ? err : new Error('Failed to load activities'));
          setActivities([]);
          setIsLoading(false);
        }
      }
    };

    void loadActivities();

    return () => {
      isMounted = false;
    };
  }, [allTasks]);

  // Scope tasks to the selected workspace (null = all workspaces)
  const scopedTasks = useMemo(
    () =>
      selectedWorkspaceId
        ? allTasks.filter((t) => t.workspaceId === selectedWorkspaceId)
        : allTasks,
    // [allTasks] not [allTasks.length] — catches content changes too (Design fix #9)
    [allTasks, selectedWorkspaceId],
  );

  const data = useMemo(() => {
    const base = analyticsService.compute(scopedTasks);
    const weeklyTrend = analyticsService.computeWeeklyTrend(activities);
    return { ...base, weeklyTrend };
  }, [scopedTasks, activities]);

  const suggestions = useMemo(
    () => evaluateAllRules(allTasks, new Date()),
    [allTasks],
  );

  const productivityScore = useMemo(() => {
    if (allTasks.length === 0) return 0;
    const scoreEntry = suggestions.find((s) => s.type === 'productivity_score');
    if (!scoreEntry) return 0;
    const match = scoreEntry.title.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }, [suggestions, allTasks.length]);

  return {
    data,
    suggestions,
    productivityScore,
    selectedWorkspaceId,
    setSelectedWorkspace,
    isLoading,
    error,
  };
}
