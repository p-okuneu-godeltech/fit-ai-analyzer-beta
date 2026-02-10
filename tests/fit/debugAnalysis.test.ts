import { describe, expect, it } from "vitest";
import { analyzeParsedSessionForDebug } from "../../src/lib/fit/debugAnalysis";
import type { ParsedSession } from "../../src/types/session";

function makeSession(recordCount: number): ParsedSession {
  const start = new Date("2024-01-01T10:00:00Z");

  const records = Array.from({ length: recordCount }).map((_, idx) => {
    return {
      timestamp: new Date(start.getTime() + idx * 1000),
      distanceMeters: idx * 10,
      speedMetersPerSecond: 3,
      cadenceSpm: 160,
      latitudeDeg: idx % 2 === 0 ? 51.0 : null,
      longitudeDeg: idx % 2 === 0 ? 17.0 : null,
    };
  });

  const summary: ParsedSession["summary"] = {
    id: "test",
    userId: "user-test",
    startTime: start,
    endTime: new Date(start.getTime() + (recordCount - 1) * 1000),
    totalDistanceMeters: (recordCount - 1) * 10,
    totalDurationSeconds: (recordCount - 1),
    averagePaceSecondsPerKm:
      recordCount > 1 ? ((recordCount - 1) / ((recordCount - 1) * 10)) * 1000 : null,
    averageCadenceSpm: 160,
  };

  return { records, summary };
}

describe("analyzeParsedSessionForDebug", () => {
  it("computes basic debug metrics", () => {
    const session = makeSession(11);

    const analysis = analyzeParsedSessionForDebug(session);

    expect(analysis.recordCount).toBe(11);
    expect(analysis.hasMonotonicTimestamps).toBe(true);
    expect(analysis.totalDistanceMeters).toBe(100);
    expect(analysis.totalDurationSeconds).toBe(10);
    expect(analysis.hasGps).toBe(true);
  });
});
