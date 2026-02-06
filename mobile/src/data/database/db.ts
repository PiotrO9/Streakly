import * as SQLite from 'expo-sqlite';

export type AppDatabase = SQLite.SQLiteDatabase;

let databaseInstance: AppDatabase | null = null;

export async function initializeDatabase(): Promise<AppDatabase> {
  if (databaseInstance) {
    return databaseInstance;
  }

  const db = await SQLite.openDatabaseAsync('streakly.db');

  // Future: run migrations and schema setup here
  databaseInstance = db;

  return databaseInstance;
}

export async function getDatabase(): Promise<AppDatabase> {
  if (databaseInstance) {
    return databaseInstance;
  }

  return initializeDatabase();
}

export async function testDatabaseConnection(): Promise<void> {
  try {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ test: number }>('SELECT 1 AS test');

    console.log('SQLite test query result:', row);
  } catch (error) {
    console.error('SQLite test query failed', error);
  }
}
