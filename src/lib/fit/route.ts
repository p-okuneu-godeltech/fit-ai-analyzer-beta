import type { SessionRecord } from "../../types/session";

export type RoutePolyline = Array<[lat: number, lng: number]>;

type BuildRoutePolylineOptions = {
  dedupeConsecutive?: boolean;
  epsilon?: number;
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isValidLatitude(lat: number): boolean {
  return lat >= -90 && lat <= 90;
}

function isValidLongitude(lng: number): boolean {
  return lng >= -180 && lng <= 180;
}

function almostEqual(a: number, b: number, epsilon: number): boolean {
  return Math.abs(a - b) <= epsilon;
}

export function buildRoutePolyline(
  records: SessionRecord[],
  options: BuildRoutePolylineOptions = {},
): RoutePolyline {
  const dedupeConsecutive = options.dedupeConsecutive ?? true;
  const epsilon = options.epsilon ?? 1e-9;

  const polyline: RoutePolyline = [];

  for (const record of records) {
    const { latitudeDeg, longitudeDeg } = record;

    if (!isFiniteNumber(latitudeDeg) || !isFiniteNumber(longitudeDeg)) {
      continue;
    }

    if (!isValidLatitude(latitudeDeg) || !isValidLongitude(longitudeDeg)) {
      continue;
    }

    const point: [number, number] = [latitudeDeg, longitudeDeg];

    if (dedupeConsecutive && polyline.length > 0) {
      const last = polyline[polyline.length - 1];
      if (
        almostEqual(last[0], point[0], epsilon) &&
        almostEqual(last[1], point[1], epsilon)
      ) {
        continue;
      }
    }

    polyline.push(point);
  }

  return polyline;
}
