// SQLite implementation of Addiction repository
import { DatabaseError, executeQuery, executeQueryOne, executeRun } from '@/data/database/db';
import type { Addiction, AddictionId } from '@/domain/models/Addiction';

import type {
  CreateAddictionInput,
  IAddictionRepository,
  UpdateAddictionInput,
} from './IAddictionRepository';

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
 * Database row representation of an Addiction.
 * Matches the current SQLite schema (migration 001).
 */
interface AddictionRow {
  id: string;
  name: string;
  created_at: number; // Unix timestamp in milliseconds
  last_reset_at: number | null; // Unix timestamp in milliseconds, nullable
}

/**
 * SQLite implementation of IAddictionRepository.
 *
 * Maps between domain models (Addiction) and database rows (AddictionRow).
 * Handles timestamp conversion (Date ↔ INTEGER milliseconds).
 */
export class AddictionRepository implements IAddictionRepository {
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
   * Maps a database row to a domain Addiction entity.
   *
   * Note: Current schema only stores id, name, created_at, last_reset_at.
   * Missing fields (longestStreakDays, resetCount, isArchived, etc.) are set to defaults.
   * Future migrations should add these columns.
   */
  private static rowToDomain(row: AddictionRow): Addiction {
    const createdAt = this.timestampToDate(row.created_at);
    // If last_reset_at is null, use createdAt (new addiction, no resets yet)
    const lastResetAt = row.last_reset_at ? this.timestampToDate(row.last_reset_at) : createdAt;

    return {
      id: row.id,
      name: row.name,
      createdAt,
      lastResetAt,
      // Default values for fields not yet in schema (MVP)
      longestStreakDays: 0,
      resetCount: 0,
      isArchived: false,
      // Optional fields omitted (will be null/undefined)
      archivedAt: undefined,
      resetHistory: undefined,
      metadata: undefined,
      sync: undefined,
    };
  }

  /**
   * Maps a domain Addiction entity to database row values for INSERT/UPDATE.
   */
  private static domainToRowValues(addiction: {
    id: string;
    name: string;
    createdAt: Date;
    lastResetAt: Date;
  }): [string, string, number, number] {
    return [
      addiction.id,
      addiction.name,
      this.dateToTimestamp(addiction.createdAt),
      this.dateToTimestamp(addiction.lastResetAt),
    ];
  }

  async create(input: CreateAddictionInput): Promise<Addiction> {
    const id = generateUUID();
    const createdAt = input.createdAt;
    const lastResetAt = input.lastResetAt;

    const sql = `
      INSERT INTO addictions (id, name, created_at, last_reset_at)
      VALUES (?, ?, ?, ?)
    `;
    const params = AddictionRepository.domainToRowValues({
      id,
      name: input.name,
      createdAt,
      lastResetAt,
    });

    try {
      await executeRun(sql, params);

      // Return the created entity (mapped from input + generated id)
      return {
        id,
        name: input.name,
        createdAt,
        lastResetAt,
        longestStreakDays: input.longestStreakDays ?? 0,
        resetCount: input.resetCount ?? 0,
        isArchived: input.isArchived ?? false,
        archivedAt: input.archivedAt,
        resetHistory: undefined,
        metadata: undefined,
        sync: undefined,
      };
    } catch (error) {
      // Re-throw DatabaseError as-is, wrap others
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(
        `Failed to create Addiction: ${error instanceof Error ? error.message : String(error)}`,
        sql,
        params,
        error
      );
    }
  }

  async findById(id: AddictionId): Promise<Addiction | null> {
    const sql = `SELECT id, name, created_at, last_reset_at FROM addictions WHERE id = ?`;
    const params: [string] = [id];

    try {
      const row = await executeQueryOne<AddictionRow>(sql, params);

      if (!row) {
        return null;
      }

      return AddictionRepository.rowToDomain(row);
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(
        `Failed to find Addiction by id: ${error instanceof Error ? error.message : String(error)}`,
        sql,
        params,
        error
      );
    }
  }

  async findAll(): Promise<Addiction[]> {
    const sql = `SELECT id, name, created_at, last_reset_at FROM addictions ORDER BY created_at DESC`;
    const params: [] = [];

    try {
      const result = await executeQuery<AddictionRow>(sql, params);

      return result.rows.map(row => AddictionRepository.rowToDomain(row));
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(
        `Failed to find all Addictions: ${error instanceof Error ? error.message : String(error)}`,
        sql,
        params,
        error
      );
    }
  }

  async update(id: AddictionId, input: UpdateAddictionInput): Promise<Addiction> {
    // First, fetch the existing entity to ensure it exists
    const existing = await this.findById(id);

    if (!existing) {
      throw new DatabaseError(`Addiction with id "${id}" not found`, '<update>', [id]);
    }

    // Build UPDATE statement dynamically based on provided fields
    const updates: string[] = [];
    const params: (string | number)[] = [];

    if (input.name !== undefined) {
      updates.push('name = ?');
      params.push(input.name);
    }

    if (input.lastResetAt !== undefined) {
      updates.push('last_reset_at = ?');
      params.push(AddictionRepository.dateToTimestamp(input.lastResetAt));
    }

    // Note: Other fields (longestStreakDays, resetCount, isArchived, etc.) are not yet in schema.
    // Future migrations should add these columns, then update this method.

    if (updates.length === 0) {
      // No changes, return existing entity
      return existing;
    }

    // Add id to params for WHERE clause
    params.push(id);

    const sql = `UPDATE addictions SET ${updates.join(', ')} WHERE id = ?`;

    try {
      const result = await executeRun(sql, params);

      if (result.changes === 0) {
        // This shouldn't happen since we checked existence, but handle gracefully
        throw new DatabaseError(`Update affected 0 rows for id "${id}"`, sql, params);
      }

      // Fetch and return updated entity
      const updated = await this.findById(id);
      if (!updated) {
        throw new DatabaseError(`Failed to fetch updated Addiction with id "${id}"`, sql, params);
      }

      // Merge domain-only fields that aren't in DB yet
      return {
        ...updated,
        longestStreakDays: input.longestStreakDays ?? existing.longestStreakDays,
        resetCount: input.resetCount ?? existing.resetCount,
        isArchived: input.isArchived ?? existing.isArchived,
        archivedAt: input.archivedAt ?? existing.archivedAt,
      };
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(
        `Failed to update Addiction: ${error instanceof Error ? error.message : String(error)}`,
        sql,
        params,
        error
      );
    }
  }

  async delete(id: AddictionId): Promise<void> {
    const sql = `DELETE FROM addictions WHERE id = ?`;
    const params: [string] = [id];

    try {
      const result = await executeRun(sql, params);

      if (result.changes === 0) {
        throw new DatabaseError(`Addiction with id "${id}" not found`, sql, params);
      }
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(
        `Failed to delete Addiction: ${error instanceof Error ? error.message : String(error)}`,
        sql,
        params,
        error
      );
    }
  }
}
