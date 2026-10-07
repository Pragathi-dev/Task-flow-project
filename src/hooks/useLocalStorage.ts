/**
 * useLocalStorage — generic typed hook for reading/writing individual
 * localStorage keys outside the domain service layer.
 *
 * Uses storageService so the app never touches localStorage directly from hooks.
 * SSR-safe: guarded against missing window.
 */
import { useState, useCallback } from 'react';
import { storageService } from '@/services/StorageService';

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    return storageService.get<T>(key) ?? initialValue;
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const next = typeof value === 'function'
          ? (value as (prev: T) => T)(prev)
          : value;
        storageService.set(key, next);
        return next;
      });
    },
    [key],
  );

  return [storedValue, setValue];
}
