import { useState, useEffect } from 'react';
import { activityRepository } from '@/repositories';
import type { Activity } from '@/types/activity.types';

export interface UseTaskActivitiesReturn {
  activities: Activity[];
}

export function useTaskActivities(taskId: string | null): UseTaskActivitiesReturn {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    let isMounted = true;
    if (taskId) {
      activityRepository.findByTaskAsync(taskId).then((list) => {
        if (isMounted) setActivities(list);
      }).catch(() => {
        if (isMounted) setActivities([]);
      });
    }

    return () => {
      isMounted = false;
    };
  }, [taskId]);

  return { activities: taskId ? activities : [] };
}
