import React, { useState, useRef, useId } from 'react';
import { cn } from '@/utils/cn';

export interface TooltipProps {
  content: string;
  children: React.ReactElement;
  side?: 'top' | 'bottom' | 'left' | 'right';
  disabled?: boolean;
}

const sideClasses = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
  left: 'right-full top-1/2 -translate-y-1/2 mr-1.5',
  right: 'left-full top-1/2 -translate-y-1/2 ml-1.5',
};

export function Tooltip({ content, children, side = 'top', disabled = false }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const id = useId();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (disabled) return children;

  const show = () => {
    timeoutRef.current = setTimeout(() => setVisible(true), 300);
  };
  const hide = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(false);
  };

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {React.cloneElement(children as React.ReactElement<{ 'aria-describedby'?: string }>, {
        'aria-describedby': visible ? id : undefined,
      })}
      {visible && (
        <span
          id={id}
          role="tooltip"
          className={cn(
            'absolute z-50 whitespace-nowrap rounded-md px-2 py-1',
            'text-xs font-medium',
            'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900',
            'pointer-events-none animate-in fade-in-0 zoom-in-95 duration-100',
            sideClasses[side],
          )}
        >
          {content}
        </span>
      )}
    </span>
  );
}
