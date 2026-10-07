import { useState, useRef, useEffect, memo } from 'react';
import { RiMoreLine, RiDeleteBinLine, RiEdit2Line } from 'react-icons/ri';
import { Badge } from '@/components/common/Badge';
import { cn } from '@/utils/cn';

interface ColumnHeaderProps {
  name: string;
  taskCount: number;
  onRename: (newName: string) => void;
  onDelete: () => void;
}

export const ColumnHeader = memo(function ColumnHeader({
  name,
  taskCount,
  onRename,
  onDelete,
}: ColumnHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const commitRename = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== name) onRename(trimmed);
    else setEditValue(name);
    setEditing(false);
  };

  return (
    <div className="flex items-center gap-2 px-3 pt-3 pb-2">
      {editing ? (
        <input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitRename();
            if (e.key === 'Escape') { setEditValue(name); setEditing(false); }
          }}
          className={cn(
            'flex-1 min-w-0 text-sm font-semibold rounded px-1 py-0.5',
            'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100',
            'focus:outline-none focus:ring-2 focus:ring-blue-500',
          )}
          aria-label="Rename column"
        />
      ) : (
        <span
          className="flex-1 min-w-0 text-sm font-semibold text-zinc-700 dark:text-zinc-300 truncate cursor-default"
          onDoubleClick={() => setEditing(true)}
          title={name}
        >
          {name}
        </span>
      )}

      <Badge variant="default" size="sm">{taskCount}</Badge>

      {/* Context menu */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={`Column options for ${name}`}
          aria-expanded={menuOpen}
          className="h-6 w-6 flex items-center justify-center rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <RiMoreLine size={14} />
        </button>

        {menuOpen && (
          <div
            className={cn(
              'absolute right-0 top-full mt-1 z-20 w-36',
              'rounded-lg border border-zinc-200 dark:border-zinc-700',
              'bg-white dark:bg-zinc-900 shadow-card py-1',
            )}
          >
            <button
              onClick={() => { setEditing(true); setMenuOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            >
              <RiEdit2Line size={13} /> Rename
            </button>
            <button
              onClick={() => { onDelete(); setMenuOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <RiDeleteBinLine size={13} /> Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
});
