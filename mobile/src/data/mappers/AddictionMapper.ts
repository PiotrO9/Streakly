// Mapper functions for converting between Addiction domain models and SQLite rows
import type { Addiction } from '@/domain/models/Addiction';

/**
 * Database row representation of an Addiction.
 * Matches the current SQLite schema (migration 001).
 *
 * Note: Current schema only stores id, name, created_at, last_reset_at.
 * Other domain fields (longestStreakDays, resetCount, isArchived, etc.)
 * are handled via defaults when mapping from row to domain.
 */
export interface AddictionRow {
  id: string;
  name: string;
  created_at: number; // Unix timestamp in milliseconds (INTEGER)
  last_reset_at: number | null; // Unix timestamp in milliseconds (INTEGER), nullable
}

/**
 * Values for INSERT/UPDATE operations.
 * Matches the order and types expected by SQLite parameterized queries.
 */
export type AddictionRowValues = [string, string, number, number | null];

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
 * Maps a database row to a domain Addiction entity.
 *
 * Handles:
 * - Timestamp conversion (INTEGER milliseconds → Date)
 * - Nullable fields (last_reset_at → lastResetAt)
 * - Default values for fields not yet in schema (MVP limitation)
 *
 * @param row - Database row from SQLite query
 * @returns Domain Addiction entity
 *
 * @example
 * ```typescript
 * const row: AddictionRow = {
 *   id: 'abc-123',
 *   name: 'Smoking',
 *   created_at: 1705315800000,
 *   last_reset_at: 1705315800000,
 * };
 *
 * const addiction = rowToDomain(row);
 * // Returns: {
 * //   id: 'abc-123',
 * //   name: 'Smoking',
 * //   createdAt: Date('2024-01-15T10:30:00Z'),
 * //   lastResetAt: Date('2024-01-15T10:30:00Z'),
 * //   longestStreakDays: 0,
 * //   resetCount: 0,
 * //   isArchived: false,
 * //   archivedAt: undefined,
 * //   resetHistory: undefined,
 * //   metadata: undefined,
 * //   sync: undefined,
 * // }
 * ```
 */
export function rowToDomain(row: AddictionRow): Addiction {
  const createdAt = timestampToDate(row.created_at);

  // If last_reset_at is null, use createdAt (new addiction, no resets yet)
  const lastResetAt = row.last_reset_at ? timestampToDate(row.last_reset_at) : createdAt;

  return {
    id: row.id,
    name: row.name,
    createdAt,
    lastResetAt,
    // Default values for fields not yet in schema (MVP)
    longestStreakDays: 0,
    resetCount: 0,
    isArchived: false,
    // Optional fields omitted (will be undefined)
    archivedAt: undefined,
    resetHistory: undefined,
    metadata: undefined,
    sync: undefined,
  };
}

/**
 * Maps a domain Addiction entity to database row values for INSERT/UPDATE.
 *
 * Only includes fields that exist in the current schema.
 * Other domain fields (longestStreakDays, resetCount, etc.) are not persisted yet.
 *
 * @param addiction - Domain Addiction entity
 * @returns Array of values in order: [id, name, created_at, last_reset_at]
 *
 * @example
 * ```typescript
 * const addiction: Addiction = {
 *   id: 'abc-123',
 *   name: 'Smoking',
 *   createdAt: new Date('2024-01-15T10:30:00Z'),
 *   lastResetAt: new Date('2024-01-15T10:30:00Z'),
 *   longestStreakDays: 5,
 *   resetCount: 1,
 *   isArchived: false,
 * };
 *
 * const values = domainToRowValues(addiction);
 * // Returns: ['abc-123', 'Smoking', 1705315800000, 1705315800000]
 * ```
 */
export function domainToRowValues(addiction: {
  id: string;
  name: string;
  createdAt: Date;
  lastResetAt: Date;
}): AddictionRowValues {
  return [
    addiction.id,
    addiction.name,
    dateToTimestamp(addiction.createdAt),
    dateToTimestamp(addiction.lastResetAt),
  ];
}
