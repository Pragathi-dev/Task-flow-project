import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { RiSearchLine, RiCloseLine } from 'react-icons/ri';
import { useSearch } from '@/hooks/useSearch';
import { useTaskStore } from '@/store/taskStore';
import { priorityToBadgeClass, priorityToLabel } from '@/utils/priorityUtils';
import { cn } from '@/utils/cn';

interface SearchBarProps {
  className?: string;
}

export function SearchBar({ className }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const setSelectedTask = useTaskStore((s) => s.setSelectedTask);

  const { results, isSearching } = useSearch(query);

  const close = useCallback(() => {
    setOpen(false);
    setFocusedIndex(-1);
  }, []);

  const clear = useCallback(() => {
    setQuery('');
    close();
    inputRef.current?.focus();
  }, [close]);

  const selectResult = useCallback(
    (index: number) => {
      const result = results[index];
      if (!result) return;
      close();
      setQuery('');
      navigate(`/board/${result.boardId}`);
      setTimeout(() => setSelectedTask(result.taskId), 50);
    },
    [results, close, navigate, setSelectedTask],
  );

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        !inputRef.current?.contains(e.target as Node) &&
        !dropdownRef.current?.contains(e.target as Node)
      ) {
        close();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [close]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && focusedIndex >= 0) {
      e.preventDefault();
      selectResult(focusedIndex);
    } else if (e.key === 'Escape') {
      close();
    }
  };

  return (
    <div className={cn('relative', className)}>
      <div className="relative flex items-center">
        <RiSearchLine
          size={15}
          className="absolute left-3 text-zinc-400 pointer-events-none"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(e.target.value.length > 0);
            setFocusedIndex(-1);
          }}
          onFocus={() => query && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search tasks…"
          aria-label="Search tasks"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-autocomplete="list"
          autoComplete="off"
          className={cn(
            'h-8 w-48 sm:w-64 rounded-lg border text-sm pl-8 pr-7',
            'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400',
            'dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100 dark:placeholder:text-zinc-500',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            'transition-all duration-150',
          )}
        />
        {query && (
          <button
            onClick={clear}
            aria-label="Clear search"
            className="absolute right-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            <RiCloseLine size={15} />
          </button>
        )}
      </div>

      {open && (
        <div
          ref={dropdownRef}
          role="listbox"
          aria-label="Search results"
          className={cn(
            'absolute top-full left-0 mt-1 w-80 z-50',
            'rounded-xl border border-zinc-200 dark:border-zinc-700',
            'bg-white dark:bg-zinc-900 shadow-modal',
            'max-h-72 overflow-y-auto',
          )}
        >
          {isSearching && (
            <div className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
              Searching…
            </div>
          )}

          {!isSearching && results.length === 0 && query.length > 0 && (
            <div className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
              No results for "{query}"
            </div>
          )}

          {!isSearching &&
            results.slice(0, 8).map((r, i) => (
              <button
                key={r.taskId}
                role="option"
                aria-selected={i === focusedIndex}
                onClick={() => selectResult(i)}
                onMouseEnter={() => setFocusedIndex(i)}
                className={cn(
                  'w-full text-left px-4 py-2.5 flex flex-col gap-0.5',
                  'transition-colors duration-100',
                  i === focusedIndex
                    ? 'bg-zinc-50 dark:bg-zinc-800'
                    : 'hover:bg-zinc-50 dark:hover:bg-zinc-800',
                  i > 0 && 'border-t border-zinc-100 dark:border-zinc-800',
                )}
              >
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                  {r.taskTitle}
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-zinc-400 dark:text-zinc-500 truncate">
                    {r.workspaceName} · {r.boardName} · {r.columnName}
                  </span>
                  <span
                    className={cn(
                      'text-xs px-1.5 py-0.5 rounded-full font-medium',
                      priorityToBadgeClass(r.taskPriority),
                    )}
                  >
                    {priorityToLabel(r.taskPriority)}
                  </span>
                </div>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
