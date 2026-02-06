// Domain model for Reset History entries
import type { AddictionId, ResetReason, SyncInfo } from './Addiction';

/**
 * Unique identifier for a Reset History entry.
 * Kept as a string for portability across SQLite and future backend sync.
 */
export type ResetHistoryId = string;

/**
 * Optional metadata to enrich reset history entries without changing
 * the core business fields.
 */
export interface ResetHistoryMetadata {
  /**
   * Who initiated this reset entry.
   * - 'user'   → explicitly triggered by the user
   * - 'system' → created automatically by the app (e.g., migration, auto-fix)
   */
  createdBy?: 'user' | 'system';

  /**
   * Whether this entry was backfilled for a past date
   * (useful for analytics and conflict resolution).
   */
  isBackfilled?: boolean;

  /**
   * Timezone offset (in minutes) at the moment of the reset.
   * Helps with accurate calendar/day-based analytics.
   *
   * Examples:
   * - UTC    → 0
   * - UTC+1  → 60
   * - UTC-5  → -300
   */
  timezoneOffsetMinutes?: number;
}

/**
 * A single historical reset of an addiction streak.
 * This is domain meaning (not UI state and not a raw DB row).
 */
export interface ResetHistoryEntry {
  /**
   * Unique identifier for this reset history entry.
   * Helps with deduplication and future synchronization.
   */
  id: ResetHistoryId;

  /**
   * Reference to the addiction whose streak was reset.
   * Uses the domain-level AddictionId, not a database primary key.
   */
  addictionId: AddictionId;

  /**
   * When the reset actually happened in the user's life.
   * Used for time-based calculations (streaks, charts, analytics).
   */
  occurredAt: Date;

  /**
   * When this reset entry was recorded in the app.
   * May differ from occurredAt if the user logs the reset later.
   */
  recordedAt: Date;

  /**
   * Business reason for the reset.
   * Reuses the shared ResetReason domain type.
   */
  reason: ResetReason;

  /**
   * Number of whole days in the streak just before the reset.
   * Useful for analytics (e.g., average streak length before relapse).
   */
  previousStreakDays: number;

  /**
   * Number of whole days in the streak immediately after the reset.
   * For a classic reset this will usually be 0, but it is kept explicit
   * in case future rules allow different post-reset behavior.
   */
  newStreakDays: number;

  /**
   * Optional free-form note describing the context of the reset.
   */
  note?: string;

  /**
   * Optional enrichment metadata for analytics and future features.
   */
  metadata?: ResetHistoryMetadata;

  /**
   * Optional sync-related info for future backend compatibility.
   * Mirrors the pattern used in the Addiction entity.
   */
  sync?: SyncInfo;
}

/**
 * Example (for typing/understanding):
 *
 * const entry: ResetHistoryEntry = {
 *   id: 'reset_2025_01_15_001',
 *   addictionId: 'addiction_smoking_001',
 *   occurredAt: new Date('2025-01-15T21:30:00.000Z'),
 *   recordedAt: new Date('2025-01-15T21:35:00.000Z'),
 *   reason: 'relapse',
 *   previousStreakDays: 12,
 *   newStreakDays: 0,
 *   note: 'Strong craving after stressful day at work.',
 *   metadata: { createdBy: 'user', isBackfilled: false, timezoneOffsetMinutes: 60 },
 *   sync: { revision: 1, updatedAt: new Date('2025-01-15T21:35:00.000Z') },
 * };
 */
