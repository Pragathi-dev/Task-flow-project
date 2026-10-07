/**
 * Smart Productivity Assistant types.
 * The rule engine is pure — no stores, no side effects.
 */
import type { Task } from './task.types';

/** Severity classification for the rule engine output. */
export type SuggestionSeverity = 'critical' | 'warning' | 'info';

/** Type tag to drive suggestion UI differentiation. */
export type SuggestionType =
  | 'overdue'
  | 'deadline_approaching'
  | 'stalled_urgent'
  | 'split_task'
  | 'productivity_score';

/**
 * A single actionable suggestion produced by the rule engine.
 * Rendered in ProductivityBanner and the dashboard feed.
 */
export interface ProductivitySuggestion {
  /** UUID v4 */
  id: string;
  type: SuggestionType;
  severity: SuggestionSeverity;
  /** Short headline */
  title: string;
  /** Full explanation with optional call-to-action */
  message: string;
  /** If the suggestion relates to a specific task */
  taskId?: string;
  /** ISO 8601 timestamp of suggestion generation */
  createdAt: string;
}

/**
 * Interface for a productivity rule.
 * Each rule is a pure function that evaluates a single task.
 */
export interface ProductivityRule {
  /** Unique identifier for deduplication */
  id: string;
  /**
   * Evaluate a single task against this rule.
   * Returns a suggestion if the rule fires, null otherwise.
   * Must be a pure function with no side effects.
   */
  evaluate(task: Task, now: Date): ProductivitySuggestion | null;
}
