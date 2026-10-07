# TaskFlow — Technical Design Document

> **Status:** v2.0 (Principal Architect Review)  
> **Audience:** Senior Engineers, Technical Reviewers  
> **Stack:** React 19 · TypeScript · Vite · Tailwind CSS · Zustand · React Router v6 · React Hook Form · Zod · Framer Motion · @hello-pangea/dnd · date-fns · uuid

---

## Architectural Review Summary

All issues below were identified during a principal-level review of the v1.0 draft and resolved before implementation begins.

| # | Area | Issue Found | Fix Applied |
|---|------|-------------|-------------|
| 1 | Storage / Service Layer | `IStorageService` generic `get/set` is a bad fit for REST migration; forces client-side filtering forever | Replaced with per-entity `Repository` interfaces (`ITaskRepository`, `IBoardRepository`, etc.); `StorageService` becomes an internal JSON utility only |
| 2 | Zustand Stores | `analyticsStore` duplicates task data with its own load cycle, creating two sources of truth | Removed `analyticsStore`; `useAnalytics()` derives data from `taskStore.tasks` via `useMemo` |
| 3 | Stores / Storage | `workspaceStore.setActiveWorkspace()` calls `storageService` directly, violating the layered architecture | Introduced `preferencesStore` using Zustand `persist` middleware; store calls `preferencesStore`, never `storageService` |
| 4 | Types | All 20+ types in one `index.ts` monolith | Split into 8 domain-scoped type files; `index.ts` re-exports for backward compatibility |
| 5 | Data Model | `Task.activities: Activity[]` is denormalised; activities stored both inline and globally, creating dual writes | Removed `activities` from `Task`; activities are global-only; `TaskModal` fetches via `useTaskActivities(taskId)` |
| 6 | Hooks | `useSearch` reads from `localStorage` directly, bypassing the store | `taskStore` loads ALL tasks across all workspaces on init; `useSearch` works from the in-memory store index |
| 7 | Error Handling | No React Error Boundary strategy; one broken component crashes the entire board view | Added `ErrorBoundary` and `BoardErrorBoundary` components; wrapping strategy defined at board, column, and page level |
| 8 | Validation | Zod schemas mentioned but no defined location in the codebase | Added `src/schemas/` folder; schemas are co-located by domain, types derived from schemas via `z.infer` |
| 9 | Hooks | `useEffect` dependency `[tasks.length]` misses task-content changes | Changed dependency to `[tasks]`; Zustand creates new array references on mutation so reference equality is safe |
| 10 | Constants | Magic numbers scattered throughout (limits, timings, storage keys) | Added `src/config/constants.ts` with `APP_LIMITS`, `TIMING`, and `STORAGE_KEYS` |

---

## Table of Contents

