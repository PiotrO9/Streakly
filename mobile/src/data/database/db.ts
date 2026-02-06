import * as SQLite from 'expo-sqlite';

import { bootstrapDatabase, type BootstrapResult } from './bootstrap';

export type AppDatabase = SQLite.SQLiteDatabase;

export type SqlPrimitiveParam = string | number | boolean | null | Uint8Array;

export type SqlQueryParams = ReadonlyArray<SqlPrimitiveParam>;

export interface SqlRunResult {
  changes: number;
  lastInsertRowId: number | null;
}

export interface SqlQueryResult<T> {
  rows: T[];
}

export class DatabaseError extends Error {
  public readonly sql: string;
  public readonly params: SqlQueryParams;
  public readonly cause?: unknown;

  constructor(message: string, sql: string, params: SqlQueryParams, cause?: unknown) {
    super(message);
    this.name = 'DatabaseError';
    this.sql = sql;
    this.params = params;
    this.cause = cause;
  }
}

let databaseInstance: AppDatabase | null = null;
let databaseInitPromise: Promise<AppDatabase> | null = null;
let bootstrapResult: BootstrapResult | null = null;

async function openDatabaseInternal(): Promise<AppDatabase> {
  if (databaseInstance) {
    console.log('[DB] Returning existing database instance');
    return databaseInstance;
  }

  console.log('[DB] Opening database connection...');
  const db = await SQLite.openDatabaseAsync('streakly.db');
  console.log('[DB] Database connection opened');

  try {
    await db.execAsync('PRAGMA foreign_keys = ON;', false);
    console.log('[DB] Foreign keys enabled');
  } catch {
    // Ignore PRAGMA failures on platforms that do not support it
    console.log('[DB] Foreign keys not supported on this platform');
  }

  // Bootstrap database: apply migrations
  console.log('[DB] Starting bootstrap process...');
  const result = await bootstrapDatabase(db);
  bootstrapResult = result;

  if (!result.success) {
    console.error('[DB] Bootstrap failed:', result.error);
    throw new DatabaseError(
      `Database bootstrap failed: ${result.error?.message ?? 'Unknown error'}`,
      '<bootstrap>',
      [],
      result.error,
    );
  }

  console.log('[DB] Database ready. Version:', result.currentVersion);
  databaseInstance = db;
  return db;
}

export async function initializeDatabase(): Promise<AppDatabase> {
  if (!databaseInitPromise) {
    databaseInitPromise = openDatabaseInternal();
  }

  return databaseInitPromise;
}

/**
 * Gets the bootstrap result from the last initialization.
 * Returns null if database hasn't been initialized yet.
 */
export function getBootstrapResult(): BootstrapResult | null {
  return bootstrapResult;
}

export async function getDatabase(): Promise<AppDatabase> {
  if (databaseInstance) {
    return databaseInstance;
  }

  return initializeDatabase();
}

export async function executeRun(
  sql: string,
  params: SqlQueryParams = [],
): Promise<SqlRunResult> {
  const db = await getDatabase();

  try {
    const result = await db.runAsync(sql, params);

    return {
      changes: result.changes ?? 0,
      lastInsertRowId: result.lastInsertRowId ?? null,
    };
  } catch (error) {
    throw new DatabaseError('Failed to execute SQL statement', sql, params, error);
  }
}

export async function executeQuery<T>(
  sql: string,
  params: SqlQueryParams = [],
): Promise<SqlQueryResult<T>> {
  const db = await getDatabase();

  try {
    const rows = await db.getAllAsync<T>(sql, params);
    return { rows };
  } catch (error) {
    throw new DatabaseError('Failed to execute SQL query', sql, params, error);
  }
}

export async function executeQueryOne<T>(
  sql: string,
  params: SqlQueryParams = [],
): Promise<T | null> {
  const db = await getDatabase();

  try {
    const row = await db.getFirstAsync<T>(sql, params);
    return row ?? null;
  } catch (error) {
    throw new DatabaseError('Failed to execute SQL single-row query', sql, params, error);
  }
}

export async function executeTransaction<T>(
  callback: (tx: AppDatabase) => Promise<T>,
): Promise<T> {
  const db = await getDatabase();

  try {
    const result = await db.withTransactionAsync(async (tx) => {
      return callback(tx);
    });

    return result;
  } catch (error) {
    throw new DatabaseError('Failed to execute SQL transaction', '<transaction>', [], error);
  }
}

export async function closeDatabaseForTesting(): Promise<void> {
  if (!databaseInstance) {
    return;
  }

  await databaseInstance.closeAsync();
  databaseInstance = null;
  databaseInitPromise = null;
  bootstrapResult = null;
}


