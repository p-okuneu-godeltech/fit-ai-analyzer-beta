import type { FitParsedSession } from "../../types/fit";

export type DebugSessionAnalysis = {
  recordCount: number;
  hasMonotonicTimestamps: boolean;
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  hasGps: boolean;
};

export function analyzeParsedSessionForDebug(session: FitParsedSession): DebugSessionAnalysis {
  const { records, summary } = session;

  if (!records.length) {
    return {
      recordCount: 0,
      hasMonotonicTimestamps: true,
      totalDistanceMeters: 0,
      totalDurationSeconds: 0,
      hasGps: false,
    };
  }

  let hasMonotonicTimestamps = true;
  let hasGps = false;

  for (let i = 1; i < records.length; i++) {
    if (records[i].timestamp < records[i - 1].timestamp) {
      hasMonotonicTimestamps = false;
      break;
    }
  }

  for (const r of records) {
    if (r.latitudeDeg !== null && r.longitudeDeg !== null) {
      hasGps = true;
      break;
    }
  }

  return {
    recordCount: records.length,
    hasMonotonicTimestamps,
    totalDistanceMeters: summary.totalDistanceMeters,
    totalDurationSeconds: summary.totalDurationSeconds,
    hasGps,
  };
}
