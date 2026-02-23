/**
 * Database Bootstrap
 *
 * Handles database initialization and migration execution.
 * Ensures the database is ready before the app uses it.
 */
import type { AppDatabase } from './db';
import { DatabaseError } from './db';
import { migrations } from './migrations';

const SCHEMA_VERSION_TABLE = 'schema_version';
const CURRENT_SCHEMA_VERSION =
  migrations.length > 0 ? migrations[migrations.length - 1].version : 0;

export interface BootstrapResult {
  success: boolean;
  currentVersion: number;
  appliedMigrations: number;
  error?: Error;
}

/**
 * Creates the schema_version table if it doesn't exist.
 * This table tracks which migrations have been applied.
 */
async function ensureSchemaVersionTable(db: AppDatabase): Promise<void> {
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS ${SCHEMA_VERSION_TABLE} (
      version INTEGER NOT NULL PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at INTEGER NOT NULL
    );
  `;

  try {
    await db.execAsync(createTableSql, false);
  } catch (error) {
    throw new DatabaseError('Failed to create schema_version table', createTableSql, [], error);
  }
}

/**
 * Gets the current schema version from the database.
 * Returns 0 if no migrations have been applied.
 */
async function getCurrentSchemaVersion(db: AppDatabase): Promise<number> {
  try {
    const result = await db.getFirstAsync<{ version: number }>(
      `SELECT MAX(version) as version FROM ${SCHEMA_VERSION_TABLE}`
    );

    return result?.version ?? 0;
  } catch (error) {
    throw new DatabaseError(
      'Failed to query schema version',
      `SELECT MAX(version) as version FROM ${SCHEMA_VERSION_TABLE}`,
      [],
      error
    );
  }
}

/**
 * Records that a migration has been applied.
 */
async function recordMigrationApplied(
  db: AppDatabase,
  migration: { version: number; name: string }
): Promise<void> {
  const insertSql = `
    INSERT INTO ${SCHEMA_VERSION_TABLE} (version, name, applied_at)
    VALUES (?, ?, ?)
  `;

  try {
    await db.runAsync(insertSql, [migration.version, migration.name, Date.now()]);
  } catch (error) {
    throw new DatabaseError(
      `Failed to record migration ${migration.version}`,
      insertSql,
      [migration.version, migration.name, Date.now()],
      error
    );
  }
}

/**
 * Executes a single migration within a transaction.
 */
async function executeMigration(
  db: AppDatabase,
  migration: { version: number; name: string; sql: string }
): Promise<void> {
  try {
    await db.withTransactionAsync(async tx => {
      // Execute the migration SQL
      await tx.execAsync(migration.sql, false);

      // Record that the migration was applied
      await recordMigrationApplied(tx, migration);
    });
  } catch (error) {
    throw new DatabaseError(
      `Failed to execute migration ${migration.version}: ${migration.name}`,
      migration.sql,
      [],
      error
    );
  }
}

/**
 * Bootstraps the database by applying all pending migrations.
 *
 * This function is idempotent - it's safe to call multiple times.
 * Only migrations that haven't been applied will be executed.
 *
 * @param db - The database instance
 * @returns Bootstrap result with success status and migration details
 */
export async function bootstrapDatabase(db: AppDatabase): Promise<BootstrapResult> {
  try {
    console.log('[Bootstrap] Starting database bootstrap...');

    // Ensure schema_version table exists
    console.log('[Bootstrap] Ensuring schema_version table exists...');
    await ensureSchemaVersionTable(db);
    console.log('[Bootstrap] Schema version table ready');

    // Get current schema version
    console.log('[Bootstrap] Querying current schema version...');
    const currentVersion = await getCurrentSchemaVersion(db);
    console.log('[Bootstrap] Current schema version:', currentVersion);

    // Find pending migrations (those with version > currentVersion)
    const pendingMigrations = migrations.filter(m => m.version > currentVersion);
    console.log('[Bootstrap] Pending migrations:', pendingMigrations.length);

    // Sort by version to ensure deterministic execution order
    pendingMigrations.sort((a, b) => a.version - b.version);

    // Apply pending migrations
    let appliedCount = 0;
    for (const migration of pendingMigrations) {
      console.log(`[Bootstrap] Applying migration ${migration.version}: ${migration.name}`);
      await executeMigration(db, migration);
      appliedCount++;
      console.log(`[Bootstrap] Migration ${migration.version} applied successfully`);
    }

    // Get final version after migrations
    const finalVersion = await getCurrentSchemaVersion(db);
    console.log('[Bootstrap] Bootstrap complete. Final version:', finalVersion);

    return {
      success: true,
      currentVersion: finalVersion,
      appliedMigrations: appliedCount,
    };
  } catch (error) {
    console.error('[Bootstrap] Bootstrap failed:', error);
    let fallbackVersion = 0;
    try {
      fallbackVersion = await getCurrentSchemaVersion(db);
    } catch {
      // Ignore - table might not exist yet
    }

    return {
      success: false,
      currentVersion: fallbackVersion,
      appliedMigrations: 0,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * Gets the expected schema version (highest migration version).
 */
export function getExpectedSchemaVersion(): number {
  return CURRENT_SCHEMA_VERSION;
}
