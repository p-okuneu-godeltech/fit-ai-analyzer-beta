import { describe, expect, it } from "vitest";
import type { SessionRecord } from "../../src/types/session";
import { buildRoutePolyline } from "../../src/lib/fit/route";

function makeRecord(lat: number | null, lng: number | null): SessionRecord {
  return {
    timestamp: new Date("2024-01-01T00:00:00Z"),
    distanceMeters: 0,
    speedMetersPerSecond: null,
    cadenceSpm: null,
    latitudeDeg: lat,
    longitudeDeg: lng,
  };
}

describe("buildRoutePolyline", () => {
  it("filters records without valid GPS", () => {
    const records: SessionRecord[] = [
      makeRecord(null, null),
      makeRecord(51.1, null),
      makeRecord(null, 17.0),
      makeRecord(51.1, 17.0),
    ];

    expect(buildRoutePolyline(records)).toEqual([[51.1, 17.0]]);
  });

  it("drops invalid coordinate ranges", () => {
    const records: SessionRecord[] = [
      makeRecord(91, 17),
      makeRecord(-91, 17),
      makeRecord(51, 181),
      makeRecord(51, -181),
      makeRecord(51, 17),
    ];

    expect(buildRoutePolyline(records)).toEqual([[51, 17]]);
  });

  it("dedupes consecutive duplicate points", () => {
    const records: SessionRecord[] = [
      makeRecord(51, 17),
      makeRecord(51, 17),
      makeRecord(51.0001, 17.0001),
      makeRecord(51.0001, 17.0001),
    ];

    expect(buildRoutePolyline(records)).toEqual([
      [51, 17],
      [51.0001, 17.0001],
    ]);
  });
});
