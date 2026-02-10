import Database from 'better-sqlite3';
import { getEnv } from './env';

let cachedDb: Database.Database | null = null;

export function getDb(): Database.Database {
  if (cachedDb) {
    return cachedDb;
  }

  const { SQLITE_DB_PATH } = getEnv();
  cachedDb = new Database(SQLITE_DB_PATH);
  return cachedDb;
}
