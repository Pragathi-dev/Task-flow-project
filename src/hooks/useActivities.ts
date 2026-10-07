import { useState, useEffect, useMemo } from 'react';
import { isToday, isYesterday, parseISO } from 'date-fns';
import { activityRepository } from '@/repositories';
import { useTaskStore } from '@/store/taskStore';
import type { Activity } from '@/types/activity.types';

export type ActivityCategoryFilter = 'all' | 'tasks' | 'boards' | 'workspaces';

export interface GroupedActivities {
  today: Activity[];
  yesterday: Activity[];
  earlier: Activity[];
}

export interface UseActivitiesReturn {
  activities: Activity[];
  groupedActivities: GroupedActivities;
  categoryFilter: ActivityCategoryFilter;
  setCategoryFilter: (filter: ActivityCategoryFilter) => void;
  selectedWorkspaceId: string | null;
  setSelectedWorkspaceId: (id: string | null) => void;
  totalCount: number;
}

export function useActivities(): UseActivitiesReturn {
  const allTasks = useTaskStore((s) => s.allTasks);
  const [categoryFilter, setCategoryFilter] = useState<ActivityCategoryFilter>('all');
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [rawActivities, setRawActivities] = useState<Activity[]>([]);

  useEffect(() => {
    let isMounted = true;
    activityRepository.findAllAsync().then((list) => {
      if (isMounted) setRawActivities(list);
    }).catch(() => {
      if (isMounted) setRawActivities([]);
    });

    return () => {
      isMounted = false;
    };
  }, [allTasks]);

  const filteredActivities = useMemo(() => {
    let list = rawActivities;

    if (selectedWorkspaceId) {
      list = list.filter((act) => act.workspaceId === selectedWorkspaceId);
    }

    if (categoryFilter === 'tasks') {
      list = list.filter((act) => act.eventType.startsWith('task_'));
    } else if (categoryFilter === 'boards') {
      list = list.filter(
        (act) => act.eventType.startsWith('board_') || act.eventType.startsWith('column_'),
      );
    } else if (categoryFilter === 'workspaces') {
      list = list.filter((act) => act.eventType.startsWith('workspace_'));
    }

    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [rawActivities, categoryFilter, selectedWorkspaceId]);

  const groupedActivities = useMemo((): GroupedActivities => {
    const today: Activity[] = [];
    const yesterday: Activity[] = [];
    const earlier: Activity[] = [];

    for (const act of filteredActivities) {
      const date = parseISO(act.timestamp);
      if (isToday(date)) {
        today.push(act);
      } else if (isYesterday(date)) {
        yesterday.push(act);
      } else {
        earlier.push(act);
      }
    }

    return { today, yesterday, earlier };
  }, [filteredActivities]);

  return {
    activities: filteredActivities,
    groupedActivities,
    categoryFilter,
    setCategoryFilter,
    selectedWorkspaceId,
    setSelectedWorkspaceId,
    totalCount: filteredActivities.length,
  };
}
