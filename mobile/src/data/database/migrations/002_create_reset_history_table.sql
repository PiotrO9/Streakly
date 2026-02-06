-- Migration: Create reset_history table
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
CREATE INDEX IF NOT EXISTS idx_reset_history_addiction_reset_at ON reset_history(addiction_id, reset_at);

-- Foreign key constraint (optional - see notes below)
-- CREATE INDEX IF NOT EXISTS idx_reset_history_addiction_fk ON reset_history(addiction_id);
-- Note: Foreign key enforcement requires PRAGMA foreign_keys = ON (handled in db.ts)
