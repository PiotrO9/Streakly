/**
 * Migration Registry
 *
 * All database migrations must be registered here in execution order.
 * Each migration is identified by a unique version number.
 */

export interface Migration {
  version: number;
  name: string;
  sql: string;
}

export const migrations: readonly Migration[] = [
  {
    version: 1,
    name: 'create_addictions_table',
    sql: `-- Migration: Create addictions table
-- Version: 001
-- Description: Initial schema for storing addiction tracking data

CREATE TABLE IF NOT EXISTS addictions (
  id TEXT NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  last_reset_at INTEGER
);

-- Index for sorting by creation date (common query pattern)
CREATE INDEX IF NOT EXISTS idx_addictions_created_at ON addictions(created_at);

-- Index for filtering by last reset (useful for streak calculations)
CREATE INDEX IF NOT EXISTS idx_addictions_last_reset_at ON addictions(last_reset_at);`,
  },
  {
    version: 2,
    name: 'create_reset_history_table',
    sql: `-- Migration: Create reset_history table
-- Version: 002
-- Description: Historical log of reset events for addictions

CREATE TABLE IF NOT EXISTS reset_history (
  id TEXT NOT NULL PRIMARY KEY,
  addiction_id TEXT NOT NULL,
  reset_at INTEGER NOT NULL
);

-- Index for querying resets by addiction (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_reset_history_addiction_id ON reset_history(addiction_id);

-- Index for sorting resets chronologically per addiction
CREATE INDEX IF NOT EXISTS idx_reset_history_addiction_reset_at ON reset_history(addiction_id, reset_at);`,
  },
] as const;
