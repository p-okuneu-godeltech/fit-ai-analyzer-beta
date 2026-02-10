import { getDb } from "@/lib/validation/sqlite";

export function ensureDatabaseConnection(): void {
  const db = getDb();
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL,
      years_running INTEGER,
      weekly_kilometrage REAL,
      personal_best_5k_seconds INTEGER,
      personal_best_5k_date TEXT,
      personal_best_10k_seconds INTEGER,
      personal_best_10k_date TEXT,
      average_daily_calories REAL,
      sleep_hours REAL,
      sleep_consistency_score REAL,
      stress_level TEXT
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      sequence_number INTEGER NOT NULL,
      user_provided_name TEXT,
      created_at TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      total_distance_meters REAL NOT NULL,
      total_duration_seconds REAL NOT NULL,
      average_pace_seconds_per_km REAL,
      average_cadence_spm REAL,
      metrics_json TEXT NOT NULL,
      route_polyline_json TEXT NOT NULL,
      records_json TEXT NOT NULL
    );
  `);
}