1. [Overall Architecture](#1-overall-architecture)
2. [Folder Structure](#2-folder-structure)
3. [TypeScript Models](#3-typescript-models)
4. [Storage Layer Schema](#4-storage-layer-schema)
5. [Service Layer Design](#5-service-layer-design)
6. [Zustand Store Design](#6-zustand-store-design)
7. [Custom Hooks Design](#7-custom-hooks-design)
8. [Component Hierarchy](#8-component-hierarchy)
9. [Routing Design](#9-routing-design)
10. [Data Flow](#10-data-flow)
11. [Smart Productivity Assistant](#11-smart-productivity-assistant-design)
12. [Analytics Design](#12-analytics-design-no-external-charts-library)
13. [Performance Strategy](#13-performance-strategy)
14. [Accessibility Strategy](#14-accessibility-strategy)
15. [Responsive Strategy](#15-responsive-strategy)
16. [Animation Strategy](#16-animation-strategy)
17. [Error Handling Strategy](#17-error-handling-strategy)
18. [Constants & Configuration](#18-constants--configuration)
19. [Zod Schema Design](#19-zod-schema-design)
20. [Future Backend Integration Plan](#20-future-backend-integration-plan)

---

## 1. Overall Architecture

### Layered Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     UI Components                           │
│   (React 19 · Tailwind CSS · Framer Motion · dnd)          │
└────────────────────────┬────────────────────────────────────┘
                         │ reads state via selectors
                         │ dispatches actions
┌────────────────────────▼────────────────────────────────────┐
│                   Zustand Stores                            │
│   workspaceStore · boardStore · taskStore                   │
│   themeStore · preferencesStore                             │
└────────────────────────┬────────────────────────────────────┘
                         │ calls service methods
┌────────────────────────▼────────────────────────────────────┐
│                   Service Layer                             │
│   WorkspaceService · BoardService · TaskService             │
│   AnalyticsService · ActivityService                        │
└────────────────────────┬────────────────────────────────────┘
                         │ calls repository methods
┌────────────────────────▼────────────────────────────────────┐
│                  Repository Layer                           │
│   ITaskRepository · IBoardRepository · IWorkspaceRepository │
│   IActivityRepository · IPreferencesRepository              │
└────────────────────────┬────────────────────────────────────┘
                         │ uses StorageService for JSON I/O
┌────────────────────────▼────────────────────────────────────┐
│              StorageService (thin JSON utility)             │
│                 LocalStorageService                         │
└────────────────────────┬────────────────────────────────────┘
                         │ JSON.stringify / JSON.parse
┌────────────────────────▼────────────────────────────────────┐
│                    localStorage                             │
└─────────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

| Layer | Responsibility |
|-------|---------------|
| **UI Components** | Render state, capture user events, delegate to hooks/stores. No business logic. |
| **Zustand Stores** | Hold application state. Orchestrate calls to the Service Layer. Expose fine-grained selectors. |
| **Service Layer** | Encapsulate all domain business logic: validation, ID generation, timestamp assignment, activity recording, cascading deletes. |
| **Repository Layer** | Per-entity persistence contracts. `LocalStorage*Repository` implementations use `StorageService` internally. Future `Api*Repository` implementations use `fetch`. |
| **StorageService** | Thin JSON read/write utility. Used only by repositories — never called directly by stores or services. |
| **localStorage** | Browser-native key-value store. Replaceable via repository substitution. |

### Why the Repository Pattern Enables Real REST Migration

**Fix for Issue 1.** The original `IStorageService` had `get<T>(key: string): T | null` and `set<T>(key: string, value: T): void`. This is a key-value abstraction — it maps fine to localStorage but is a fundamentally broken abstraction for REST. A REST API does not have a generic `GET /tasks`; it has `GET /tasks?boardId=xyz&page=1&limit=50`. The old design forced permanent client-side filtering even with a real backend.

The Repository Pattern fixes this at the correct layer. Each repository interface is domain-specific:

```typescript
interface ITaskRepository {
  findAll(boardId: string): Task[];
  findAllAcrossWorkspaces(): Task[];   // used by taskStore for global index
  findById(id: string): Task | null;
  save(task: Task): void;
  delete(id: string): void;
}

interface IBoardRepository {
  findAll(workspaceId: string): Board[];
  findById(id: string): Board | null;
  save(board: Board): void;
  delete(id: string): void;
}

interface IWorkspaceRepository {
  findAll(): Workspace[];
  findById(id: string): Workspace | null;
  save(workspace: Workspace): void;
  delete(id: string): void;
}

interface IActivityRepository {
  findAll(): Activity[];
  findByTask(taskId: string): Activity[];
  findByWorkspace(workspaceId: string): Activity[];
  save(activity: Activity): void;
  deleteByEntity(entityId: string): void;
}

interface IPreferencesRepository {
  get(): UserPreferences;
  save(prefs: UserPreferences): void;
}
```

`LocalStorageTaskRepository` implements `ITaskRepository` using `StorageService` internally. A future `ApiTaskRepository` implements the same interface using `fetch` calls. Services receive repository instances. **Zero changes are required in the Service Layer, Stores, Hooks, or UI Components when swapping implementations.**

### Unidirectional Data Flow

```
User Interaction
      │
      ▼
  Component
  (event handler)
      │
      ▼
  Custom Hook
  (useBoard, useTasks, …)
      │
      ▼
  Zustand Action
  (store.createTask())
      │
      ▼
  Service Method
  (TaskService.create())
      │
      ▼
  Repository Method
  (taskRepository.save())
      │
      ▼
  StorageService.set()
      │
      ▼
  localStorage (persisted)
      │
      ▼  (store.tasks updated)
  Zustand selector
      │
      ▼
  Component re-renders
```

State never flows backward. Components never write to storage directly. Stores never bypass services. Services never call `StorageService` directly — they go through repositories.

### Zustand Selectors

Stores expose state through fine-grained selectors using Zustand's built-in shallow equality comparator. Components subscribe only to the exact slice they need, preventing unnecessary re-renders.

```typescript
// Granular selector — only re-renders when activeBoardId changes
const activeBoardId = useBoardStore((s) => s.activeBoardId);

// Structural selector with shallow equality — only re-renders when
// the array reference changes, not on unrelated state updates
const boards = useBoardStore(
  (s) => s.boards.filter((b) => b.workspaceId === activeWorkspaceId),
  shallow
);
```

---

## 2. Folder Structure

```
taskflow/
├── public/
│   └── favicon.svg
├── src/
│   ├── assets/
│   │   └── logo.svg
│   │
│   ├── config/
│   │   └── constants.ts             # APP_LIMITS, TIMING, STORAGE_KEYS (Issue 10)
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── TopBar.tsx
│   │   │
│   │   ├── navigation/
│   │   │   ├── NavWorkspaceList.tsx
│   │   │   ├── NavBoardList.tsx
│   │   │   └── MobileDrawer.tsx
│   │   │
│   │   ├── dashboard/
│   │   │   ├── StatCard.tsx
│   │   │   ├── StatsGrid.tsx
│   │   │   ├── RecentActivity.tsx
│   │   │   └── ProductivityBanner.tsx
│   │   │
│   │   ├── board/
│   │   │   ├── BoardView.tsx
│   │   │   ├── BoardHeader.tsx
│   │   │   ├── BoardToolbar.tsx
│   │   │   └── BoardEmptyState.tsx
│   │   │
│   │   ├── column/
│   │   │   ├── ColumnContainer.tsx
│   │   │   ├── ColumnHeader.tsx
│   │   │   └── ColumnAddButton.tsx
│   │   │
│   │   ├── task/
│   │   │   ├── TaskCard.tsx
│   │   │   ├── TaskBadge.tsx
│   │   │   ├── TaskPriorityIcon.tsx
│   │   │   ├── TaskDueDate.tsx
│   │   │   └── TaskProgress.tsx
│   │   │
│   │   ├── forms/
│   │   │   ├── TaskForm.tsx
│   │   │   ├── BoardForm.tsx
│   │   │   ├── WorkspaceForm.tsx
│   │   │   └── ColumnForm.tsx
│   │   │
│   │   ├── analytics/
│   │   │   ├── AnalyticsOverview.tsx
│   │   │   ├── TaskDistributionChart.tsx
│   │   │   ├── PriorityChart.tsx
│   │   │   ├── CompletionRateChart.tsx
│   │   │   ├── WeeklyProductivityChart.tsx
│   │   │   └── EstimatedVsCompletedChart.tsx
│   │   │
│   │   ├── modals/
│   │   │   ├── TaskModal.tsx
│   │   │   ├── ConfirmDialog.tsx
│   │   │   └── ModalPortal.tsx
│   │   │
│   │   └── common/
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Select.tsx
│   │       ├── Badge.tsx
│   │       ├── Avatar.tsx
│   │       ├── Tooltip.tsx
│   │       ├── Skeleton.tsx
│   │       ├── EmptyState.tsx
│   │       ├── SearchBar.tsx
│   │       ├── ThemeToggle.tsx
│   │       ├── ErrorBoundary.tsx        # Generic class-based error boundary (Issue 7)
│   │       └── BoardErrorBoundary.tsx   # Board/column-scoped boundary (Issue 7)
│   │
│   ├── hooks/
│   │   ├── useLocalStorage.ts
│   │   ├── useTheme.ts
│   │   ├── useWorkspace.ts
│   │   ├── useBoard.ts
│   │   ├── useTasks.ts
│   │   ├── useSearch.ts
│   │   ├── useAnalytics.ts
│   │   └── useTaskActivities.ts        # Fetches activities for a single task (Issue 5)
│   │
│   ├── pages/
│   │   ├── DashboardPage.tsx
│   │   ├── BoardPage.tsx
│   │   ├── AnalyticsPage.tsx
│   │   ├── ActivityPage.tsx
│   │   └── NotFoundPage.tsx
│   │
│   ├── repositories/                   # Repository interfaces + LocalStorage implementations (Issue 1)
│   │   ├── interfaces.ts               # ITaskRepository, IBoardRepository, etc.
│   │   ├── LocalStorageTaskRepository.ts
│   │   ├── LocalStorageBoardRepository.ts
│   │   ├── LocalStorageWorkspaceRepository.ts
│   │   ├── LocalStorageActivityRepository.ts
│   │   └── LocalStoragePreferencesRepository.ts
│   │
│   ├── services/
│   │   ├── StorageService.ts           # Thin JSON utility; used only by repositories
│   │   ├── WorkspaceService.ts
│   │   ├── BoardService.ts
│   │   ├── TaskService.ts
│   │   └── AnalyticsService.ts        # Pure computation utility; no store interaction (Issue 2)
│   │
│   ├── schemas/                        # Zod validation schemas (Issue 8)
│   │   ├── task.schema.ts
│   │   ├── board.schema.ts
│   │   ├── workspace.schema.ts
│   │   └── column.schema.ts
│   │
│   ├── store/
│   │   ├── workspaceStore.ts
│   │   ├── boardStore.ts
│   │   ├── taskStore.ts
│   │   ├── themeStore.ts
│   │   └── preferencesStore.ts         # Replaces scattered preference writes (Issue 3)
│   │
│   ├── types/                          # Split into domain-scoped files (Issue 4)
│   │   ├── workspace.types.ts
│   │   ├── board.types.ts
│   │   ├── task.types.ts
│   │   ├── activity.types.ts
│   │   ├── analytics.types.ts
│   │   ├── productivity.types.ts
│   │   ├── preferences.types.ts
│   │   ├── common.types.ts
│   │   └── index.ts                    # Re-exports everything for backward compatibility
│   │
│   ├── utils/
│   │   ├── dateUtils.ts
│   │   ├── priorityUtils.ts
│   │   ├── productivityUtils.ts
│   │   └── cn.ts
│   │
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
│
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── .eslintrc.cjs
├── package.json
└── README.md
```

### Folder Responsibilities

| Folder | Purpose |
|--------|---------|
| `config/` | Application-wide constants: limits, timing values, storage key names. Single source of truth for all magic numbers. |
| `components/` | All React components. Subdivided by domain. No direct store imports — use hooks instead. |
| `hooks/` | Thin adapters over Zustand stores. All store access goes through hooks; components stay decoupled from store internals. |
| `pages/` | Route-level components. Compose layout + domain components. Own route-specific effects. |
| `repositories/` | Repository interfaces and `LocalStorage*` implementations. Future `Api*` implementations drop in here. |
| `services/` | Business logic and domain operations. Generates IDs, sets timestamps, validates constraints, records activities, handles cascading deletes. |
| `schemas/` | Zod validation schemas for all user-facing forms. Types are derived from schemas via `z.infer`. |
| `store/` | Zustand store definitions. State shape + actions. Calls services; never calls storage directly. |
| `types/` | Domain-scoped TypeScript type files. `index.ts` re-exports all for backward compatibility. |
| `utils/` | Pure, stateless utility functions. No side effects, no imports from app modules. |

---

## 3. TypeScript Models

**Fix for Issue 4.** Types are split into domain-scoped files under `src/types/`. The `index.ts` re-exports everything for backward compatibility. Below is the full type inventory organized by file.

### `src/types/common.types.ts`

```typescript
/** Task urgency level, used for visual priority and rule engine scoring. */
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

/**
 * A coloured tag that can be applied to tasks.
 * Labels are workspace-scoped and reusable across boards.
 */
export interface Label {
  id: string;
  name: string;
  /** Hex colour code (e.g., "#ef4444") */
  color: string;
}

/** A single search hit returned by useSearch. */
export interface SearchResult {
  task: Task;
  boardName: string;
  workspaceName: string;
  columnName: string;
}
```

### `src/types/preferences.types.ts`

```typescript
/** Application colour scheme preference. 'system' follows OS dark-mode setting. */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Per-device user preferences.
 * Persisted via preferencesStore (Zustand persist middleware).
 * Never synced to a backend.
 */
export interface UserPreferences {
  theme: ThemeMode;
  activeWorkspaceId: string | null;
  /** Map of workspaceId → activeBoardId. Remembers the last-viewed board per workspace. */
  activeBoardIds: Record<string, string>;
  sidebarCollapsed: boolean;
}
```

### `src/types/activity.types.ts`

```typescript
/** Discriminated union of all auditable domain events. */
export type ActivityEventType =
  | 'task_created'
  | 'task_edited'
  | 'task_moved'
  | 'task_completed'
  | 'task_reopened'
  | 'task_deleted'
  | 'board_created'
  | 'board_renamed'
  | 'board_deleted'
  | 'column_created'
  | 'column_renamed'
  | 'column_deleted';

/**
 * An immutable audit log entry for a domain event.
 * Written by the Service Layer; never modified after creation.
 * Stored ONLY in the global activities array — NOT inline on Task objects.
 */
export interface Activity {
  id: string;
  eventType: ActivityEventType;
  /** ID of the primary entity affected */
  entityId: string;
  entityTitle: string;
  workspaceId: string;
  boardId: string;
  columnId?: string;
  /** Arbitrary event-specific metadata. E.g., for 'task_moved': { fromColumn, toColumn } */
  meta?: Record<string, unknown>;
  timestamp: string;
}
```

### `src/types/task.types.ts`

```typescript
import type { Priority } from './common.types';

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

export interface Comment {
  id: string;
  text: string;
  createdAt: string;
}

/**
 * The central domain entity.
 * Fix for Issue 5: `activities` field removed. Activities are global-only,
 * stored in `taskflow:activities` and fetched via `useTaskActivities(taskId)`.
 */
export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  labels: string[];
  dueDate: string | null;
  estimatedHours: number;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  columnId: string;
  boardId: string;
  workspaceId: string;
  checklist: ChecklistItem[];
  comments: Comment[];
  order: number;
}

export type SortOption = 'order' | 'priority' | 'dueDate' | 'createdAt' | 'title';

export interface TaskFilters {
  priority?: Priority[];
  labelIds?: string[];
  status?: 'open' | 'completed' | 'overdue' | 'all';
  assigneeSearch?: string;
}

export interface CreateTaskInput {
  title: string;
  columnId: string;
  boardId: string;
  workspaceId: string;
  description?: string;
  priority?: Priority;
  labels?: string[];
  dueDate?: string | null;
  estimatedHours?: number;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  priority?: Priority;
  labels?: string[];
  dueDate?: string | null;
  estimatedHours?: number;
}
```

### `src/types/board.types.ts`

```typescript
export interface Column {
  id: string;
  name: string;
  boardId: string;
  taskIds: string[];
  order: number;
  createdAt: string;
}

export interface Board {
  id: string;
  name: string;
  workspaceId: string;
  columnIds: string[];
  createdAt: string;
  updatedAt: string;
  color?: string;
  icon?: string;
}

export interface CreateBoardInput {
  name: string;
  workspaceId: string;
  color?: string;
  icon?: string;
}

export interface UpdateBoardInput {
  name?: string;
  color?: string;
  icon?: string;
}

export interface CreateColumnInput {
  name: string;
  boardId: string;
}

export interface UpdateColumnInput {
  name?: string;
}
```

### `src/types/workspace.types.ts`

```typescript
export interface Workspace {
  id: string;
  name: string;
  color: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
  boardIds: string[];
}

export interface CreateWorkspaceInput {
  name: string;
  color: string;
  icon?: string;
}

export interface UpdateWorkspaceInput {
  name?: string;
  color?: string;
  icon?: string;
}
```

### `src/types/analytics.types.ts`

```typescript
import type { Priority } from './common.types';

export interface WeeklyTrendData {
  label: string;
  date: string;
  completed: number;
  created: number;
}

export interface AnalyticsData {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  dueSoonTasks: number;
  completionRate: number;
  byPriority: Record<Priority, number>;
  byColumn: Record<string, number>;
  totalEstimatedHours: number;
  completedEstimatedHours: number;
  weeklyTrend: WeeklyTrendData[];
  mostActiveBoardId: string | null;
}
```

### `src/types/productivity.types.ts`

```typescript
export type SuggestionSeverity = 'critical' | 'warning' | 'info';

export type SuggestionType =
  | 'overdue'
  | 'deadline_approaching'
  | 'stalled_urgent'
  | 'split_task'
  | 'productivity_score';

export interface ProductivitySuggestion {
  id: string;
  type: SuggestionType;
  severity: SuggestionSeverity;
  title: string;
  message: string;
  taskId?: string;
  createdAt: string;
}
```

### `src/types/index.ts`

```typescript
// Re-export everything for backward compatibility.
// Import from domain files for new code; this barrel is for migration convenience.
export * from './common.types';
export * from './preferences.types';
export * from './activity.types';
export * from './task.types';
export * from './board.types';
export * from './workspace.types';
export * from './analytics.types';
export * from './productivity.types';
```

---

## 4. Storage Layer Schema

### localStorage Keys

All keys are namespaced under the `taskflow:` prefix. Key names are defined in `src/config/constants.ts` under `STORAGE_KEYS` (see Section 18).

| Key | JSON Shape | Notes |
|-----|-----------|-------|
| `taskflow:workspaces` | `Workspace[]` | All workspaces |
| `taskflow:boards` | `Board[]` | All boards across all workspaces |
| `taskflow:columns` | `Column[]` | All columns across all boards |
| `taskflow:tasks` | `Task[]` | All tasks across all boards (no `activities` field) |
| `taskflow:activities` | `Activity[]` | Global audit log; capped at `APP_LIMITS.MAX_ACTIVITIES_STORED` entries |
| `taskflow:preferences` | `UserPreferences` | Single object; managed by `preferencesStore` |

### StorageService

`StorageService` is a **thin JSON utility** used only by repository implementations. It is never called directly by stores, services, or hooks.

```typescript
// src/services/StorageService.ts

export interface IStorageService {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
  clear(): void;
}

const NAMESPACE = 'taskflow';

class LocalStorageService implements IStorageService {
  private key(k: string): string {
    return `${NAMESPACE}:${k}`;
  }

  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(this.key(key));
      if (raw === null) return null;
      return JSON.parse(raw) as T;
    } catch (err) {
      console.error(`[StorageService] Failed to read key "${key}"`, err);
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(this.key(key), JSON.stringify(value));
    } catch (err) {
      // QuotaExceededError — log but do not throw; UI remains functional
      console.error(`[StorageService] Failed to write key "${key}"`, err);
    }
  }

  remove(key: string): void {
    localStorage.removeItem(this.key(key));
  }

  clear(): void {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(`${NAMESPACE}:`))
      .forEach((k) => localStorage.removeItem(k));
  }
}

export const storageService: IStorageService = new LocalStorageService();
```

### Repository Implementations

Each repository encapsulates the `storageService` calls for one entity type. Example:

```typescript
// src/repositories/LocalStorageTaskRepository.ts

import { storageService } from '../services/StorageService';
import { STORAGE_KEYS } from '../config/constants';
import type { ITaskRepository } from './interfaces';
import type { Task } from '../types/task.types';

export class LocalStorageTaskRepository implements ITaskRepository {
  findAll(boardId: string): Task[] {
    const all = storageService.get<Task[]>(STORAGE_KEYS.TASKS) ?? [];
    return all.filter((t) => t.boardId === boardId);
  }

  findAllAcrossWorkspaces(): Task[] {
    return storageService.get<Task[]>(STORAGE_KEYS.TASKS) ?? [];
  }

  findById(id: string): Task | null {
    const all = storageService.get<Task[]>(STORAGE_KEYS.TASKS) ?? [];
    return all.find((t) => t.id === id) ?? null;
  }

  save(task: Task): void {
    const all = storageService.get<Task[]>(STORAGE_KEYS.TASKS) ?? [];
    const idx = all.findIndex((t) => t.id === task.id);
    if (idx === -1) {
      storageService.set(STORAGE_KEYS.TASKS, [...all, task]);
    } else {
      const updated = [...all];
      updated[idx] = task;
      storageService.set(STORAGE_KEYS.TASKS, updated);
    }
  }

  delete(id: string): void {
    const all = storageService.get<Task[]>(STORAGE_KEYS.TASKS) ?? [];
    storageService.set(STORAGE_KEYS.TASKS, all.filter((t) => t.id !== id));
  }
}

export const taskRepository: ITaskRepository = new LocalStorageTaskRepository();
```

The same pattern applies to `LocalStorageBoardRepository`, `LocalStorageWorkspaceRepository`, `LocalStorageActivityRepository`, and `LocalStoragePreferencesRepository`. See `src/repositories/interfaces.ts` for all interface definitions.

---

## 5. Service Layer Design

Services receive repository instances via constructor injection or module-level singleton import. All ID generation uses `uuid`'s `v4()`. All timestamps are ISO 8601 strings (`new Date().toISOString()`). Services never call `storageService` directly — they go through repositories.

### WorkspaceService

```typescript
// src/services/WorkspaceService.ts

interface WorkspaceService {
  /** Return all workspaces, ordered by createdAt ascending. */
  getAll(): Workspace[];

  /** Return a workspace by ID, or null if not found. */
  getById(id: string): Workspace | null;

  /**
   * Create a new workspace.
   * Generates id, createdAt, updatedAt; initialises boardIds: [].
   */
  create(data: CreateWorkspaceInput): Workspace;

  /** Update mutable fields. Sets updatedAt on mutation. */
  update(id: string, data: UpdateWorkspaceInput): Workspace;

  /**
   * Delete a workspace and CASCADE:
   *   - All boards in workspace.boardIds
   *   - All columns in those boards
   *   - All tasks in those columns
   *   - All activities with workspaceId === id
   */
  delete(id: string): void;
}
```

### BoardService

```typescript
// src/services/BoardService.ts

interface BoardService {
  /** Return all boards belonging to a workspace, ordered by createdAt. */
  getAll(workspaceId: string): Board[];
  getById(id: string): Board | null;

  /**
   * Create a new board within a workspace.
   * Appends boardId to workspace.boardIds.
   * Seeds 3 default columns: "To Do", "In Progress", "Done".
   * Records 'board_created' activity.
   */
  create(data: CreateBoardInput): Board;

  /**
   * Update board name, color, or icon.
   * Records 'board_renamed' activity on name change.
   */
  update(id: string, data: UpdateBoardInput): Board;

  /**
   * Delete a board and CASCADE:
   *   - All columns in board.columnIds
   *   - All tasks in those columns
   * Removes boardId from parent workspace.boardIds.
   * Records 'board_deleted' activity.
   */
  delete(id: string): void;

  /**
   * Reorder columns within a board (drag-drop column reorder).
   * Replaces board.columnIds with the provided ordered array.
   * Updates each column's `order` field to match index.
   */
  reorderColumns(boardId: string, columnIds: string[]): Board;

  createColumn(data: CreateColumnInput): Column;
  updateColumn(id: string, data: UpdateColumnInput): Column;

  /**
   * Delete a column.
   * Cascades: deletes all tasks in column.taskIds.
   * Removes columnId from board.columnIds.
   * Records 'column_deleted' activity.
   */
  deleteColumn(id: string): void;
}
```

### TaskService

```typescript
// src/services/TaskService.ts

interface TaskService {
  /** Return all tasks for a board, sorted by column order then task order. */
  getAll(boardId: string): Task[];

  /** Return all tasks across all workspaces (used for global in-memory index). */
  getAllAcrossWorkspaces(): Task[];

  getById(id: string): Task | null;

  /**
   * Create a task in the specified column.
   * Sets: id, createdAt, updatedAt, order (appended to end of column),
   *       completedAt: null, checklist: [], comments: [].
   * NOTE: No `activities` field on Task — activities are recorded globally only.
   * Appends taskId to column.taskIds.
   * Records 'task_created' activity via activityRepository.
   */
  create(data: CreateTaskInput): Task;

  /** Update mutable task fields. Records 'task_edited' activity. */
  update(id: string, data: UpdateTaskInput): Task;

  /**
   * Delete a task. Removes taskId from column.taskIds.
   * Records 'task_deleted' activity.
   */
  delete(id: string): void;

  /**
   * Move a task between columns (or reorder within the same column).
   * Updates task.columnId, task.order.
   * Updates source and destination column.taskIds arrays.
   * Records 'task_moved' activity with meta: { fromColumn, toColumn }.
   */
  move(
    taskId: string,
    sourceColumnId: string,
    destinationColumnId: string,
    newOrder: number
  ): Task;

  /** Mark complete. Sets completedAt to now. Records 'task_completed'. */
  complete(taskId: string): Task;

  /** Reopen. Sets completedAt to null. Records 'task_reopened'. */
  reopen(taskId: string): Task;

  /** Append a comment. Records 'task_edited' with meta: { action: 'comment_added' }. */
  addComment(taskId: string, text: string): Task;

  deleteComment(taskId: string, commentId: string): Task;

  updateChecklist(taskId: string, items: ChecklistItem[]): Task;
}
```

### AnalyticsService

**Fix for Issue 2.** `AnalyticsService` is a pure computation utility. It takes task data as input and returns analytics output. It has no store interaction and no side effects. It never loads from storage independently.

```typescript
// src/services/AnalyticsService.ts

interface AnalyticsService {
  /**
   * Compute AnalyticsData from the provided task array.
   * Pure function — no storage reads, no side effects.
   */
  compute(tasks: Task[]): AnalyticsData;

  /**
   * Return a 7-element array of WeeklyTrendData.
   * Scans the provided activities for task_created / task_completed events
   * in the last 7 calendar days and buckets by date.
   */
  computeWeeklyTrend(activities: Activity[]): WeeklyTrendData[];
}
```

`useAnalytics()` calls `analyticsService.compute(tasks)` directly — no store intermediary. Analytics data is always derived from the live `taskStore.tasks` array and is therefore always fresh.

---

## 6. Zustand Store Design

Stores are the only consumers of service methods. Components never import services directly. `persist` middleware is used for `themeStore` and `preferencesStore` only — all other stores are hydrated imperatively on mount.

### workspaceStore

**Fix for Issue 3.** `setActiveWorkspace` no longer calls `storageService` directly. It delegates to `preferencesStore`.

```typescript
// src/store/workspaceStore.ts

import { create } from 'zustand';
import { workspaceService } from '../services/WorkspaceService';
import { usePreferencesStore } from './preferencesStore';

interface WorkspaceState {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  isLoading: boolean;

  /**
   * Load all workspaces from storage into state.
   * Reads activeWorkspaceId from preferencesStore (not storageService directly).
   * Seeds default data if storage is empty.
   */
  loadWorkspaces(): void;

  /**
   * Set the active workspace and persist via preferencesStore.
   * Triggers boardStore.loadBoards(id) to cascade.
   */
  setActiveWorkspace(id: string): void;

  createWorkspace(data: CreateWorkspaceInput): void;
  updateWorkspace(id: string, data: UpdateWorkspaceInput): void;

  /**
   * Delete workspace (cascades to boards/columns/tasks).
   * Removes from state. If it was active, switches to first remaining workspace.
   */
  deleteWorkspace(id: string): void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: [],
  activeWorkspaceId: null,
  isLoading: false,

  loadWorkspaces() {
    set({ isLoading: true });
    const workspaces = workspaceService.getAll();
    // Read preference from preferencesStore — not from storageService
    const prefs = usePreferencesStore.getState();
    const activeId = prefs.activeWorkspaceId ?? workspaces[0]?.id ?? null;
    set({ workspaces, activeWorkspaceId: activeId, isLoading: false });
  },

  setActiveWorkspace(id) {
    set({ activeWorkspaceId: id });
    // Persist via preferencesStore — never call storageService directly
    usePreferencesStore.getState().setActiveWorkspace(id);
  },

  createWorkspace(data) {
    const workspace = workspaceService.create(data);
    set((s) => ({ workspaces: [...s.workspaces, workspace] }));
  },

  updateWorkspace(id, data) {
    const updated = workspaceService.update(id, data);
    set((s) => ({
      workspaces: s.workspaces.map((w) => (w.id === id ? updated : w)),
    }));
  },

  deleteWorkspace(id) {
    workspaceService.delete(id);
    set((s) => {
      const remaining = s.workspaces.filter((w) => w.id !== id);
      const activeId =
        s.activeWorkspaceId === id ? (remaining[0]?.id ?? null) : s.activeWorkspaceId;
      return { workspaces: remaining, activeWorkspaceId: activeId };
    });
  },
}));
```

### preferencesStore

**Fix for Issue 3.** Replaces all scattered `storageService.get/set('preferences')` calls across stores with a single `persist`-backed store.

```typescript
// src/store/preferencesStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PreferencesState {
  activeWorkspaceId: string | null;
  activeBoardIds: Record<string, string>;
  sidebarCollapsed: boolean;

  setActiveWorkspace(id: string): void;
  setActiveBoard(workspaceId: string, boardId: string): void;
  setSidebarCollapsed(collapsed: boolean): void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      activeWorkspaceId: null,
      activeBoardIds: {},
      sidebarCollapsed: false,

      setActiveWorkspace(id) {
        set({ activeWorkspaceId: id });
      },

      setActiveBoard(workspaceId, boardId) {
        set((s) => ({
          activeBoardIds: { ...s.activeBoardIds, [workspaceId]: boardId },
        }));
      },

      setSidebarCollapsed(collapsed) {
        set({ sidebarCollapsed: collapsed });
      },
    }),
    { name: 'taskflow:preferences' }
  )
);
```

### boardStore

```typescript
// src/store/boardStore.ts

interface BoardState {
  boards: Board[];
  columns: Column[];
  activeBoardId: string | null;
  isLoading: boolean;

  loadBoards(workspaceId: string): void;
  setActiveBoard(id: string): void;
  createBoard(data: CreateBoardInput): void;
  updateBoard(id: string, data: UpdateBoardInput): void;
  deleteBoard(id: string): void;
  createColumn(data: CreateColumnInput): void;
  updateColumn(id: string, data: UpdateColumnInput): void;
  deleteColumn(id: string): void;
  reorderColumns(boardId: string, columnIds: string[]): void;
}
```

**Implementation notes:**
- `loadBoards(workspaceId)` calls `boardService.getAll(workspaceId)` and loads columns for every retrieved board.
- `setActiveBoard(id)` updates `activeBoardId` and calls `usePreferencesStore.getState().setActiveBoard(workspaceId, id)`.
- `deleteBoard` calls `boardService.delete(id)`, removes from `boards[]` and clears related `columns[]`.

### taskStore

**Fix for Issue 6.** `taskStore` now loads ALL tasks across ALL workspaces on init. This provides a full in-memory index that `useSearch` queries without touching storage.

```typescript
// src/store/taskStore.ts

interface TaskState {
  /** ALL tasks across all workspaces — the full in-memory index. */
  allTasks: Task[];
  /** Active filter criteria */
  filters: TaskFilters;
  sortBy: SortOption;
  selectedTaskId: string | null;
  isLoading: boolean;

  /**
   * Load ALL tasks from storage into allTasks on app init.
   * Called once by AppLayout on mount.
   * useTasks(boardId) derives its view via useMemo filter on allTasks.
   */
  loadAllTasks(): void;

  createTask(data: CreateTaskInput): void;
  updateTask(id: string, data: UpdateTaskInput): void;
  deleteTask(id: string): void;
  moveTask(
    taskId: string,
    sourceColumnId: string,
    destinationColumnId: string,
    newOrder: number
  ): void;
  completeTask(id: string): void;
  reopenTask(id: string): void;
  addComment(taskId: string, text: string): void;
  deleteComment(taskId: string, commentId: string): void;
  updateChecklist(taskId: string, items: ChecklistItem[]): void;
  setSelectedTask(id: string | null): void;
  setFilters(filters: Partial<TaskFilters>): void;
  setSortBy(sort: SortOption): void;
}
```

**Implementation notes:**
- `loadAllTasks()` calls `taskService.getAllAcrossWorkspaces()` once on app init. This is acceptable at localStorage scale (all tasks in memory).
- `moveTask` applies an optimistic update to `allTasks` immediately, then persists via `taskService.move()`.
- `setFilters` and `setSortBy` only update local state — derived filtered/sorted lists are computed in `useTasks(boardId)` via `useMemo`.
- Board-scoped views come from `useTasks(boardId)` which derives from `allTasks` via `useMemo`.

### themeStore

```typescript
// src/store/themeStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  mode: ThemeMode;
  setMode(mode: ThemeMode): void;
  initTheme(): void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'system',
      setMode(mode) {
        set({ mode });
        applyTheme(mode);
      },
      initTheme() {
        applyTheme(get().mode);
      },
    }),
    { name: 'taskflow:theme' }
  )
);
```

### Persist Middleware Policy

| Store | Uses `persist` | Rationale |
|-------|---------------|-----------|
| `workspaceStore` | No | Hydrated from repository on mount |
| `boardStore` | No | Hydrated from repository on mount |
| `taskStore` | No | Hydrated from repository on mount |
| `themeStore` | Yes | Theme must survive page refresh without a flash |
| `preferencesStore` | Yes | Replaces manual storageService preference writes |

---

## 7. Custom Hooks Design

Custom hooks are the **only** entry points through which components access store state and actions. Components never import Zustand stores directly.

### `useLocalStorage<T>(key, initialValue)`

```typescript
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void]
```

**Purpose:** Generic typed hook for reading and writing individual localStorage keys outside the domain service layer (e.g., legacy sidebar state not yet in `preferencesStore`).

**Implementation strategy:**
- Initialises state with `storageService.get<T>(key) ?? initialValue` using a lazy `useState` initialiser.
- The setter writes to both React state and `storageService.set()` atomically.
- SSR-safe: wraps the `localStorage` access in a `typeof window !== 'undefined'` guard.

---

### `useTheme()`

```typescript
function useTheme(): {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  isDark: boolean;
}
```

**Purpose:** Wraps `themeStore`. Applies the `dark` class to `document.documentElement` and exposes a computed `isDark` boolean.

**Implementation strategy:**
- Subscribes to `useThemeStore` for `mode`.
- `useEffect` on `mode` change applies the CSS class; cleans up `matchMedia` listener on unmount.

---

### `useWorkspace()`

```typescript
function useWorkspace(): {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  isLoading: boolean;
  setActiveWorkspace: (id: string) => void;
  createWorkspace: (data: CreateWorkspaceInput) => void;
  updateWorkspace: (id: string, data: UpdateWorkspaceInput) => void;
  deleteWorkspace: (id: string) => void;
}
```

**Purpose:** Returns the active workspace object and all CRUD actions. `activeWorkspace` is derived: `workspaces.find(w => w.id === activeWorkspaceId) ?? null`.

---

### `useBoard()`

```typescript
function useBoard(): {
  boards: Board[];
  activeBoard: Board | null;
  columns: Column[];
  activeBoardColumns: Column[];
  isLoading: boolean;
  setActiveBoard: (id: string) => void;
  createBoard: (data: CreateBoardInput) => void;
  updateBoard: (id: string, data: UpdateBoardInput) => void;
  deleteBoard: (id: string) => void;
  createColumn: (data: CreateColumnInput) => void;
  updateColumn: (id: string, data: UpdateColumnInput) => void;
  deleteColumn: (id: string) => void;
  reorderColumns: (boardId: string, columnIds: string[]) => void;
}
```

**Implementation strategy:**
- `activeBoardColumns` is `useMemo`-derived from `columns` filtered by `activeBoardId`, then sorted by `column.order`.

---

### `useTasks(boardId: string)`

```typescript
function useTasks(boardId: string): {
  tasks: Task[];           // all tasks for this board
  filteredTasks: Task[];   // filtered + sorted
  tasksByColumnId: Record<string, Task[]>;
  selectedTask: Task | null;
  filters: TaskFilters;
  sortBy: SortOption;
  isLoading: boolean;
  createTask: (data: CreateTaskInput) => void;
  updateTask: (id: string, data: UpdateTaskInput) => void;
  deleteTask: (id: string) => void;
  completeTask: (id: string) => void;
  reopenTask: (id: string) => void;
  setSelectedTask: (id: string | null) => void;
  setFilters: (filters: Partial<TaskFilters>) => void;
  setSortBy: (sort: SortOption) => void;
  handleDragEnd: (result: DropResult) => void;
}
```

**Implementation strategy:**
- `tasks` is `useMemo`-derived from `taskStore.allTasks` filtered by `boardId`. This means no storage read — purely in-memory.
- `filteredTasks` is `useMemo`-computed from `tasks`, `filters`, and `sortBy`.
- `tasksByColumnId` is `useMemo`-computed: `Record<columnId, Task[]>` where each array is sorted by `task.order`.
- `handleDragEnd` maps `DropResult` to `taskStore.moveTask(...)` or a same-column reorder.
- `useCallback` wraps all mutation handlers for stable references.

---

### `useSearch(query: string)`

**Fix for Issue 6.** `useSearch` no longer reads from storage. It queries the in-memory `taskStore.allTasks` index, which contains all tasks across all workspaces.

```typescript
function useSearch(query: string): {
  results: SearchResult[];
  isSearching: boolean;
}
```

**Implementation strategy:**
- Maintains a `debouncedQuery` string using a `TIMING.SEARCH_DEBOUNCE_MS` ms debounce inside `useEffect`.
- On `debouncedQuery` change: reads `taskStore.allTasks` — the complete cross-workspace in-memory index. No storage access.
- Filters by case-insensitive title/description match, enriches each hit with `boardName`, `workspaceName`, `columnName`.
- Returns results sorted by relevance (starts-with ranked above contains).
- `isSearching` is true during the debounce window.

---

### `useAnalytics()`

**Fix for Issue 2 and Issue 9.** `analyticsStore` is removed. Analytics is derived directly from `taskStore.allTasks` using `useMemo`. The `useEffect` dependency is `[tasks]`, not `[tasks.length]`.

```typescript
function useAnalytics(): {
  data: AnalyticsData | null;
  suggestions: ProductivitySuggestion[];
  selectedWorkspaceId: string | null;
  setSelectedWorkspace: (id: string | null) => void;
}
```

```typescript
// src/hooks/useAnalytics.ts

function useAnalytics() {
  const allTasks = useTaskStore((s) => s.allTasks);
  const [selectedWorkspaceId, setSelectedWorkspace] = useState<string | null>(null);

  const data = useMemo(() => {
    const scopedTasks = selectedWorkspaceId
      ? allTasks.filter((t) => t.workspaceId === selectedWorkspaceId)
      : allTasks;
    return analyticsService.compute(scopedTasks);
    // Dependency is [allTasks] — not [allTasks.length].
    // Zustand creates a new array reference on every mutation, so reference
    // equality correctly triggers recomputation when tasks are updated,
    // added, or deleted — even when the count stays the same.
  }, [allTasks, selectedWorkspaceId]);

  const suggestions = useMemo(
    () => evaluateAllRules(allTasks, new Date()),
    [allTasks]  // same reasoning: new reference = recompute
  );

  return { data, suggestions, selectedWorkspaceId, setSelectedWorkspace };
}
```

**Why `[tasks]` is correct (Issue 9):** Using `[tasks.length]` as a dependency is a code smell — if a task's priority or due date changes (same count, different data), analytics would not recompute. Zustand's store update mechanism creates new array references on every `set()` call, so reference equality with `[tasks]` is both correct and efficient.

---

### `useTaskActivities(taskId: string)`

**Fix for Issue 5.** Since `activities` was removed from the `Task` interface, the `TaskModal` fetches activity history via this dedicated hook.

```typescript
function useTaskActivities(taskId: string): {
  activities: Activity[];
}
```

**Implementation strategy:**
- Reads from a lightweight `activityStore` (or directly from `activityRepository.findByTask(taskId)`).
- Returns activities sorted by `timestamp` ascending (oldest first for timeline rendering).
- `useMemo`-filtered from the global activities array by `entityId === taskId`.

---

## 8. Component Hierarchy

**Fix for Issue 7.** `ErrorBoundary` and `BoardErrorBoundary` wrappers are added at the board, column, and page level. Every `React.lazy` page is also wrapped.

### DashboardPage

```
DashboardPage
└── AppLayout
    ├── Sidebar
    │   ├── Logo
    │   ├── NavWorkspaceList
    │   │   └── WorkspaceItem (×n, with avatar + name)
    │   ├── NavBoardList
    │   │   └── BoardItem (×n, with icon + name + active indicator)
    │   └── SidebarFooter (theme toggle + version)
    ├── TopBar
    │   ├── PageTitle ("Dashboard")
    │   ├── SearchBar
    │   │   └── SearchDropdown
    │   │       └── SearchResultItem (×n)
    │   └── ThemeToggle
    └── <main>
        ├── ProductivityBanner (top suggestion, dismissable)
        └── StatsGrid
            ├── StatCard ("Total Tasks")
            ├── StatCard ("Completed")
            ├── StatCard ("Overdue")
            ├── StatCard ("Due Today")
            ├── StatCard ("In Progress")
            ├── StatCard ("High Priority")
            ├── StatCard ("Completion Rate")
            ├── StatCard ("Est. Hours")
            └── RecentActivity
                └── ActivityEntry (×20 max)
```

### BoardPage

```
BoardPage
└── AppLayout
    └── <main>
        ├── BoardHeader
        │   ├── BoardTitle (editable inline)
        │   ├── BoardColorDot
        │   └── BoardActions (rename, delete, share)
        ├── BoardToolbar
        │   ├── FilterChip (Priority)
        │   ├── FilterChip (Label)
        │   ├── FilterChip (Status)
        │   └── SortDropdown
        └── BoardErrorBoundary              ← board-level boundary (Issue 7)
            └── BoardView
                ├── BoardEmptyState (shown when columnIds.length === 0)
                └── DragDropContext (onDragEnd → handleDragEnd)
                    ├── Droppable id="board-columns" direction="horizontal"
                    │   ├── Draggable per column
                    │   │   └── ErrorBoundary            ← column-level boundary (Issue 7)
                    │   │       └── ColumnContainer
                    │   │           ├── ColumnHeader
                    │   │           │   ├── ColumnName
                    │   │           │   ├── TaskCount badge
                    │   │           │   └── ColumnActions (rename, delete)
                    │   │           ├── Droppable id={column.id} direction="vertical"
                    │   │           │   └── Draggable per task
                    │   │           │       └── TaskCard
                    │   │           │           ├── TaskPriorityIcon
                    │   │           │           ├── TaskTitle
                    │   │           │           ├── TaskBadge (×label)
                    │   │           │           ├── TaskDueDate
                    │   │           │           ├── TaskProgress (checklist bar)
                    │   │           │           └── TaskCardActions (open, delete)
                    │   │           └── ColumnAddButton ("+ Add task")
                    │   └── ColumnAddButton ("+ Add column", at list end)
```

Column-level `ErrorBoundary` ensures one broken column does not crash the entire board. The board-level `BoardErrorBoundary` handles errors that escape the column level.

### TaskModal

```
TaskModal (rendered via ModalPortal → document.body)
└── dialog[role="dialog"][aria-modal="true"]
    ├── ModalHeader
    │   ├── TaskTitle (editable h2)
    │   └── CloseButton (×, aria-label="Close task")
    ├── TaskForm (React Hook Form context)
    │   ├── PrioritySelect
    │   ├── DueDatePicker
    │   ├── EstimatedHoursInput
    │   └── LabelSelector
    │       └── LabelChip (×n, toggleable)
    ├── DescriptionEditor (textarea with Markdown hint)
    ├── ChecklistSection
    │   ├── ChecklistItem (×n)
    │   └── AddChecklistItemInput
    ├── CommentsSection
    │   ├── CommentItem (×n)
    │   └── CommentInput (submit on Enter)
    └── ActivityTimeline                     ← uses useTaskActivities(task.id) (Issue 5)
        └── ActivityEntry (×n)
            ├── ActivityIcon (event-type mapped)
            ├── ActivityDescription
            └── ActivityTimestamp (relative, via date-fns)
```

`ActivityTimeline` calls `useTaskActivities(task.id)` to fetch the global activities filtered to this task. It no longer reads `task.activities` (which has been removed from the `Task` type).

### AnalyticsPage

```
AnalyticsPage (React.lazy loaded)
└── ErrorBoundary                            ← wraps all lazy pages (Issue 7)
    └── AppLayout
        └── <main>
            └── AnalyticsOverview
                ├── WorkspaceSelector (dropdown, "All Workspaces" default)
                ├── SummaryRow
                │   ├── StatCard ("Total Tasks")
                │   ├── StatCard ("Completed")
                │   ├── StatCard ("Overdue")
                │   └── StatCard ("Completion Rate")
                ├── ChartsGrid (2×2 on desktop, 1×n on mobile)
                │   ├── TaskDistributionChart (horizontal bars by column)
                │   ├── PriorityChart (SVG donut)
                │   ├── CompletionRateChart (SVG radial arc)
                │   └── WeeklyProductivityChart (SVG sparkline)
                └── EstimatedVsCompletedChart (SVG grouped bars, full width)
```

### ActivityPage

```
ActivityPage (React.lazy loaded)
└── ErrorBoundary                            ← wraps all lazy pages (Issue 7)
    └── AppLayout
        └── <main>
            ├── ActivityFilters
            │   ├── EventTypeFilter (multiselect)
            │   └── DateRangeFilter
            └── ActivityFeed
                └── ActivityGroup (grouped by date)
                    └── ActivityEntry (×n per day)
```

---

## 9. Routing Design

### Route Tree

```typescript
// src/App.tsx

<BrowserRouter>
  <Routes>
    <Route element={<AppLayout />}>
      <Route index path="/" element={<DashboardPage />} />
      <Route path="/workspace/:workspaceId" element={<WorkspaceRedirect />} />
      <Route path="/board/:boardId" element={<BoardPage />} />
      <Route
        path="/analytics"
        element={
          <ErrorBoundary>
            <Suspense fallback={<PageSkeleton />}>
              <AnalyticsPage />
            </Suspense>
          </ErrorBoundary>
        }
      />
      <Route
        path="/activity"
        element={
          <ErrorBoundary>
            <Suspense fallback={<PageSkeleton />}>
              <ActivityPage />
            </Suspense>
          </ErrorBoundary>
        }
      />
    </Route>
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
</BrowserRouter>
```

### Route Definitions

| Path | Component | Notes |
|------|-----------|-------|
| `/` | `DashboardPage` | Eagerly loaded; shown on app open |
| `/workspace/:workspaceId` | `WorkspaceRedirect` | Sets active workspace, redirects to its active board |
| `/board/:boardId` | `BoardPage` | Eagerly loaded; loads board + tasks on mount |
| `/analytics` | `AnalyticsPage` | `React.lazy` — code-split chunk; wrapped in `ErrorBoundary` |
| `/activity` | `ActivityPage` | `React.lazy` — code-split chunk; wrapped in `ErrorBoundary` |
| `*` | `NotFoundPage` | Outside `AppLayout`; full-screen 404 |

### Code Splitting Strategy

```typescript
const AnalyticsPage = React.lazy(() => import('./pages/AnalyticsPage'));
const ActivityPage  = React.lazy(() => import('./pages/ActivityPage'));
```

Vite splits these into separate JS chunks at build time. Each lazy page is wrapped in both `<Suspense>` (for loading) and `<ErrorBoundary>` (for runtime errors).

### Navigation State

Active workspace and active board are maintained in `preferencesStore` (Zustand `persist`), not in URL params. The URL remains shareable and bookmarkable for the board route (`/board/:boardId`). The workspace switcher in the sidebar updates `workspaceStore.activeWorkspaceId` and triggers `boardStore.loadBoards()`.

---

## 10. Data Flow

### Scenario A — App Initialisation

```
1. browser loads index.html → Vite serves bundle
2. main.tsx: ReactDOM.createRoot(#root).render(<App />)
3. App.tsx: useEffect → useThemeStore.initTheme()
     → reads 'taskflow:theme' from localStorage (via persist middleware)
     → applies 'dark' class to document.documentElement
4. <AppLayout /> mounts
5. AppLayout useEffect → workspaceStore.loadWorkspaces()
     → workspaceService.getAll()
     → workspaceRepository.findAll()
     → storageService.get<Workspace[]>('workspaces')
6. Reads activeWorkspaceId from preferencesStore (persist middleware)
7. [First run] No data found → seedDefaultData()
     → creates Workspace("My Workspace")
     → creates Board("Project Alpha")
     → creates Columns: ["To Do", "In Progress", "Done"]
     → creates 3 sample Tasks
     → persists all via repositories
8. workspaceStore.workspaces populated; isLoading → false
9. workspaceStore.setActiveWorkspace(workspaces[0].id)
     → preferencesStore.setActiveWorkspace(id)  ← no direct storageService call
10. boardStore.loadBoards(activeWorkspaceId) triggered
11. taskStore.loadAllTasks() triggered
     → taskService.getAllAcrossWorkspaces()
     → taskRepository.findAllAcrossWorkspaces()
     → all tasks loaded into taskStore.allTasks (full in-memory index)
12. React renders:
     - While isLoading === true: Skeleton loaders
     - After isLoading === false: full UI with Framer Motion stagger animations
```

### Scenario B — Create Task

```
1. User clicks "+ Add task" in ColumnContainer
2. taskStore.setSelectedTask(null) → opens TaskModal in create mode
3. TaskModal renders, focus trap activated
4. User fills form: title, priority, due date
5. React Hook Form + Zod schema validates (CreateTaskSchema from src/schemas/task.schema.ts)
6. onSubmit → taskStore.createTask(formData)
7. taskStore.createTask(data):
     → calls taskService.create(data)
8. taskService.create(data):
     → const id = uuidv4()
     → const now = new Date().toISOString()
     → builds Task: { id, ...data, createdAt: now, updatedAt: now,
          completedAt: null, checklist: [], comments: [], order: column.taskIds.length }
       NOTE: no `activities` field — activities are global only
     → taskRepository.save(task)
     → boardRepository reads column, appends taskId to taskIds, saves column
     → activityRepository.save({ eventType: 'task_created', entityId: id, ... })
     → returns Task
9. taskStore: set((s) => ({ allTasks: [...s.allTasks, newTask] }))
10. useTasks(boardId) re-derives its board-scoped view via useMemo — no extra work needed
11. useAnalytics() re-derives analytics via useMemo([allTasks]) — always fresh
12. TaskModal closes; focus returns to trigger button
13. TaskCard animates in via Framer Motion
```

### Scenario C — Drag and Drop

```
1. User presses mousedown on TaskCard drag handle
2. @hello-pangea/dnd activates DragOverlay
3. User drags to destination column, releases
4. @hello-pangea/dnd fires onDragEnd(result: DropResult)
5. useTasks().handleDragEnd(result):
6. if result.destination === null → return (no-op)
7. taskStore.moveTask(taskId, sourceColId, destColId, destIndex)
8. taskStore.moveTask (optimistic UI):
     → immediately update allTasks[] in state
     → useTasks(boardId) re-derives tasksByColumnId via useMemo
9. taskService.move(taskId, source, dest, order):
     → updates task via taskRepository.save()
     → updates source + dest columns via boardRepository
     → records 'task_moved' activity via activityRepository
10. Only the two affected ColumnContainers re-render (React.memo on others)
11. Framer Motion layout animation repositions cards
```

### Scenario D — Search

**Fix for Issue 6.** `useSearch` no longer reads from storage. It queries the in-memory index.

```
1. User types "auth" in SearchBar
2. useSearch("auth"):
     → 150ms debounce starts
3. 150ms elapses
4. useSearch resolves:
     → reads taskStore.allTasks — full cross-workspace in-memory index
       NO storage access; no architectural violation
     → filters tasks: title or description contains "auth" (case-insensitive)
     → enriches: { task, boardName, workspaceName, columnName }
     → sorts: starts-with > contains
5. SearchDropdown renders SearchResultItem (×n)
6. User navigates with ↑/↓, presses Enter
7. navigate('/board/' + result.task.boardId)
   taskStore.setSelectedTask(result.task.id)
```

---

## 11. Smart Productivity Assistant Design

The productivity assistant is a pure, stateless rule engine that operates on `Task[]`. It runs inside `useAnalytics()` as a `useMemo` computation — no store, no side effects, no loading state.

### Rule Interface

```typescript
// src/utils/productivityUtils.ts

export interface ProductivityRule {
  id: string;
  evaluate(task: Task, now: Date): ProductivitySuggestion | null;
}
```

### Rule 1: OverdueRule

```typescript
{
  id: 'overdue',
  evaluate(task, now) {
    if (!task.dueDate || task.completedAt) return null;
    const due = new Date(task.dueDate);
    if (due >= now) return null;
    const daysOverdue = differenceInDays(now, due);
    return {
      id: uuidv4(),
      type: 'overdue',
      severity: daysOverdue > 7 ? 'critical' : 'warning',
      title: `"${task.title}" is overdue`,
      message: `This task was due ${daysOverdue} day(s) ago. ` +
               `Complete it or update the due date.`,
      taskId: task.id,
      createdAt: now.toISOString(),
    };
  },
}
```

**Fires when:** `task.dueDate < now` AND `task.completedAt === null`  
**Severity:** `critical` if > 7 days overdue, `warning` otherwise

---

#### Rule 2: DeadlineApproachingRule

```typescript
{
  id: 'deadline_approaching',
  evaluate(task, now) {
    if (!task.dueDate || task.completedAt) return null;
    const due = new Date(task.dueDate);
    const hoursUntilDue = differenceInHours(due, now);
    if (hoursUntilDue < 0 || hoursUntilDue > 24) return null;
    return {
      id: uuidv4(),
      type: 'deadline_approaching',
      severity: 'warning',
      title: `"${task.title}" is due soon`,
      message: `Due in ${Math.round(hoursUntilDue)} hour(s). ` +
               `Make sure to complete or delegate this task.`,
      taskId: task.id,
      createdAt: now.toISOString(),
    };
  },
}
```

**Fires when:** `0 ≤ hoursUntilDue ≤ 24` AND `task.completedAt === null`

---

#### Rule 3: StalledUrgentRule

```typescript
{
  id: 'stalled_urgent',
  evaluate(task, now) {
    if (task.priority !== 'urgent' || task.completedAt) return null;
    const daysSinceUpdate = differenceInDays(now, new Date(task.updatedAt));
    if (daysSinceUpdate < 3) return null;
    return {
      id: uuidv4(),
      type: 'stalled_urgent',
      severity: 'warning',
      title: `Urgent task "${task.title}" appears stalled`,
      message: `This urgent task hasn't been updated in ${daysSinceUpdate} days.`,
      taskId: task.id,
      createdAt: now.toISOString(),
    };
  },
}
```

**Fires when:** `priority === 'urgent'` AND `daysSinceUpdate > 3` AND `completedAt === null`

---

#### Rule 4: SplitTaskRule

```typescript
{
  id: 'split_task',
  evaluate(task, now) {
    if (task.completedAt) return null;
    if (task.estimatedHours <= 8) return null;
    if (task.checklist.length > 0) return null;
    return {
      id: uuidv4(),
      type: 'split_task',
      severity: 'info',
      title: `"${task.title}" may need breaking down`,
      message: `Estimated at ${task.estimatedHours}h with no checklist. ` +
               `Consider splitting into sub-tasks.`,
      taskId: task.id,
      createdAt: now.toISOString(),
    };
  },
}
```

**Fires when:** `estimatedHours > 8` AND `checklist.length === 0` AND `completedAt === null`

---

#### Rule 5: ProductivityScoreRule

Operates at the aggregate level, not per-task:

```typescript
function computeProductivityScore(tasks: Task[], now: Date): ProductivitySuggestion {
  const total = tasks.length;
  if (total === 0) return defaultScoreSuggestion(now);

  const completed = tasks.filter((t) => t.completedAt).length;
  const overdue = tasks.filter(
    (t) => t.dueDate && !t.completedAt && new Date(t.dueDate) < now
  ).length;
  const highPriorityCompleted = tasks.filter(
    (t) => (t.priority === 'high' || t.priority === 'urgent') && t.completedAt
  ).length;
  const highPriorityTotal = tasks.filter(
    (t) => t.priority === 'high' || t.priority === 'urgent'
  ).length;

  // Score formula:
  //   50% weight → completion rate
  //   30% weight → overdue penalty
  //   20% weight → high-priority completion rate
  const score = Math.round(
    ((completed / total) * 50) +
    ((1 - overdue / total) * 30) +
    ((highPriorityTotal > 0 ? highPriorityCompleted / highPriorityTotal : 1) * 20)
  );

  const severity: SuggestionSeverity =
    score >= 70 ? 'info' : score >= 40 ? 'warning' : 'critical';

  return {
    id: 'productivity-score',
    type: 'productivity_score',
    severity,
    title: `Your productivity score is ${score}/100`,
    message: buildScoreMessage(score, overdue, highPriorityCompleted, highPriorityTotal),
    createdAt: now.toISOString(),
  };
}
```

### Rule Engine Evaluation

```typescript
const ALL_RULES: ProductivityRule[] = [
  overdueRule,
  deadlineApproachingRule,
  stalledUrgentRule,
  splitTaskRule,
];

export function evaluateAllRules(
  tasks: Task[],
  now: Date = new Date()
): ProductivitySuggestion[] {
  const perTaskSuggestions = tasks.flatMap((task) =>
    ALL_RULES
      .map((rule) => rule.evaluate(task, now))
      .filter((s): s is ProductivitySuggestion => s !== null)
  );

  const scoreSuggestion = computeProductivityScore(tasks, now);

  const severityOrder: Record<SuggestionSeverity, number> = {
    critical: 0,
    warning: 1,
    info: 2,
  };

  return [...perTaskSuggestions, scoreSuggestion].sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
  );
}
```

---

## 12. Analytics Design (No External Charts Library)

All visualisations are built using React, SVG, and Tailwind CSS only. No Recharts, Chart.js, or D3. This keeps the bundle small and gives full control over theming and accessibility.

### Task Distribution Chart

**Component:** `TaskDistributionChart`  
**Visual:** Horizontal bar chart — one row per column, width proportional to task count.

```tsx
{columns.map((col) => {
  const count = data.byColumn[col.name] ?? 0;
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div key={col.id} className="flex items-center gap-3">
      <span className="w-24 truncate text-sm text-right">{col.name}</span>
      <div className="flex-1 h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
          role="meter"
          aria-valuenow={count}
          aria-valuemin={0}
          aria-valuemax={total}
        />
      </div>
      <span className="w-6 text-sm text-muted">{count}</span>
    </div>
  );
})}
```

---

### Priority Distribution Chart

**Component:** `PriorityChart`  
**Visual:** SVG donut chart using `<circle>` with `stroke-dasharray` and `stroke-dashoffset`.

```tsx
const RADIUS = 40;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // ~251.3

function PrioritySegment({ count, total, color, offset }: SegmentProps) {
  const length = total > 0 ? (count / total) * CIRCUMFERENCE : 0;
  return (
    <circle
      cx="50" cy="50" r={RADIUS}
      fill="none"
      stroke={color}
      strokeWidth="10"
      strokeDasharray={`${length} ${CIRCUMFERENCE - length}`}
      strokeDashoffset={-offset}
      transform="rotate(-90 50 50)"
    />
  );
}
```

---

### Completion Rate Chart

**Component:** `CompletionRateChart`  
**Visual:** SVG radial arc (single arc showing completion %).

```tsx
const angle = (completionRate / 100) * 360;
const rad = (angle * Math.PI) / 180;
const x = 50 + 38 * Math.sin(rad);
const y = 50 - 38 * Math.cos(rad);
const largeArc = angle > 180 ? 1 : 0;

<path
  d={`M 50 12 A 38 38 0 ${largeArc} 1 ${x} ${y}`}
  fill="none"
  stroke="var(--color-primary)"
  strokeWidth="8"
  strokeLinecap="round"
/>
```

---

### Weekly Productivity Chart

**Component:** `WeeklyProductivityChart`  
**Visual:** SVG sparkline — `<polyline>` connecting 7 data points.

```tsx
const maxValue = Math.max(...weeklyTrend.map((p) => p.completed), 1);
const polylinePoints = weeklyTrend
  .map((day, i) => {
    const x = (i / 6) * 100;
    const y = 50 - (day.completed / maxValue) * 45;
    return `${x},${y}`;
  })
  .join(' ');

<polyline
  points={polylinePoints}
  fill="none"
  stroke="var(--color-primary)"
  strokeWidth="2"
  strokeLinejoin="round"
  strokeLinecap="round"
/>
```

---

### Estimated vs Completed Chart

**Component:** `EstimatedVsCompletedChart`  
**Visual:** SVG grouped bar chart — two `<rect>` bars per board, side by side.

```tsx
const BAR_WIDTH = 12;
const GAP = 4;
const GROUP_WIDTH = BAR_WIDTH * 2 + GAP + 16;

{chartData.map((entry, i) => {
  const x = i * GROUP_WIDTH;
  const estHeight = (entry.estimated / maxHours) * MAX_BAR_HEIGHT;
  const compHeight = (entry.completed / maxHours) * MAX_BAR_HEIGHT;
  const baseY = MAX_BAR_HEIGHT + PADDING_TOP;
  return (
    <g key={entry.boardId}>
      <rect x={x} y={baseY - estHeight} width={BAR_WIDTH}
            height={estHeight} rx="2" fill="var(--color-muted)" />
      <rect x={x + BAR_WIDTH + GAP} y={baseY - compHeight}
            width={BAR_WIDTH} height={compHeight} rx="2"
            fill="var(--color-primary)" />
    </g>
  );
})}
```

---

## 13. Performance Strategy

### Component Memoisation

| Component | `React.memo` | Rationale |
|-----------|-------------|-----------|
| `TaskCard` | ✅ | Re-renders only when its specific task data changes; most important for large boards |
| `ColumnContainer` | ✅ | Prevents sibling column re-renders during single-column drag operations |
| `StatCard` | ✅ | 8 instances on dashboard; only re-render on analytics data change |
| `NavBoardList` items | ✅ | Stable sidebar list; prevents re-render on every task mutation |
| `ActivityEntry` | ✅ | Activity feed can contain 20+ items |
| `SearchResultItem` | ✅ | Rendered in a floating dropdown during live search |

### useMemo Applications

```typescript
// In useTasks — board-scoped view derived from global in-memory index
const tasks = useMemo(
  () => allTasks.filter((t) => t.boardId === boardId),
  [allTasks, boardId]
);

// In useTasks — filtered + sorted task list
const filteredTasks = useMemo(
  () => applyFiltersAndSort(tasks, filters, sortBy),
  [tasks, filters, sortBy]
);

// In useTasks — column-indexed map for O(1) lookup in ColumnContainer
const tasksByColumnId = useMemo(() => {
  return tasks.reduce<Record<string, Task[]>>((acc, task) => {
    (acc[task.columnId] ??= []).push(task);
    return acc;
  }, {});
}, [tasks]);

// In useAnalytics — analytics derived from live allTasks
const data = useMemo(
  () => analyticsService.compute(scopedTasks),
  [allTasks, selectedWorkspaceId]  // [tasks], not [tasks.length]
);

// In useAnalytics — productivity suggestions
const suggestions = useMemo(
  () => evaluateAllRules(allTasks, new Date()),
  [allTasks]
);

// In AnalyticsPage — chart data transformations
const chartData = useMemo(() => transformForCharts(analyticsData), [analyticsData]);
```

### useCallback Applications

```typescript
// In useTasks — stable drag handler
const handleDragEnd = useCallback((result: DropResult) => {
  // drag-drop logic
}, [moveTask]);

// In BoardPage — stable CRUD handlers passed to children
const handleCreateTask = useCallback((data: CreateTaskInput) => {
  createTask(data);
}, [createTask]);
```

### Lazy Loading

```typescript
const AnalyticsPage = React.lazy(() => import('../pages/AnalyticsPage'));
const ActivityPage  = React.lazy(() => import('../pages/ActivityPage'));
```

Vite splits these into separate chunks. Initial JS payload is reduced by the combined weight of all chart components and analytics computation logic.

### Skeleton Loaders

During storage hydration (`isLoading === true`), the UI renders `<Skeleton />` components matching the shape of real content:

- Sidebar: 3 workspace skeleton rows + 5 board skeleton rows
- Board: 3 column skeletons, each with 2 task card skeletons
- Dashboard: 8 stat card skeletons + activity feed skeleton

### Zustand Shallow Equality

```typescript
// Without shallow — re-renders on ANY store change ❌
const { boards, columns } = useBoardStore();

// With shallow — re-renders only when boards[] or columns[] reference changes ✅
const { boards, columns } = useBoardStore(
  (s) => ({ boards: s.boards, columns: s.columns }),
  shallow
);
```

### Framer Motion Budget

| Use case | Animated | Tool |
|----------|---------|------|
| Page navigation | ✅ | Framer Motion |
| Modal open/close | ✅ | Framer Motion |
| Task card mount | ✅ | Framer Motion |
| Stat card stagger | ✅ | Framer Motion |
| Button hover | ❌ | Tailwind `hover:` |
| Sidebar collapse | ❌ | Tailwind `transition-width` |
| Skeleton shimmer | ❌ | CSS `@keyframes` |

---

## 14. Accessibility Strategy

### Interactive Element Requirements

- Every icon-only button has an `aria-label` describing its action (e.g., `aria-label="Delete task"`, `aria-label="Close modal"`).
- Icon buttons that are purely decorative have `aria-hidden="true"` on the icon SVG.
- All `<select>` and `<input>` elements are associated with visible `<label>` elements via `htmlFor`/`id`.

### Modal Accessibility

```tsx
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <h2 id="modal-title">{task.title}</h2>
  <p id="modal-description" className="sr-only">
    Task detail and editing panel
  </p>
</div>
```

- **Focus trap:** On modal open, focus moves to the first focusable element. `Tab` and `Shift+Tab` cycle only within the modal.
- **Escape to close:** `useEffect` attaches `keydown` listener; `Escape` calls `onClose()`.
- **Focus restoration:** The element that triggered the modal is stored in a `ref`; on close, `triggerRef.current?.focus()` restores position.

### Drag and Drop Accessibility

```tsx
<div
  role="button"
  aria-roledescription="draggable task"
  aria-describedby="dnd-instructions"
  tabIndex={0}
>
  {/* task content */}
</div>
<p id="dnd-instructions" className="sr-only">
  Press Space to pick up, arrow keys to move, Space to drop, Escape to cancel.
</p>
```

`@hello-pangea/dnd` supports keyboard drag-drop natively. The `aria-describedby` instructs screen reader users on the keyboard interaction pattern.

### Colour Contrast

| Element | Light mode contrast | Dark mode contrast | WCAG target |
|---------|--------------------|--------------------|-------------|
| Body text on bg | ≥ 7:1 | ≥ 7:1 | AA (4.5:1) |
| Muted text on bg | ≥ 4.5:1 | ≥ 4.5:1 | AA (4.5:1) |
| Priority badge text | ≥ 4.5:1 | ≥ 4.5:1 | AA (4.5:1) |
| Button text on primary | ≥ 4.5:1 | ≥ 4.5:1 | AA (4.5:1) |
| Large heading on bg | ≥ 3:1 | ≥ 3:1 | AA large (3:1) |

### Focus Indicators

```css
/* Applied globally in index.css */
:focus-visible {
  @apply ring-2 ring-primary ring-offset-2 ring-offset-background outline-none;
}
```

### Skip Navigation

```tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4
             focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white
             focus:rounded focus:ring-2 focus:ring-offset-2"
>
  Skip to main content
</a>

<main id="main-content" tabIndex={-1}>
```

---

## 15. Responsive Strategy

### Breakpoint System

| Breakpoint | Value | Usage |
|-----------|-------|-------|
| (default) | < 640px | Mobile phones — single column, full-screen views |
| `sm:` | ≥ 640px | Large phones — minor spacing adjustments |
| `md:` | ≥ 768px | Tablets — sidebar visible (icon-only), 2-column layouts |
| `lg:` | ≥ 1024px | Desktop — full sidebar, full board view |
| `xl:` | ≥ 1280px | Wide desktop — expanded analytics grid |

### Mobile (< 768px)

- **Sidebar:** Hidden. A hamburger button in `TopBar` opens `MobileDrawer` — a full-width slide-in drawer using `Framer Motion x: -100% → 0`.
- **Board columns:** Horizontal scroll container (`overflow-x-auto`, scroll-snap). Each column is `min-w-[280px]`.
- **Dashboard:** Single-column grid (`grid-cols-1`). Stat cards stack vertically.
- **TaskModal:** Full-screen (`fixed inset-0`), no backdrop blur overlay.

### Tablet (768px – 1023px)

- **Sidebar:** Visible in icon-only mode (`w-16`). Shows workspace colour dots and board icons. Hover reveals a tooltip with the name.
- **Board columns:** 2–3 columns visible in viewport, horizontal scroll for more.
- **Dashboard:** `grid-cols-2` for stat cards.

### Desktop (≥ 1024px)

- **Sidebar:** Full expanded sidebar (`w-64`) showing workspace names, board names, navigation links.
- **Board columns:** All columns in a horizontal flex layout. Vertical scroll within each column.
- **Dashboard:** `grid-cols-4` for stat cards (two rows of 4).
- **Analytics:** `grid-cols-2` chart grid, `EstimatedVsCompletedChart` full-width.

### Sidebar Collapse Toggle

On desktop, a toggle button allows users to manually collapse the sidebar to icon-only mode. State is persisted via `preferencesStore.setSidebarCollapsed()`.

```tsx
<aside
  className={cn(
    'flex flex-col h-full transition-all duration-300',
    collapsed ? 'w-16' : 'w-64'
  )}
>
```

---

## 16. Animation Strategy

All animations follow a hierarchy: Framer Motion for meaningful state transitions; Tailwind `transition-*` utilities for subtle hover effects; CSS `@keyframes` for ambient effects like skeleton shimmer.

### Page Transitions

```tsx
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -10, transition: { duration: 0.15, ease: 'easeIn' } },
};

<AnimatePresence mode="wait">
  <motion.div key={location.pathname} {...pageVariants}>
    <Outlet />
  </motion.div>
</AnimatePresence>
```

### Modal Mount / Unmount

```tsx
const modalVariants = {
  hidden:  { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, scale: 0.95, transition: { duration: 0.15 } },
};

const backdropVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15 } },
  exit:    { opacity: 0 },
};
```

### Task Card Mount / Exit

```tsx
const cardVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
  exit:    { opacity: 0, y: 16, transition: { duration: 0.15, ease: 'easeIn' } },
};

<AnimatePresence initial={false}>
  {tasks.map((task) => (
    <motion.div key={task.id} layout {...cardVariants}>
      <TaskCard task={task} />
    </motion.div>
  ))}
</AnimatePresence>
```

The `layout` prop enables smooth positional reflow when tasks are reordered.

### Stat Card Stagger

```tsx
const containerVariants = {
  animate: { transition: { staggerChildren: TIMING.ANIMATION_STAGGER_MS / 1000 } },
};

const cardVariants = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

<motion.div variants={containerVariants} animate="animate">
  {stats.map((stat) => (
    <motion.div key={stat.id} variants={cardVariants}>
      <StatCard {...stat} />
    </motion.div>
  ))}
</motion.div>
```

### Hover Effects (Tailwind Only)

```tsx
// TaskCard
<div className="transition-transform duration-150 hover:scale-[1.01] hover:shadow-md cursor-pointer" />

// Button
<button className="transition-colors duration-150 hover:bg-primary/90 active:scale-[0.98]" />

// Sidebar item
<div className="transition-colors duration-100 hover:bg-zinc-100 dark:hover:bg-zinc-800" />
```

### Drag Ghost Styling

```tsx
<div
  className={cn(
    'transition-shadow',
    snapshot.isDragging && 'opacity-70 ring-2 ring-primary shadow-2xl rotate-1'
  )}
>
```

### Skeleton Shimmer

```css
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    theme('colors.zinc.100') 25%,
    theme('colors.zinc.200') 50%,
    theme('colors.zinc.100') 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite linear;
}

.dark .skeleton {
  background: linear-gradient(
    90deg,
    theme('colors.zinc.800') 25%,
    theme('colors.zinc.700') 50%,
    theme('colors.zinc.800') 75%
  );
  background-size: 200% 100%;
}
```

---

## 17. Error Handling Strategy

**Fix for Issue 7.** A missing error boundary strategy is a production defect, not a nice-to-have. A single unhandled render error in `ColumnContainer` or `TaskCard` will crash the entire board view without boundaries. This section defines the boundary strategy.

### Error Boundary Components

```
src/components/common/
├── ErrorBoundary.tsx         # Generic class-based error boundary
└── BoardErrorBoundary.tsx    # Board-specific boundary with recovery UI
```

### Generic ErrorBoundary

```tsx
// src/components/common/ErrorBoundary.tsx

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log to console in dev; swap for Sentry / Datadog in production
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <p className="text-sm text-muted-foreground">Something went wrong.</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-3 text-sm text-primary underline"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

### BoardErrorBoundary

```tsx
// src/components/common/BoardErrorBoundary.tsx

export class BoardErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[BoardErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-12 text-center">
          <h2 className="text-lg font-semibold mb-2">Board failed to render</h2>
          <p className="text-sm text-muted-foreground mb-4">
            An unexpected error occurred. Your data is safe.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="btn btn-primary"
          >
            Reload board
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

### Boundary Placement Strategy

| Location | Boundary | Fallback Shown |
|----------|----------|---------------|
| Each lazy-loaded page (`/analytics`, `/activity`) | `<ErrorBoundary>` outside `<Suspense>` | Generic "something went wrong" with retry |
| `<BoardView>` root | `<BoardErrorBoundary>` | Full-board recovery UI with "Reload board" |
| Each `<ColumnContainer>` | `<ErrorBoundary>` | Column-level fallback (column shows error, others unaffected) |
| `<TaskModal>` | `<ErrorBoundary>` (wraps modal content) | Modal shows error state instead of crashing the board |

### Graceful Degradation Rules

1. A column-level error must never crash the board. Other columns remain interactive.
2. A task modal error must never crash the board view behind it.
3. An analytics page crash must never affect the core board flow.
4. `ErrorBoundary.getDerivedStateFromError` must never throw — keep it a pure state assignment.
5. In production, replace `console.error` with a structured error reporting call.

### StorageService Error Handling

`StorageService.set()` swallows `QuotaExceededError` silently (logs to console). In the future, this should surface a toast notification to the user:

```typescript
set<T>(key: string, value: T): void {
  try {
    localStorage.setItem(this.key(key), JSON.stringify(value));
  } catch (err) {
    if (err instanceof DOMException && err.name === 'QuotaExceededError') {
      // Future: toast.error('Storage full. Some changes may not be saved.')
      console.error(`[StorageService] Quota exceeded writing "${key}"`);
    } else {
      console.error(`[StorageService] Failed to write key "${key}"`, err);
    }
  }
}
```

---

## 18. Constants & Configuration

**Fix for Issue 10.** All magic numbers are eliminated from the codebase and centralised in `src/config/constants.ts`. Every limit, timing value, and storage key name is defined once and imported by consuming modules.

```typescript
// src/config/constants.ts

/**
 * Hard limits enforced by the Service Layer.
 * These values are validated in service methods before writes.
 */
export const APP_LIMITS = {
  MAX_WORKSPACES: 20,
  MAX_BOARDS_PER_WORKSPACE: 50,
  MAX_COLUMNS_PER_BOARD: 10,
  MAX_TASKS_PER_COLUMN: 500,
  MAX_CHECKLIST_ITEMS: 50,
  MAX_COMMENTS_PER_TASK: 100,
  MAX_LABELS_PER_TASK: 10,
  MAX_ACTIVITIES_STORED: 500,
  MAX_TASK_TITLE_LENGTH: 120,
  MAX_WORKSPACE_NAME_LENGTH: 50,
  MAX_BOARD_NAME_LENGTH: 50,
} as const;

/**
 * UI timing constants.
 * Used in hooks, animations, and debounce utilities.
 */
export const TIMING = {
  SEARCH_DEBOUNCE_MS: 150,
  STORAGE_WRITE_DEBOUNCE_MS: 300,
  ANIMATION_FAST_MS: 150,
  ANIMATION_NORMAL_MS: 250,
  ANIMATION_STAGGER_MS: 80,
} as const;

/**
 * localStorage key suffixes (without the 'taskflow:' prefix).
 * Used exclusively by Repository implementations.
 * The prefix is applied by StorageService internally.
 */
export const STORAGE_KEYS = {
  WORKSPACES: 'workspaces',
  BOARDS: 'boards',
  COLUMNS: 'columns',
  TASKS: 'tasks',
  ACTIVITIES: 'activities',
  PREFERENCES: 'preferences',
} as const;
```

### Usage Pattern

```typescript
// In LocalStorageTaskRepository
import { STORAGE_KEYS, APP_LIMITS } from '../config/constants';

findAll(boardId: string): Task[] {
  const all = storageService.get<Task[]>(STORAGE_KEYS.TASKS) ?? [];
  return all.filter((t) => t.boardId === boardId);
}

// In TaskService
import { APP_LIMITS } from '../config/constants';

create(data: CreateTaskInput): Task {
  const tasks = taskRepository.findAll(data.boardId);
  if (tasks.length >= APP_LIMITS.MAX_TASKS_PER_COLUMN) {
    throw new Error(`Column has reached the limit of ${APP_LIMITS.MAX_TASKS_PER_COLUMN} tasks.`);
  }
  // ...
}

// In useSearch
import { TIMING } from '../config/constants';

useEffect(() => {
  const timer = setTimeout(() => setDebouncedQuery(query), TIMING.SEARCH_DEBOUNCE_MS);
  return () => clearTimeout(timer);
}, [query]);
```

### Why `as const`

Using `as const` on the constant objects:
- Produces literal types (`150` instead of `number`) enabling TypeScript to catch mismatches.
- Makes the objects readonly, preventing accidental mutation.
- No runtime overhead — these are plain objects.

---

## 19. Zod Schema Design

**Fix for Issue 8.** Zod schemas live in `src/schemas/`, organised by domain. Types are derived from schemas via `z.infer<typeof Schema>` where possible — the schema is the single source of truth for both runtime validation and the static TypeScript type.

### Schema File Structure

```
src/schemas/
├── task.schema.ts        # CreateTaskSchema, UpdateTaskSchema
├── board.schema.ts       # CreateBoardSchema, UpdateBoardSchema
├── workspace.schema.ts   # CreateWorkspaceSchema, UpdateWorkspaceSchema
└── column.schema.ts      # CreateColumnSchema, UpdateColumnSchema
```

### `src/schemas/task.schema.ts`

```typescript
import { z } from 'zod';
import { APP_LIMITS } from '../config/constants';

const PrioritySchema = z.enum(['low', 'medium', 'high', 'urgent']);

export const CreateTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(APP_LIMITS.MAX_TASK_TITLE_LENGTH, `Title must be ${APP_LIMITS.MAX_TASK_TITLE_LENGTH} characters or less`),
  columnId: z.string().uuid(),
  boardId: z.string().uuid(),
  workspaceId: z.string().uuid(),
  description: z.string().optional(),
  priority: PrioritySchema.optional().default('medium'),
  labels: z.array(z.string().uuid()).max(APP_LIMITS.MAX_LABELS_PER_TASK).optional().default([]),
  dueDate: z.string().datetime().nullable().optional().default(null),
  estimatedHours: z.number().min(0).max(999).optional().default(0),
});

export const UpdateTaskSchema = z.object({
  title: z
    .string()
    .min(1)
    .max(APP_LIMITS.MAX_TASK_TITLE_LENGTH)
    .optional(),
  description: z.string().optional(),
  priority: PrioritySchema.optional(),
  labels: z.array(z.string().uuid()).max(APP_LIMITS.MAX_LABELS_PER_TASK).optional(),
  dueDate: z.string().datetime().nullable().optional(),
  estimatedHours: z.number().min(0).max(999).optional(),
});

// Types derived from schemas — no separate interface needed for form inputs
export type CreateTaskFormData = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskFormData = z.infer<typeof UpdateTaskSchema>;
```

### `src/schemas/board.schema.ts`

```typescript
import { z } from 'zod';
import { APP_LIMITS } from '../config/constants';

export const CreateBoardSchema = z.object({
  name: z
    .string()
    .min(1, 'Board name is required')
    .max(APP_LIMITS.MAX_BOARD_NAME_LENGTH),
  workspaceId: z.string().uuid(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  icon: z.string().max(2).optional(), // emoji
});

export const UpdateBoardSchema = CreateBoardSchema.partial().omit({ workspaceId: true });

export type CreateBoardFormData = z.infer<typeof CreateBoardSchema>;
export type UpdateBoardFormData = z.infer<typeof UpdateBoardSchema>;
```

### `src/schemas/workspace.schema.ts`

```typescript
import { z } from 'zod';
import { APP_LIMITS } from '../config/constants';

export const CreateWorkspaceSchema = z.object({
  name: z
    .string()
    .min(1, 'Workspace name is required')
    .max(APP_LIMITS.MAX_WORKSPACE_NAME_LENGTH),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex colour'),
  icon: z.string().max(2).optional(),
});

export const UpdateWorkspaceSchema = CreateWorkspaceSchema.partial();

export type CreateWorkspaceFormData = z.infer<typeof CreateWorkspaceSchema>;
export type UpdateWorkspaceFormData = z.infer<typeof UpdateWorkspaceSchema>;
```

### `src/schemas/column.schema.ts`

```typescript
import { z } from 'zod';

export const CreateColumnSchema = z.object({
  name: z.string().min(1, 'Column name is required').max(50),
  boardId: z.string().uuid(),
});

export const UpdateColumnSchema = z.object({
  name: z.string().min(1).max(50),
});

export type CreateColumnFormData = z.infer<typeof CreateColumnSchema>;
export type UpdateColumnFormData = z.infer<typeof UpdateColumnSchema>;
```

### Integration with React Hook Form

```tsx
// src/components/forms/TaskForm.tsx

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateTaskSchema, type CreateTaskFormData } from '../../schemas/task.schema';

export function TaskForm({ onSubmit }: TaskFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<CreateTaskFormData>({
    resolver: zodResolver(CreateTaskSchema),
    defaultValues: { priority: 'medium', labels: [], dueDate: null, estimatedHours: 0 },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input
        {...register('title')}
        label="Title"
        error={errors.title?.message}
      />
      {/* ... */}
    </form>
  );
}
```

**Key design decision:** schemas import from `constants.ts` for limit values so that changes to limits (e.g., raising `MAX_TASK_TITLE_LENGTH`) propagate automatically to both validation and error messages.

---

## 20. Future Backend Integration Plan

The architecture was designed from day one to support a REST (or GraphQL) backend with zero UI changes. The integration path is a series of isolated repository substitutions, not a rewrite.

### Step 1 — Replace Repository Implementations

**Fix for Issue 1 payoff.** Because the Service Layer depends on `ITaskRepository`, `IBoardRepository`, etc. — not on `IStorageService` — swapping backends requires only creating new `Api*Repository` implementations.

```typescript
// src/repositories/ApiTaskRepository.ts

import type { ITaskRepository } from './interfaces';
import type { Task } from '../types/task.types';

export class ApiTaskRepository implements ITaskRepository {
  private baseUrl = import.meta.env.VITE_API_URL;
  private token: string | null = null;

  async findAll(boardId: string): Promise<Task[]> {
    // REST: GET /api/tasks?boardId=xyz  (server-side filtering)
    const res = await fetch(`${this.baseUrl}/tasks?boardId=${boardId}`, {
      headers: { Authorization: `Bearer ${this.token}` },
    });
    if (!res.ok) return [];
    return res.json();
  }

  async findAllAcrossWorkspaces(): Promise<Task[]> {
    // REST: GET /api/tasks  (all tasks for authenticated user)
    const res = await fetch(`${this.baseUrl}/tasks`, {
      headers: { Authorization: `Bearer ${this.token}` },
    });
    if (!res.ok) return [];
    return res.json();
  }

  async findById(id: string): Promise<Task | null> {
    const res = await fetch(`${this.baseUrl}/tasks/${id}`, {
      headers: { Authorization: `Bearer ${this.token}` },
    });
    if (!res.ok) return null;
    return res.json();
  }

  async save(task: Task): Promise<void> {
    await fetch(`${this.baseUrl}/tasks/${task.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify(task),
    });
  }

  async delete(id: string): Promise<void> {
    await fetch(`${this.baseUrl}/tasks/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${this.token}` },
    });
  }
}
```

To swap implementations, change a single file:

```typescript
// src/repositories/index.ts — single place to swap

const useApi = import.meta.env.VITE_USE_API === 'true';

export const taskRepository: ITaskRepository = useApi
  ? new ApiTaskRepository()
  : new LocalStorageTaskRepository();

export const boardRepository: IBoardRepository = useApi
  ? new ApiBoardRepository()
  : new LocalStorageBoardRepository();

// ... other repositories
```

**Zero changes required in services, stores, hooks, or UI components.**

---

### Step 2 — Authentication

```
src/
├── store/
│   └── authStore.ts          # NEW: holds user, token, isAuthenticated
├── pages/
│   ├── LoginPage.tsx          # NEW
│   └── RegisterPage.tsx       # NEW
└── components/
    └── layout/
        └── AuthGuard.tsx      # NEW: wraps AppLayout route
```

Route tree change:

```tsx
<Route element={<AuthGuard />}>        // NEW wrapper
  <Route element={<AppLayout />}>
    {/* All existing routes unchanged */}
  </Route>
</Route>
<Route path="/login" element={<LoginPage />} />
<Route path="/register" element={<RegisterPage />} />
```

`Api*Repository` instances read the JWT from `authStore.token` and inject it into every request header. `LocalStorage*Repository` implementations are unaffected.

---

### Step 3 — Optimistic Updates

The task store already applies state changes immediately (before service calls). To add rollback on API failure:

```typescript
// taskStore.ts — pattern for optimistic + rollback
createTask(data) {
  const snapshot = get().allTasks;
  const tempTask = buildOptimisticTask(data);
  set((s) => ({ allTasks: [...s.allTasks, tempTask] }));

  taskService.create(data)
    .then((persisted) => {
      set((s) => ({
        allTasks: s.allTasks.map((t) => t.id === tempTask.id ? persisted : t),
      }));
    })
    .catch(() => {
      set({ allTasks: snapshot });
      // toast.error('Failed to create task. Please try again.')
    });
},
```

No UI component changes required — they already see immediate updates through the store.

---

### Step 4 — Real-time Updates

```typescript
// src/services/RealtimeService.ts — NEW

class RealtimeService {
  private ws: WebSocket | null = null;

  connect(workspaceId: string) {
    this.ws = new WebSocket(`${WS_URL}/workspace/${workspaceId}`);
    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data) as RealtimeMessage;
      this.dispatch(msg);
    };
  }

  private dispatch(msg: RealtimeMessage) {
    switch (msg.type) {
      case 'task_created':
        useTaskStore.setState((s) => ({ allTasks: [...s.allTasks, msg.payload] }));
        break;
      case 'task_updated':
        useTaskStore.setState((s) => ({
          allTasks: s.allTasks.map((t) => t.id === msg.payload.id ? msg.payload : t),
        }));
        break;
      // ... other event types
    }
  }
}
```

UI components are already reactive to Zustand store changes. Real-time updates from other users appear automatically. **Zero UI component changes.**

---

### Step 5 — Pagination

```typescript
// Before
taskRepository.findAll(boardId: string): Task[]

// After — backward compatible
taskRepository.findAll(boardId: string, pagination?: {
  page: number;
  limit: number;
}): Promise<{ tasks: Task[]; total: number; hasMore: boolean }>
```

The store adds a `hasMore` flag and `appendTasks()` action for infinite scroll. Board components add a `<LoadMoreButton>` at the bottom of each column. The rest of the component tree is untouched.

---

### Migration Checklist Summary

| Phase | Files Changed | UI Changes | Breaking |
|-------|--------------|-----------|---------|
| Repository swap (localStorage → API) | 1 (`repositories/index.ts`) | None | No |
| Authentication | +3 new files, route tree | Login/Register pages only | No |
| Optimistic rollback | `taskStore.ts`, `boardStore.ts` | Toast notification only | No |
| Real-time | +1 new file (`RealtimeService.ts`) | None | No |
| Pagination | Repository interfaces + stores | Load-more buttons only | No |

The UI layer is entirely insulated from backend concerns. This is the core architectural dividend of the Repository Pattern separation.

---

*End of TaskFlow Technical Design Document v2.0*

*Reviewed and revised by Principal Architect. All 10 architectural issues identified and resolved. Document is ready for senior engineering review and implementation.*
