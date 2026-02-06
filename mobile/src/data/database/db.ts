import * as SQLite from 'expo-sqlite';

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

async function openDatabaseInternal(): Promise<AppDatabase> {
  if (databaseInstance) {
    return databaseInstance;
  }

  const db = await SQLite.openDatabaseAsync('streakly.db');

  try {
    await db.execAsync('PRAGMA foreign_keys = ON;', false);
  } catch {
    // Ignore PRAGMA failures on platforms that do not support it
  }

  databaseInstance = db;
  return db;
}

export async function initializeDatabase(): Promise<AppDatabase> {
  if (!databaseInitPromise) {
    databaseInitPromise = openDatabaseInternal();
  }

  return databaseInitPromise;
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
}


