import { getDb } from "@/lib/validation/sqlite";

export type StoredSessionSummaryRow = {
  id: number;
  user_id: string;
  sequence_number: number;
  user_provided_name: string | null;
  created_at: string;
  start_time: string;
  end_time: string;
  total_distance_meters: number;
  total_duration_seconds: number;
  average_pace_seconds_per_km: number | null;
  average_cadence_spm: number | null;
};

export type StoredSessionDetailRow = StoredSessionSummaryRow & {
  metrics_json: string;
  route_polyline_json: string;
  records_json: string;
};

export type StoredSessionSummary = {
  id: number;
  userId: string;
  sequenceNumber: number;
  userProvidedName: string | null;
  createdAt: Date;
  startTime: Date;
  endTime: Date;
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  averagePaceSecondsPerKm: number | null;
  averageCadenceSpm: number | null;
};

export type StoredSessionDetail = StoredSessionSummary & {
  metricsJson: string;
  routePolylineJson: string;
  recordsJson: string;
};

function mapSummaryRow(row: StoredSessionSummaryRow): StoredSessionSummary {
  return {
    id: row.id,
    userId: row.user_id,
    sequenceNumber: row.sequence_number,
    userProvidedName: row.user_provided_name,
    createdAt: new Date(row.created_at),
    startTime: new Date(row.start_time),
    endTime: new Date(row.end_time),
    totalDistanceMeters: row.total_distance_meters,
    totalDurationSeconds: row.total_duration_seconds,
    averagePaceSecondsPerKm: row.average_pace_seconds_per_km,
    averageCadenceSpm: row.average_cadence_spm,
  };
}

function mapDetailRow(row: StoredSessionDetailRow | undefined): StoredSessionDetail {
  if (!row) {
    throw new Error("Session not found");
  }
  
  return {
    ...mapSummaryRow(row),
    metricsJson: row.metrics_json,
    routePolylineJson: row.route_polyline_json,
    recordsJson: row.records_json,
  };
}

export function getNextSequenceNumberForUser(userId: string): number {
  const db = getDb();

  const row = db
    .prepare<unknown[], { max_seq: number | null }>(
      "SELECT MAX(sequence_number) AS max_seq FROM sessions WHERE user_id = ?",
    )
    .get(userId);

  const maxSeq = row?.max_seq ?? 0;
  return maxSeq + 1;
}

export type InsertSessionInput = {
  userId: string;
  sequenceNumber: number;
  userProvidedName: string | null;
  startTime: Date;
  endTime: Date;
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  averagePaceSecondsPerKm: number | null;
  averageCadenceSpm: number | null;
  metricsJson: string;
  routePolylineJson: string;
  recordsJson: string;
};

export function insertSessionForUser(input: InsertSessionInput): StoredSessionDetail {
  const db = getDb();
  const nowIso = new Date().toISOString();

  const insert = db.prepare(
    `INSERT INTO sessions (
       user_id,
       sequence_number,
       user_provided_name,
       created_at,
       start_time,
       end_time,
       total_distance_meters,
       total_duration_seconds,
       average_pace_seconds_per_km,
       average_cadence_spm,
       metrics_json,
       route_polyline_json,
       records_json
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  const result = insert.run(
    input.userId,
    input.sequenceNumber,
    input.userProvidedName,
    nowIso,
    input.startTime.toISOString(),
    input.endTime.toISOString(),
    input.totalDistanceMeters,
    input.totalDurationSeconds,
    input.averagePaceSecondsPerKm,
    input.averageCadenceSpm,
    input.metricsJson,
    input.routePolylineJson,
    input.recordsJson,
  );

  const row = db
    .prepare<unknown[], StoredSessionDetailRow>(
      "SELECT id, user_id, sequence_number, user_provided_name, created_at, start_time, end_time, total_distance_meters, total_duration_seconds, average_pace_seconds_per_km, average_cadence_spm, metrics_json, route_polyline_json, records_json FROM sessions WHERE rowid = ?",
    )
    .get(result.lastInsertRowid as number);

  return mapDetailRow(row);
}

export function getSessionsByUserId(userId: string): StoredSessionSummary[] {
  const db = getDb();

  const rows = db
    .prepare<unknown[], StoredSessionSummaryRow>(
      "SELECT id, user_id, sequence_number, user_provided_name, created_at, start_time, end_time, total_distance_meters, total_duration_seconds, average_pace_seconds_per_km, average_cadence_spm FROM sessions WHERE user_id = ? ORDER BY created_at DESC",
    )
    .all(userId);

  return rows.map(mapSummaryRow);
}

export function getSessionDetailById(
  userId: string,
  sessionId: number,
): StoredSessionDetail | null {
  const db = getDb();

  const row = db
    .prepare<unknown[], StoredSessionDetailRow>(
      "SELECT id, user_id, sequence_number, user_provided_name, created_at, start_time, end_time, total_distance_meters, total_duration_seconds, average_pace_seconds_per_km, average_cadence_spm, metrics_json, route_polyline_json, records_json FROM sessions WHERE id = ? AND user_id = ? LIMIT 1",
    )
    .get(sessionId, userId);

  if (!row) {
    return null;
  }

  return mapDetailRow(row);
}

export function deleteSessionForUser(userId: string, sessionId: number): boolean {
  const db = getDb();

  const stmt = db.prepare(
    "DELETE FROM sessions WHERE id = ? AND user_id = ?",
  );

  const result = stmt.run(sessionId, userId);

  return result.changes > 0;
}
