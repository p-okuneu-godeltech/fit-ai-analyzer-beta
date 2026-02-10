import type { ParsedSession, SessionRecord } from "../../types/session";

export type NormalizedSession = ParsedSession;

function normalizeSessionRecords(records: SessionRecord[]): SessionRecord[] {
  if (!records.length) return records;

  const sorted = [...records].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
  );

  const deduped: SessionRecord[] = [];

  for (const rec of sorted) {
    const last = deduped[deduped.length - 1];
    if (
      last &&
      rec.timestamp.getTime() === last.timestamp.getTime() &&
      rec.distanceMeters === last.distanceMeters
    ) {
      continue;
    }

    deduped.push({ ...rec });
  }

  if (deduped.length <= 1) {
    return deduped.map((r) => ({ ...r, speedMetersPerSecond: null }));
  }

  const normalized: SessionRecord[] = [];

  for (let i = 0; i < deduped.length; i++) {
    const current = deduped[i];

    if (i === 0) {
      normalized.push({ ...current, speedMetersPerSecond: null });
      continue;
    }

    const prev = normalized[normalized.length - 1];
    const dtSeconds =
      (current.timestamp.getTime() - prev.timestamp.getTime()) / 1000;

    if (dtSeconds <= 0) {
      continue;
    }

    const deltaDistance = current.distanceMeters - prev.distanceMeters;
    const speed = deltaDistance > 0 ? deltaDistance / dtSeconds : 0;

    normalized.push({ ...current, speedMetersPerSecond: speed });
  }

  return normalized;
}

export function normalizeParsedSession(parsed: ParsedSession): NormalizedSession {
  const normalizedRecords = normalizeSessionRecords(parsed.records);

  if (!normalizedRecords.length) {
    return {
      ...parsed,
      records: [],
      summary: {
        ...parsed.summary,
        totalDistanceMeters: 0,
        totalDurationSeconds: 0,
        averagePaceSecondsPerKm: null,
        averageCadenceSpm: null,
      },
    };
  }

  const startTime = normalizedRecords[0].timestamp;
  const endTime = normalizedRecords[normalizedRecords.length - 1].timestamp;
  const totalDistanceMeters =
    normalizedRecords[normalizedRecords.length - 1].distanceMeters;
  const totalDurationSeconds = (endTime.getTime() - startTime.getTime()) / 1000;

  let cadenceSum = 0;
  let cadenceCount = 0;

  for (const r of normalizedRecords) {
    if (r.cadenceSpm != null) {
      cadenceSum += r.cadenceSpm;
      cadenceCount += 1;
    }
  }

  const averageCadenceSpm = cadenceCount > 0 ? cadenceSum / cadenceCount : null;

  return {
    records: normalizedRecords,
    summary: {
      ...parsed.summary,
      startTime,
      endTime,
      totalDistanceMeters,
      totalDurationSeconds,
      averagePaceSecondsPerKm:
        totalDistanceMeters > 0
          ? totalDurationSeconds / (totalDistanceMeters / 1000)
          : null,
      averageCadenceSpm,
    },
  };
}
