/**
 * useSearch — debounced global search across all tasks in the in-memory index.
 *
 * Reads from taskStore.allTasks — NO storage access.
 * Enriches results with board/workspace/column context from board and workspace stores.
 * Debounce duration: TIMING.SEARCH_DEBOUNCE_MS (150ms).
 */
import { useState, useEffect, useMemo } from 'react';
import { useTaskStore } from '@/store/taskStore';
import { useBoardStore } from '@/store/boardStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { TIMING } from '@/config/constants';
import type { SearchResult } from '@/types/common.types';

export interface UseSearchReturn {
  results: SearchResult[];
  isSearching: boolean;
  query: string;
}

export function useSearch(query: string): UseSearchReturn {
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const allTasks = useTaskStore((s) => s.allTasks);
  const columns = useBoardStore((s) => s.columns);
  const boards = useBoardStore((s) => s.boards);
  const workspaces = useWorkspaceStore((s) => s.workspaces);

  const [prevQuery, setPrevQuery] = useState(query);
  if (prevQuery !== query) {
    setPrevQuery(query);
    if (!query.trim()) {
      setDebouncedQuery('');
      setIsSearching(false);
    } else {
      setIsSearching(true);
    }
  }

  // Debounce non-empty query
  useEffect(() => {
    if (!query.trim()) return;
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
      setIsSearching(false);
    }, TIMING.SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  // Pre-build lookup maps for O(1) enrichment
  const boardMap = useMemo(
    () => new Map(boards.map((b) => [b.id, b])),
    [boards],
  );
  const workspaceMap = useMemo(
    () => new Map(workspaces.map((w) => [w.id, w])),
    [workspaces],
  );
  const columnMap = useMemo(
    () => new Map(columns.map((c) => [c.id, c])),
    [columns],
  );

  const results = useMemo((): SearchResult[] => {
    if (!debouncedQuery) return [];

    const lower = debouncedQuery.toLowerCase();

    const matched = allTasks.filter(
      (t) =>
        t.title.toLowerCase().includes(lower) ||
        (t.description?.toLowerCase().includes(lower) ?? false),
    );

    // Sort: title starts-with match ranked above contains
    const scored = matched.map((t) => ({
      task: t,
      score: t.title.toLowerCase().startsWith(lower) ? 0 : 1,
    }));
    scored.sort((a, b) => a.score - b.score);

    return scored.map(({ task }) => ({
      taskId: task.id,
      taskTitle: task.title,
      taskPriority: task.priority,
      boardId: task.boardId,
      boardName: boardMap.get(task.boardId)?.name ?? 'Unknown Board',
      workspaceId: task.workspaceId,
      workspaceName: workspaceMap.get(task.workspaceId)?.name ?? 'Unknown Workspace',
      columnId: task.columnId,
      columnName: columnMap.get(task.columnId)?.name ?? 'Unknown Column',
    }));
  }, [debouncedQuery, allTasks, boardMap, workspaceMap, columnMap]);

  return { results, isSearching, query };
}
