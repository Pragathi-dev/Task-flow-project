/**
 * Repository singletons — active REST API implementations.
 * Keeps LocalStorage repository files intact for reference or fallbacks.
 */
export { apiWorkspaceRepository as workspaceRepository } from './ApiWorkspaceRepository';
export { apiBoardRepository as boardRepository } from './ApiBoardRepository';
export { apiColumnRepository as columnRepository } from './ApiColumnRepository';
export { apiTaskRepository as taskRepository } from './ApiTaskRepository';
export { apiActivityRepository as activityRepository } from './ApiActivityRepository';
export { apiPreferencesRepository as preferencesRepository } from './ApiPreferencesRepository';

// Re-export interfaces
export type {
  IWorkspaceRepository,
  IBoardRepository,
  IColumnRepository,
  ITaskRepository,
  IActivityRepository,
  IPreferencesRepository,
} from './interfaces';
