// SQLite implementation of ResetHistory repository
import { DatabaseError, executeQuery, executeQueryOne, executeRun } from '@/data/database/db';
import type { AddictionId } from '@/domain/models/Addiction';
import type { ResetHistoryEntry, ResetHistoryId } from '@/domain/models/ResetHistory';

import type { CreateResetHistoryInput, IResetHistoryRepository } from './IResetHistoryRepository';

/**
 * Generates a UUID v4 string.
 * Uses expo-crypto if available, falls back to simple implementation for MVP.
 */
function generateUUID(): string {
  // Try expo-crypto first (part of Expo SDK)
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { randomUUID } = require('expo-crypto');
    return randomUUID();
  } catch {
    // Fallback: simple UUID v4 generator for MVP
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}

/**
 * Database row representation of a ResetHistoryEntry.
 * Matches the current SQLite schema (migration 002).
 *
 * Note: Current schema only stores id, addiction_id, reset_at.
 * Missing fields (occurredAt vs recordedAt, reason, previousStreakDays, etc.)
 * are handled via defaults in rowToDomain mapping.
 * Future migrations should add these columns.
 */
interface ResetHistoryRow {
  id: string;
  addiction_id: string;
  reset_at: number; // Unix timestamp in milliseconds
}

/**
 * SQLite implementation of IResetHistoryRepository.
 *
 * Maps between domain models (ResetHistoryEntry) and database rows (ResetHistoryRow).
 * Handles timestamp conversion (Date ↔ INTEGER milliseconds).
 *
 * Schema Limitation (MVP):
 * - Current migration only stores: id, addiction_id, reset_at
 * - Domain model has: occurredAt, recordedAt, reason, previousStreakDays, newStreakDays, note, metadata, sync
 * - For MVP: reset_at maps to occurredAt (recordedAt uses same value), other fields use defaults
 * - Future migration should add columns for full domain model support
 */
export class ResetHistoryRepository implements IResetHistoryRepository {
  /**
   * Converts a Date to Unix timestamp in milliseconds (SQLite INTEGER).
   */
  private static dateToTimestamp(date: Date): number {
    return date.getTime();
  }

  /**
   * Converts a Unix timestamp in milliseconds to a Date object.
   */
  private static timestampToDate(timestamp: number): Date {
    return new Date(timestamp);
  }

  /**
   * Maps a database row to a domain ResetHistoryEntry entity.
   *
   * Note: Current schema only stores id, addiction_id, reset_at.
   * Missing fields are set to defaults:
   * - occurredAt and recordedAt both use reset_at (MVP limitation)
   * - reason defaults to 'unknown'
   * - previousStreakDays and newStreakDays default to 0
   * - note, metadata, sync are undefined
   *
   * Future migrations should add columns for full domain model support.
   */
  private static rowToDomain(row: ResetHistoryRow): ResetHistoryEntry {
    const occurredAt = this.timestampToDate(row.reset_at);
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
   * Note: Only stores occurredAt as reset_at (MVP limitation).
   * Future migration should add columns for recordedAt, reason, etc.
   */
  private static domainToRowValues(input: {
    id: string;
    addictionId: AddictionId;
    occurredAt: Date;
  }): [string, string, number] {
    return [input.id, input.addictionId, this.dateToTimestamp(input.occurredAt)];
  }

  async create(input: CreateResetHistoryInput): Promise<ResetHistoryEntry> {
    const id = generateUUID();

    const sql = `
      INSERT INTO reset_history (id, addiction_id, reset_at)
      VALUES (?, ?, ?)
    `;
    const params = ResetHistoryRepository.domainToRowValues({
      id,
      addictionId: input.addictionId,
      occurredAt: input.occurredAt,
    });

    try {
      await executeRun(sql, params);

      // Return the created entity (mapped from input + generated id)
      // Note: Current schema doesn't store recordedAt, reason, streak days, note
      // These are preserved from input for domain consistency
      return {
        id,
        addictionId: input.addictionId,
        occurredAt: input.occurredAt,
        recordedAt: input.recordedAt,
        reason: input.reason,
        previousStreakDays: input.previousStreakDays,
        newStreakDays: input.newStreakDays,
        note: input.note,
        metadata: undefined,
        sync: undefined,
      };
    } catch (error) {
      // Re-throw DatabaseError as-is, wrap others
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(
        `Failed to create ResetHistoryEntry: ${error instanceof Error ? error.message : String(error)}`,
        sql,
        params,
        error
      );
    }
  }

  async findById(id: ResetHistoryId): Promise<ResetHistoryEntry | null> {
    const sql = `SELECT id, addiction_id, reset_at FROM reset_history WHERE id = ?`;
    const params: [string] = [id];

    try {
      const row = await executeQueryOne<ResetHistoryRow>(sql, params);

      if (!row) {
        return null;
      }

      return ResetHistoryRepository.rowToDomain(row);
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(
        `Failed to find ResetHistoryEntry by id: ${error instanceof Error ? error.message : String(error)}`,
        sql,
        params,
        error
      );
    }
  }

  async findByAddictionId(addictionId: AddictionId): Promise<ResetHistoryEntry[]> {
    const sql = `
      SELECT id, addiction_id, reset_at 
      FROM reset_history 
      WHERE addiction_id = ? 
      ORDER BY reset_at DESC
    `;
    const params: [string] = [addictionId];

    try {
      const result = await executeQuery<ResetHistoryRow>(sql, params);

      return result.rows.map(row => ResetHistoryRepository.rowToDomain(row));
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(
        `Failed to find ResetHistoryEntry by addictionId: ${error instanceof Error ? error.message : String(error)}`,
        sql,
        params,
        error
      );
    }
  }

  async findAll(): Promise<ResetHistoryEntry[]> {
    const sql = `
      SELECT id, addiction_id, reset_at 
      FROM reset_history 
      ORDER BY reset_at DESC
    `;
    const params: [] = [];

    try {
      const result = await executeQuery<ResetHistoryRow>(sql, params);

      return result.rows.map(row => ResetHistoryRepository.rowToDomain(row));
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(
        `Failed to find all ResetHistoryEntry: ${error instanceof Error ? error.message : String(error)}`,
        sql,
        params,
        error
      );
    }
  }
}
