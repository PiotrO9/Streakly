/**
 * Web stub implementation of the database layer.
 *
 * On web, expo-sqlite requires a WASM worker which complicates bundling.
 * For the MVP we provide a minimal, non-functional stub that:
 * - Marks the database as "ready" so the app can render
 * - Throws explicit errors if any SQL execution is attempted
 *
 * This keeps the web build working while SQLite is fully supported on native platforms.
 */

export type AppDatabase = {
  readonly isWebStub: true;
};

export type SqlPrimitiveParam = string | number | boolean | null | Uint8Array;

export type SqlQueryParams = readonly SqlPrimitiveParam[];

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

export interface BootstrapResult {
  success: boolean;
  currentVersion: number;
  appliedMigrations: number;
  error?: Error;
}

let databaseInstance: AppDatabase | null = null;
let databaseInitPromise: Promise<AppDatabase> | null = null;
let bootstrapResult: BootstrapResult | null = null;

async function openDatabaseInternal(): Promise<AppDatabase> {
  if (databaseInstance) {
    console.log('[DB:web] Returning existing web stub database instance');
    return databaseInstance;
  }

  console.log('[DB:web] Creating web stub database instance (SQLite disabled on web)');

  // Create a simple stub object
  const db: AppDatabase = {
    isWebStub: true,
  };

  // On web we don't run real migrations; we just mark bootstrap as successful
  bootstrapResult = {
    success: true,
    currentVersion: 0,
    appliedMigrations: 0,
  };

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

function createWebOnlyError(sql: string): DatabaseError {
  return new DatabaseError(
    'SQLite is not supported in this web stub implementation. Use a native platform for persistence.',
    sql,
    []
  );
}

export async function executeRun(sql: string, params: SqlQueryParams = []): Promise<SqlRunResult> {
  throw createWebOnlyError(sql);
}

export async function executeQuery<T>(
  sql: string,
  params: SqlQueryParams = []
): Promise<SqlQueryResult<T>> {
  throw createWebOnlyError(sql);
}

export async function executeQueryOne<T>(
  sql: string,
  params: SqlQueryParams = []
): Promise<T | null> {
  throw createWebOnlyError(sql);
}

export async function executeTransaction<T>(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  callback: (tx: AppDatabase) => Promise<T>
): Promise<T> {
  throw createWebOnlyError('<transaction>');
}

export async function closeDatabaseForTesting(): Promise<void> {
  databaseInstance = null;
  databaseInitPromise = null;
  bootstrapResult = null;
}
