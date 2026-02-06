-- Migration: Create addictions table
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
CREATE INDEX IF NOT EXISTS idx_addictions_last_reset_at ON addictions(last_reset_at);
