import { getDb } from "@/lib/validation/sqlite";
import type { UserProfile } from "@/types/profile";

export type StressLevel = UserProfile["stressLevel"];

export type UpsertProfileInput = {
  yearsRunning: number;
  weeklyKilometrage: number;
  personalBest5kSeconds: number | null;
  personalBest5kDate: Date | null;
  personalBest10kSeconds: number | null;
  personalBest10kDate: Date | null;
  averageDailyCalories: number | null;
  sleepHours: number | null;
  sleepConsistencyScore: number | null;
  stressLevel: StressLevel;
};

function mapRowToUserProfile(row: any): UserProfile {
  return {
    id: String(row.id),
    userId: row.user_id,
    createdAt: new Date(row.created_at),
    yearsRunning: row.years_running ?? null,
    weeklyKilometrage: row.weekly_kilometrage ?? null,
    personalBest5kSeconds: row.personal_best_5k_seconds ?? null,
    personalBest5kDate: row.personal_best_5k_date
      ? new Date(row.personal_best_5k_date)
      : null,
    personalBest10kSeconds: row.personal_best_10k_seconds ?? null,
    personalBest10kDate: row.personal_best_10k_date
      ? new Date(row.personal_best_10k_date)
      : null,
    averageDailyCalories: row.average_daily_calories ?? null,
    sleepHours: row.sleep_hours ?? null,
    sleepConsistencyScore: row.sleep_consistency_score ?? null,
    stressLevel: row.stress_level ?? null,
  };
}

export function getProfileByUserId(userId: string): UserProfile | null {
  const db = getDb();

  const stmt = db.prepare(
    "SELECT id, user_id, created_at, years_running, weekly_kilometrage, personal_best_5k_seconds, personal_best_5k_date, personal_best_10k_seconds, personal_best_10k_date, average_daily_calories, sleep_hours, sleep_consistency_score, stress_level FROM profiles WHERE user_id = ? LIMIT 1",
  );

  const row = stmt.get(userId);
  if (!row) {
    return null;
  }

  return mapRowToUserProfile(row);
}

export function upsertProfileForUser(
  userId: string,
  input: UpsertProfileInput,
): UserProfile {
  const db = getDb();

  const existing = db
    .prepare(
      "SELECT id, created_at FROM profiles WHERE user_id = ? LIMIT 1",
    )
    .get(userId) as { id: number; created_at: string } | undefined;

  const nowIso = new Date().toISOString();

  if (existing) {
    db.prepare(
      `UPDATE profiles
       SET years_running = ?,
           weekly_kilometrage = ?,
           personal_best_5k_seconds = ?,
           personal_best_5k_date = ?,
           personal_best_10k_seconds = ?,
           personal_best_10k_date = ?,
           average_daily_calories = ?,
           sleep_hours = ?,
           sleep_consistency_score = ?,
           stress_level = ?
       WHERE user_id = ?`,
    ).run(
      input.yearsRunning,
      input.weeklyKilometrage,
      input.personalBest5kSeconds,
      input.personalBest5kDate
        ? input.personalBest5kDate.toISOString()
        : null,
      input.personalBest10kSeconds,
      input.personalBest10kDate
        ? input.personalBest10kDate.toISOString()
        : null,
      input.averageDailyCalories,
      input.sleepHours,
      input.sleepConsistencyScore,
      input.stressLevel,
      userId,
    );

    const row = db
      .prepare(
        "SELECT id, user_id, created_at, years_running, weekly_kilometrage, personal_best_5k_seconds, personal_best_5k_date, personal_best_10k_seconds, personal_best_10k_date, average_daily_calories, sleep_hours, sleep_consistency_score, stress_level FROM profiles WHERE user_id = ? LIMIT 1",
      )
      .get(userId);

    return mapRowToUserProfile(row);
  }

  const insert = db.prepare(
    `INSERT INTO profiles (
       user_id,
       created_at,
       years_running,
       weekly_kilometrage,
       personal_best_5k_seconds,
       personal_best_5k_date,
       personal_best_10k_seconds,
       personal_best_10k_date,
       average_daily_calories,
       sleep_hours,
       sleep_consistency_score,
       stress_level
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  const result = insert.run(
    userId,
    nowIso,
    input.yearsRunning,
    input.weeklyKilometrage,
    input.personalBest5kSeconds,
    input.personalBest5kDate ? input.personalBest5kDate.toISOString() : null,
    input.personalBest10kSeconds,
    input.personalBest10kDate ? input.personalBest10kDate.toISOString() : null,
    input.averageDailyCalories,
    input.sleepHours,
    input.sleepConsistencyScore,
    input.stressLevel,
  );

  const row = db
    .prepare(
      "SELECT id, user_id, created_at, years_running, weekly_kilometrage, personal_best_5k_seconds, personal_best_5k_date, personal_best_10k_seconds, personal_best_10k_date, average_daily_calories, sleep_hours, sleep_consistency_score, stress_level FROM profiles WHERE rowid = ?",
    )
    .get(result.lastInsertRowid);

  return mapRowToUserProfile(row);
}
