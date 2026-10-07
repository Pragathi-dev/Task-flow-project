/**
 * cn — className merge utility.
 * Combines clsx (conditional classes) with tailwind-merge (dedup Tailwind classes).
 *
 * Usage:
 *   cn('px-2 py-1', isActive && 'bg-primary', className)
 */
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
