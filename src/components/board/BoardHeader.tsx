import { useState, useRef, useEffect } from 'react';
import { RiMoreLine, RiDeleteBinLine, RiEdit2Line } from 'react-icons/ri';
import { Button } from '@/components/common/Button';
import { cn } from '@/utils/cn';
import type { Board } from '@/types/board.types';

interface BoardHeaderProps {
  board: Board;
  onRename: (name: string) => void;
  onDelete: () => void;
}

export function BoardHeader({ board, onRename, onDelete }: BoardHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(board.name);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [prevBoardName, setPrevBoardName] = useState(board.name);
  if (prevBoardName !== board.name) {
    setPrevBoardName(board.name);
    setEditValue(board.name);
  }
  useEffect(() => { if (editing) inputRef.current?.select(); }, [editing]);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const commit = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== board.name) onRename(trimmed);
    else setEditValue(board.name);
    setEditing(false);
  };

  return (
    <div className="flex items-center gap-3 px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
      {/* Colour dot */}
      {board.color && (
        <span
          className="h-3 w-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: board.color }}
          aria-hidden="true"
        />
      )}

      {editing ? (
        <input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') { setEditValue(board.name); setEditing(false); }
          }}
          className={cn(
            'text-lg font-bold rounded px-1 py-0.5 flex-1 min-w-0',
            'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100',
            'focus:outline-none focus:ring-2 focus:ring-blue-500',
          )}
          aria-label="Rename board"
        />
      ) : (
        <h1
          className="text-lg font-bold text-zinc-900 dark:text-zinc-100 truncate flex-1 min-w-0 cursor-default"
          onDoubleClick={() => setEditing(true)}
          title={board.name}
        >
          {board.name}
        </h1>
      )}

      {/* Context menu */}
      <div className="relative ml-auto flex-shrink-0" ref={menuRef}>
        <Button
          variant="ghost"
          size="xs"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Board options"
          aria-expanded={menuOpen}
        >
          <RiMoreLine size={15} />
        </Button>

        {menuOpen && (
          <div className={cn(
            'absolute right-0 top-full mt-1 z-20 w-40',
            'rounded-lg border border-zinc-200 dark:border-zinc-700',
            'bg-white dark:bg-zinc-900 shadow-card py-1',
          )}>
            <button
              onClick={() => { setEditing(true); setMenuOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            >
              <RiEdit2Line size={13} /> Rename board
            </button>
            <button
              onClick={() => { onDelete(); setMenuOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <RiDeleteBinLine size={13} /> Delete board
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
