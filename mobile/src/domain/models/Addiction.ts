// Domain model for Addiction entity

/**
 * Unique identifier for an Addiction.
 * Kept as a string for portability across SQLite + future backend sync.
 */
export type AddictionId = string;

/**
 * Optional classification to support dashboard grouping and future analytics.
 */
export type AddictionCategory = 'substance' | 'behavioral' | 'custom';

/**
 * Why the streak was reset. Useful for future analytics/history.
 */
export type ResetReason = 'relapse' | 'slip' | 'planned' | 'manual' | 'unknown';

/**
 * A single reset event in the addiction's lifecycle (domain history).
 * This is domain meaning (not UI state and not persistence implementation detail).
 */
export interface AddictionResetEvent {
  /**
   * Unique identifier for the event (helps with deduplication during future sync).
   */
  id: string;

  /**
   * When the reset occurred.
   */
  occurredAt: Date;

  /**
   * Why it occurred (supports analytics later).
   */
  reason: ResetReason;

  /**
   * Optional free-form note describing context.
   */
  note?: string;
}

/**
 * Optional metadata to enrich dashboard display and future analytics
 * without changing the core entity fields.
 */
export interface AddictionMetadata {
  /**
   * Category for grouping/insights.
   */
  category?: AddictionCategory;

  /**
   * Stable icon identifier (domain identity, not rendering implementation).
   */
  iconKey?: string;

  /**
   * Stable color identifier (domain identity, not styling implementation).
   */
  colorKey?: string;

  /**
   * User-defined tags for filtering and analytics.
   */
  tags?: string[];
}

/**
 * Optional sync-related info for future backend compatibility.
 * MVP can omit this entirely (offline-only).
 */
export interface SyncInfo {
  /**
   * Server-side identifier once synced.
   */
  remoteId?: string;

  /**
   * Monotonic revision number for conflict resolution/optimistic concurrency.
   * Increment on every meaningful domain change (rename/reset/archive/etc.).
   */
  revision: number;

  /**
   * When the entity was last changed locally.
   */
  updatedAt: Date;

  /**
   * When this entity was last successfully synced.
   */
  lastSyncedAt?: Date;
}

/**
 * Aggregate Root: Addiction being tracked.
 *
 * Streak is derived from `lastResetAt` (e.g. "days since last reset").
 * This model stores source-of-truth domain data only.
 */
export interface Addiction {
  /**
   * Unique local identifier (stable offline).
   */
  id: AddictionId;

  /**
   * Display name of the addiction being tracked (e.g. "Smoking").
   */
  name: string;

  /**
   * When tracking started.
   */
  createdAt: Date;

  /**
   * Timestamp of the most recent reset.
   * For a brand-new addiction, set `lastResetAt` to `createdAt`.
   */
  lastResetAt: Date;

  /**
   * Longest achieved streak in whole days, stored for dashboard display.
   */
  longestStreakDays: number;

  /**
   * Total number of resets, stored for quick analytics.
   */
  resetCount: number;

  /**
   * Whether the addiction is currently tracked.
   * Prefer archiving over deleting to preserve history/analytics.
   */
  isArchived: boolean;

  /**
   * When it was archived (if archived).
   */
  archivedAt?: Date;

  /**
   * Optional richer history. Keep optional to avoid MVP overhead.
   */
  resetHistory?: AddictionResetEvent[];

  /**
   * Optional enrichment metadata.
   */
  metadata?: AddictionMetadata;

  /**
   * Optional sync info for future backend compatibility.
   */
  sync?: SyncInfo;
}

/**
 * Helper type: minimal shape needed to compute a streak.
 */
export type StreakSource = Pick<Addiction, 'lastResetAt'>;

