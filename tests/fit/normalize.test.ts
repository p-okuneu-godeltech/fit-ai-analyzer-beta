import { describe, expect, it } from "vitest";
import { normalizeParsedSession } from "../../src/lib/fit/normalize";
import type { ParsedSession } from "../../src/types/session";

function makeSessionWithDuplicates(): ParsedSession {
  const t0 = new Date("2024-01-01T10:00:00Z");

  const records: ParsedSession["records"] = [
    {
      timestamp: new Date(t0),
      distanceMeters: 0,
      speedMetersPerSecond: null,
      cadenceSpm: 160,
      latitudeDeg: 51,
      longitudeDeg: 17,
    },
    {
      timestamp: new Date(t0),
      distanceMeters: 0,
      speedMetersPerSecond: null,
      cadenceSpm: 160,
      latitudeDeg: 51,
      longitudeDeg: 17,
    },
    {
      timestamp: new Date(t0.getTime() + 1000),
      distanceMeters: 10,
      speedMetersPerSecond: null,
      cadenceSpm: 160,
      latitudeDeg: 51,
      longitudeDeg: 17,
    },
  ];

  const summary: ParsedSession["summary"] = {
    id: "s",
    userId: "u",
    startTime: t0,
    endTime: new Date(t0.getTime() + 1000),
    totalDistanceMeters: 10,
    totalDurationSeconds: 1,
    averagePaceSecondsPerKm: null,
    averageCadenceSpm: 160,
  };

  return { records, summary };
}

describe("normalizeParsedSession", () => {
  it("deduplicates records and computes speed", () => {
    const session = makeSessionWithDuplicates();

    const normalized = normalizeParsedSession(session);

    expect(normalized.records.length).toBe(2);
    expect(normalized.records[0].speedMetersPerSecond).toBeNull();
    expect(normalized.records[1].speedMetersPerSecond).toBeCloseTo(10, 5);
    expect(normalized.summary.totalDistanceMeters).toBe(10);
    expect(normalized.summary.totalDurationSeconds).toBe(1);
  });
});
