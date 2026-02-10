import { describe, expect, it } from "vitest";
import type { ParsedSession, SessionRecord } from "../../src/types/session";
import { computePerKmSplits, computeSessionMetrics } from "../../src/lib/analysis/sessionMetrics";

function makeRecord(
  secondsFromStart: number,
  distanceMeters: number,
  speedMetersPerSecond: number | null,
  cadenceSpm: number | null,
): SessionRecord {
  const start = new Date("2023-01-01T00:00:00Z");
  return {
    timestamp: new Date(start.getTime() + secondsFromStart * 1000),
    distanceMeters,
    speedMetersPerSecond,
    cadenceSpm,
    latitudeDeg: null,
    longitudeDeg: null,
  };
}

function makeParsedSession(records: SessionRecord[]): ParsedSession {
  if (!records.length) {
    throw new Error("records must not be empty");
  }

  const startTime = records[0].timestamp;
  const endTime = records[records.length - 1].timestamp;
  const totalDistanceMeters =
    records[records.length - 1].distanceMeters - records[0].distanceMeters;
  const totalDurationSeconds =
    (endTime.getTime() - startTime.getTime()) / 1000;

  const cadenceValues = records
    .map((r) => r.cadenceSpm)
    .filter((c): c is number => c != null);
  const averageCadenceSpm =
    cadenceValues.length > 0
      ? cadenceValues.reduce((acc, v) => acc + v, 0) / cadenceValues.length
      : null;

  const averagePaceSecondsPerKm =
    totalDistanceMeters > 0
      ? totalDurationSeconds / (totalDistanceMeters / 1000)
      : null;

  return {
    records,
    summary: {
      id: "test",
      userId: "test-user",
      startTime,
      endTime,
      totalDistanceMeters: records[records.length - 1].distanceMeters,
      totalDurationSeconds,
      averagePaceSecondsPerKm,
      averageCadenceSpm,
    },
  };
}

describe("computePerKmSplits", () => {
  it("computes a single 1km split for a simple 5:00/km run", () => {
    const records: SessionRecord[] = [
      makeRecord(0, 0, null, 170),
      makeRecord(300, 1000, null, 172),
    ];

    const session = makeParsedSession(records);
    const splits = computePerKmSplits(session);

    expect(splits).toHaveLength(1);
    const split = splits[0];

    expect(split.distanceMeters).toBeCloseTo(1000, 1);
    expect(split.durationSeconds).toBeCloseTo(300, 1);
    expect(split.paceSecondsPerKm).toBeCloseTo(300, 1);
    expect(split.averageCadenceSpm).toBeGreaterThan(0);
  });

  it("returns multiple splits for multi-kilometer runs and includes final partial split", () => {
    const records: SessionRecord[] = [
      makeRecord(0, 0, null, 170),
      makeRecord(300, 1000, null, 170),
      makeRecord(600, 2000, null, 170),
      makeRecord(750, 2500, null, 170),
    ];

    const session = makeParsedSession(records);
    const splits = computePerKmSplits(session);

    expect(splits.length).toBe(3);
    expect(splits[0].distanceMeters).toBeCloseTo(1000, 1);
    expect(splits[1].distanceMeters).toBeCloseTo(1000, 1);
    expect(splits[2].distanceMeters).toBeCloseTo(500, 1);
  });
});

describe("computeSessionMetrics", () => {
  it("produces coherent totals and splits for a simple steady run", () => {
    const records: SessionRecord[] = [
      makeRecord(0, 0, null, 170),
      makeRecord(300, 1000, null, 170),
      makeRecord(600, 2000, null, 170),
    ];

    const session = makeParsedSession(records);
    const metrics = computeSessionMetrics(session);

    expect(metrics.totals.totalDistanceMeters).toBeCloseTo(2000, 1);
    expect(metrics.splits.length).toBe(2);
    expect(metrics.paceStats.averagePaceSecondsPerKm).toBeCloseTo(300, 1);
    expect(metrics.cadenceStats.averageCadenceSpm).toBeGreaterThan(0);
    expect(metrics.halfComparison).not.toBeNull();
  });

  it("detects no pauses when speed is never zero", () => {
    const records: SessionRecord[] = [
      makeRecord(0, 0, 3.3, 170),
      makeRecord(300, 1000, 3.3, 170),
      makeRecord(600, 2000, 3.3, 170),
    ];

    const session = makeParsedSession(records);
    const metrics = computeSessionMetrics(session);

    expect(metrics.pauses).toHaveLength(0);
  });
});
