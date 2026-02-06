// Mapper functions for converting between ResetHistoryEntry domain models and SQLite rows
import type { ResetHistoryEntry } from '@/domain/models/ResetHistory';
import type { AddictionId } from '@/domain/models/Addiction';

/**
 * Database row representation of a ResetHistoryEntry.
 * Matches the current SQLite schema (migration 002).
 *
 * Note: Current schema only stores id, addiction_id, reset_at.
 * Other domain fields (occurredAt vs recordedAt, reason, previousStreakDays, etc.)
 * are handled via defaults when mapping from row to domain.
 */
export interface ResetHistoryRow {
  id: string;
  addiction_id: string;
  reset_at: number; // Unix timestamp in milliseconds (INTEGER)
}

/**
 * Values for INSERT operations.
 * Matches the order and types expected by SQLite parameterized queries.
 */
export type ResetHistoryRowValues = [string, string, number];

/**
 * Converts a Date to Unix timestamp in milliseconds (SQLite INTEGER).
 *
 * @param date - Date object to convert
 * @returns Unix timestamp in milliseconds
 *
 * @example
 * ```typescript
 * const timestamp = dateToTimestamp(new Date('2024-01-15T10:30:00Z'));
 * // Returns: 1705315800000
 * ```
 */
export function dateToTimestamp(date: Date): number {
  return date.getTime();
}

/**
 * Converts a Unix timestamp in milliseconds to a Date object.
 *
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Date object
 *
 * @example
 * ```typescript
 * const date = timestampToDate(1705315800000);
 * // Returns: Date object representing 2024-01-15T10:30:00Z
 * ```
 */
export function timestampToDate(timestamp: number): Date {
  return new Date(timestamp);
}

/**
 * Maps a database row to a domain ResetHistoryEntry entity.
 *
 * Handles:
 * - Timestamp conversion (INTEGER milliseconds → Date)
 * - Default values for fields not yet in schema (MVP limitation)
 * - MVP limitation: recordedAt uses same timestamp as occurredAt
 *
 * @param row - Database row from SQLite query
 * @returns Domain ResetHistoryEntry entity
 *
 * @example
 * ```typescript
 * const row: ResetHistoryRow = {
 *   id: 'reset-123',
 *   addiction_id: 'abc-123',
 *   reset_at: 1705315800000,
 * };
 *
 * const entry = rowToDomain(row);
 * // Returns: {
 * //   id: 'reset-123',
 * //   addictionId: 'abc-123',
 * //   occurredAt: Date('2024-01-15T10:30:00Z'),
 * //   recordedAt: Date('2024-01-15T10:30:00Z'), // MVP: same as occurredAt
 * //   reason: 'unknown',
 * //   previousStreakDays: 0,
 * //   newStreakDays: 0,
 * //   note: undefined,
 * //   metadata: undefined,
 * //   sync: undefined,
 * // }
 * ```
 */
export function rowToDomain(row: ResetHistoryRow): ResetHistoryEntry {
  const occurredAt = timestampToDate(row.reset_at);

  // MVP limitation: recordedAt uses same timestamp as occurredAt
  // Future migration should add recorded_at column
  const recordedAt = occurredAt;

  return {
    id: row.id,
    addictionId: row.addiction_id,
    occurredAt,
    recordedAt,
    // Default values for fields not yet in schema (MVP)
    reason: 'unknown',
    previousStreakDays: 0,
    newStreakDays: 0,
    // Optional fields omitted (will be undefined)
    note: undefined,
    metadata: undefined,
    sync: undefined,
  };
}

/**
 * Maps a domain ResetHistoryEntry entity to database row values for INSERT.
 *
 * Only includes fields that exist in the current schema.
 * Other domain fields (recordedAt, reason, previousStreakDays, etc.) are not persisted yet.
 *
 * Note: Only stores occurredAt as reset_at (MVP limitation).
 * Future migration should add columns for recordedAt, reason, etc.
 *
 * @param entry - Domain ResetHistoryEntry entity (or minimal input shape)
 * @returns Array of values in order: [id, addiction_id, reset_at]
 *
 * @example
 * ```typescript
 * const entry: ResetHistoryEntry = {
 *   id: 'reset-123',
 *   addictionId: 'abc-123',
 *   occurredAt: new Date('2024-01-15T10:30:00Z'),
 *   recordedAt: new Date('2024-01-15T10:35:00Z'),
 *   reason: 'relapse',
 *   previousStreakDays: 12,
 *   newStreakDays: 0,
 * };
 *
 * const values = domainToRowValues(entry);
 * // Returns: ['reset-123', 'abc-123', 1705315800000]
 * ```
 */
export function domainToRowValues(input: {
  id: string;
  addictionId: AddictionId;
  occurredAt: Date;
}): ResetHistoryRowValues {
  return [
    input.id,
    input.addictionId,
    dateToTimestamp(input.occurredAt),
  ];
}
