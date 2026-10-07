/**
 * StorageService — thin JSON read/write utility.
 *
 * This is the ONLY module in the application that touches localStorage directly.
 * It is used exclusively by Repository implementations — never by stores,
 * services, hooks, or UI components.
 *
 * The namespace prefix ('taskflow:') is applied internally so callers
 * always use short, readable key names (e.g., 'tasks', 'boards').
 */

export interface IStorageService {
  /** Retrieve a typed value by key. Returns null if missing or unreadable. */
  get<T>(key: string): T | null;
  /** Persist a typed value by key. Fails silently on QuotaExceededError. */
  set<T>(key: string, value: T): void;
  /** Remove a single key. */
  remove(key: string): void;
  /** Remove all keys under the 'taskflow:' namespace. */
  clear(): void;
}

const NAMESPACE = 'taskflow';

class LocalStorageService implements IStorageService {
  private toNamespacedKey(key: string): string {
    return `${NAMESPACE}:${key}`;
  }

  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(this.toNamespacedKey(key));
      if (raw === null) return null;
      return JSON.parse(raw) as T;
    } catch (err) {
      console.error(`[StorageService] Failed to read key "${key}"`, err);
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(this.toNamespacedKey(key), JSON.stringify(value));
    } catch (err) {
      // Guard against QuotaExceededError — app continues with in-memory state
      if (err instanceof DOMException && err.name === 'QuotaExceededError') {
        console.error(
          `[StorageService] Quota exceeded writing "${key}". Changes may not be saved.`,
        );
      } else {
        console.error(`[StorageService] Failed to write key "${key}"`, err);
      }
    }
  }

  remove(key: string): void {
    localStorage.removeItem(this.toNamespacedKey(key));
  }

  clear(): void {
    const prefix = `${NAMESPACE}:`;
    Object.keys(localStorage)
      .filter((k) => k.startsWith(prefix))
      .forEach((k) => localStorage.removeItem(k));
  }
}

/** Singleton instance shared by all repository implementations. */
export const storageService: IStorageService = new LocalStorageService();
