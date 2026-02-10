import type {
  CadenceStats,
  ConsistencyMetrics,
  DetectedPause,
  HalfComparison,
  ParsedSession,
  PaceStats,
  SessionMetrics,
  SessionRecord,
  SessionTotals,
  Split,
  SessionTimeSummary,
} from "../../types/session";

import type { InsertSessionInput } from "@/db/queries/session";
import type { RoutePolyline } from "@/lib/fit/route";

type PauseDetectionOptions = {
  minPauseDurationSeconds?: number;
};

function computeTotals(session: ParsedSession): SessionTotals {
  const { summary } = session;

  return {
    totalDistanceMeters: summary.totalDistanceMeters,
    totalDurationSeconds: summary.totalDurationSeconds,
    averagePaceSecondsPerKm: summary.averagePaceSecondsPerKm,
    averageCadenceSpm: summary.averageCadenceSpm,
  };
}

function getTimeAtDistance(records: SessionRecord[], targetDistance: number): Date {
  if (!records.length) {
    return new Date(0);
  }

  let idx = 0;

  while (
    idx < records.length - 1 &&
    records[idx + 1].distanceMeters < targetDistance
  ) {
    idx += 1;
  }

  const current = records[idx];
  const next = records[Math.min(idx + 1, records.length - 1)];

  if (current.distanceMeters === next.distanceMeters) {
    return current.timestamp;
  }

  const ratio =
    (targetDistance - current.distanceMeters) /
    (next.distanceMeters - current.distanceMeters);

  const t0 = current.timestamp.getTime();
  const t1 = next.timestamp.getTime();
  const interpolated = t0 + (t1 - t0) * Math.min(Math.max(ratio, 0), 1);

  return new Date(interpolated);
}

export function computePerKmSplits(session: ParsedSession): Split[] {
  const { records } = session;

  if (records.length < 2) {
    return [];
  }

  const first = records[0];
  const last = records[records.length - 1];

  const baseDistance = first.distanceMeters;
  const totalDistance = Math.max(0, last.distanceMeters - baseDistance);

  if (totalDistance <= 0) {
    return [];
  }

  const splitDistance = 1000;
  const splitCount = Math.ceil(totalDistance / splitDistance);

  const splits: Split[] = [];

  for (let i = 0; i < splitCount; i += 1) {
    const startDistanceMeters = baseDistance + i * splitDistance;
    const endDistanceMeters = Math.min(
      baseDistance + (i + 1) * splitDistance,
      last.distanceMeters,
    );

    const startTime = getTimeAtDistance(records, startDistanceMeters);
    const endTime = getTimeAtDistance(records, endDistanceMeters);

    const durationSeconds =
      (endTime.getTime() - startTime.getTime()) / 1000;
    const distanceMeters = Math.max(0, endDistanceMeters - startDistanceMeters);

    const paceSecondsPerKm =
      distanceMeters > 0
        ? durationSeconds / (distanceMeters / 1000)
        : null;

    splits.push({
      index: i + 1,
      startDistanceMeters,
      endDistanceMeters,
      distanceMeters,
      durationSeconds,
      paceSecondsPerKm,
      averageCadenceSpm: null,
    });
  }

  // Fill cadence per split as a simple average of cadences
  for (const split of splits) {
    let cadenceSum = 0;
    let cadenceCount = 0;

    for (const rec of records) {
      if (
        rec.distanceMeters >= split.startDistanceMeters &&
        rec.distanceMeters <= split.endDistanceMeters &&
        rec.cadenceSpm != null
      ) {
        cadenceSum += rec.cadenceSpm;
        cadenceCount += 1;
      }
    }

    split.averageCadenceSpm =
      cadenceCount > 0 ? cadenceSum / cadenceCount : null;
  }

  return splits;
}

export function computePaceStatsFromSplits(splits: Split[]): PaceStats {
  const paces = splits
    .map((s) => s.paceSecondsPerKm)
    .filter((p): p is number => p != null && Number.isFinite(p));

  if (!paces.length) {
    return {
      averagePaceSecondsPerKm: null,
      bestPaceSecondsPerKm: null,
      worstPaceSecondsPerKm: null,
      paceStdDevSecondsPerKm: null,
    };
  }

  const sum = paces.reduce((acc, v) => acc + v, 0);
  const average = sum / paces.length;
  const best = Math.min(...paces);
  const worst = Math.max(...paces);
  const variance =
    paces.reduce((acc, v) => acc + (v - average) ** 2, 0) / paces.length;
  const stdDev = Math.sqrt(variance);

  return {
    averagePaceSecondsPerKm: average,
    bestPaceSecondsPerKm: best,
    worstPaceSecondsPerKm: worst,
    paceStdDevSecondsPerKm: stdDev,
  };
}

export function computeCadenceStatsFromSplits(splits: Split[]): CadenceStats {
  const cadences = splits
    .map((s) => s.averageCadenceSpm)
    .filter((c): c is number => c != null && Number.isFinite(c));

  if (!cadences.length) {
    return {
      averageCadenceSpm: null,
      minCadenceSpm: null,
      maxCadenceSpm: null,
      cadenceStdDevSpm: null,
    };
  }

  const sum = cadences.reduce((acc, v) => acc + v, 0);
  const average = sum / cadences.length;
  const min = Math.min(...cadences);
  const max = Math.max(...cadences);
  const variance =
    cadences.reduce((acc, v) => acc + (v - average) ** 2, 0) /
    cadences.length;
  const stdDev = Math.sqrt(variance);

  return {
    averageCadenceSpm: average,
    minCadenceSpm: min,
    maxCadenceSpm: max,
    cadenceStdDevSpm: stdDev,
  };
}

export function computeHalfComparison(session: ParsedSession): HalfComparison | null {
  const { summary, records } = session;

  if (!records.length || summary.totalDistanceMeters <= 0) {
    return null;
  }

  const totalDistanceMeters = summary.totalDistanceMeters;
  const halfDistanceMeters = totalDistanceMeters / 2;

  const startTime = records[0].timestamp;
  const endTime = records[records.length - 1].timestamp;

  const halfTime = getTimeAtDistance(records, halfDistanceMeters);

  const firstHalfDurationSeconds =
    (halfTime.getTime() - startTime.getTime()) / 1000;
  const secondHalfDurationSeconds =
    (endTime.getTime() - halfTime.getTime()) / 1000;

  const firstHalfPaceSecondsPerKm =
    halfDistanceMeters > 0
      ? firstHalfDurationSeconds / (halfDistanceMeters / 1000)
      : null;

  const secondHalfPaceSecondsPerKm =
    totalDistanceMeters - halfDistanceMeters > 0
      ? secondHalfDurationSeconds /
        ((totalDistanceMeters - halfDistanceMeters) / 1000)
      : null;

  let paceDifferenceSecondsPerKm: number | null = null;

  if (
    firstHalfPaceSecondsPerKm != null &&
    secondHalfPaceSecondsPerKm != null
  ) {
    paceDifferenceSecondsPerKm =
      secondHalfPaceSecondsPerKm - firstHalfPaceSecondsPerKm;
  }

  return {
    firstHalfDistanceMeters: halfDistanceMeters,
    secondHalfDistanceMeters: totalDistanceMeters - halfDistanceMeters,
    firstHalfDurationSeconds,
    secondHalfDurationSeconds,
    firstHalfPaceSecondsPerKm,
    secondHalfPaceSecondsPerKm,
    paceDifferenceSecondsPerKm,
  };
}

export function detectPauses(
  session: ParsedSession,
  options?: PauseDetectionOptions,
): DetectedPause[] {
  const { records } = session;

  if (records.length < 2) {
    return [];
  }

  const minPauseDurationSeconds = options?.minPauseDurationSeconds ?? 10;

  const pauses: DetectedPause[] = [];
  let currentPauseStartIndex: number | null = null;

  for (let i = 0; i < records.length; i += 1) {
    const rec = records[i];
    const isStopped = rec.speedMetersPerSecond === 0;

    if (isStopped && currentPauseStartIndex == null) {
      currentPauseStartIndex = i;
    } else if (!isStopped && currentPauseStartIndex != null) {
      const startRec = records[currentPauseStartIndex];
      const endRec = records[i - 1];

      const durationSeconds =
        (endRec.timestamp.getTime() - startRec.timestamp.getTime()) / 1000;

      if (durationSeconds >= minPauseDurationSeconds) {
        pauses.push({
          startTime: startRec.timestamp,
          endTime: endRec.timestamp,
          durationSeconds,
          startDistanceMeters: startRec.distanceMeters,
          endDistanceMeters: endRec.distanceMeters,
        });
      }

      currentPauseStartIndex = null;
    }
  }

  if (currentPauseStartIndex != null) {
    const startRec = records[currentPauseStartIndex];
    const endRec = records[records.length - 1];

    const durationSeconds =
      (endRec.timestamp.getTime() - startRec.timestamp.getTime()) / 1000;

    if (durationSeconds >= minPauseDurationSeconds) {
      pauses.push({
        startTime: startRec.timestamp,
        endTime: endRec.timestamp,
        durationSeconds,
        startDistanceMeters: startRec.distanceMeters,
        endDistanceMeters: endRec.distanceMeters,
      });
    }
  }

  return pauses;
}

function computeConsistencyMetricsInternal(
  paceStats: PaceStats,
  cadenceStats: CadenceStats,
  halfComparison: HalfComparison | null,
  pauses: DetectedPause[],
): ConsistencyMetrics {
  let paceStabilityScore: number | null = null;

  if (
    paceStats.averagePaceSecondsPerKm != null &&
    paceStats.paceStdDevSecondsPerKm != null &&
    paceStats.averagePaceSecondsPerKm > 0
  ) {
    const relStd =
      paceStats.paceStdDevSecondsPerKm /
      paceStats.averagePaceSecondsPerKm;
    paceStabilityScore = Math.max(0, 100 - relStd * 100);
  }

  let cadenceStabilityScore: number | null = null;

  if (
    cadenceStats.averageCadenceSpm != null &&
    cadenceStats.cadenceStdDevSpm != null &&
    cadenceStats.averageCadenceSpm > 0
  ) {
    const relStd =
      cadenceStats.cadenceStdDevSpm / cadenceStats.averageCadenceSpm;
    cadenceStabilityScore = Math.max(0, 100 - relStd * 100);
  }

  let negativeSplitScore: number | null = null;

  if (
    halfComparison?.firstHalfPaceSecondsPerKm != null &&
    halfComparison.secondHalfPaceSecondsPerKm != null
  ) {
    const diff =
      halfComparison.secondHalfPaceSecondsPerKm -
      halfComparison.firstHalfPaceSecondsPerKm;

    if (diff <= -10) {
      negativeSplitScore = 100;
    } else if (diff >= 10) {
      negativeSplitScore = 0;
    } else {
      negativeSplitScore = 50 - (diff / 10) * 50;
    }
  }

  let overallSessionScore: number | null = null;

  if (
    paceStabilityScore != null ||
    cadenceStabilityScore != null ||
    negativeSplitScore != null
  ) {
    const components: number[] = [];

    if (paceStabilityScore != null) components.push(paceStabilityScore);
    if (cadenceStabilityScore != null) components.push(cadenceStabilityScore);
    if (negativeSplitScore != null) components.push(negativeSplitScore);

    const base =
      components.reduce((acc, v) => acc + v, 0) / components.length;

    const longPausePenalty = pauses.length > 0 ? 10 : 0;

    overallSessionScore = Math.max(0, base - longPausePenalty);
  }

  return {
    paceStabilityScore,
    cadenceStabilityScore,
    negativeSplitScore,
    overallSessionScore,
  };
}

export function computeSessionMetrics(session: ParsedSession): SessionMetrics {
  const totals = computeTotals(session);
  const splits = computePerKmSplits(session);
  const paceStats = computePaceStatsFromSplits(splits);
  const cadenceStats = computeCadenceStatsFromSplits(splits);
  const halfComparison = computeHalfComparison(session);
  const pauses = detectPauses(session);
  const consistency = computeConsistencyMetricsInternal(
    paceStats,
    cadenceStats,
    halfComparison,
    pauses,
  );

  return {
    totals,
    splits,
    paceStats,
    cadenceStats,
    halfComparison,
    pauses,
    consistency,
  };
}

export function buildInsertSessionInputFromParsed(
  userId: string,
  sequenceNumber: number,
  parsed: ParsedSession,
  metrics: SessionMetrics,
  routePolyline: RoutePolyline,
): InsertSessionInput {
  const { summary, records } = parsed;

  const payload: InsertSessionInput = {
    userId,
    sequenceNumber,
    userProvidedName: null,
    startTime: summary.startTime,
    endTime: summary.endTime,
    totalDistanceMeters: summary.totalDistanceMeters,
    totalDurationSeconds: summary.totalDurationSeconds,
    averagePaceSecondsPerKm: summary.averagePaceSecondsPerKm,
    averageCadenceSpm: summary.averageCadenceSpm,
    metricsJson: JSON.stringify(metrics),
    routePolylineJson: JSON.stringify(routePolyline),
    recordsJson: JSON.stringify(records),
  };

  return payload;
}

export function computeSessionTimeSummary(
  metrics: SessionMetrics,
): SessionTimeSummary {
  const elapsedDurationSeconds = Math.max(
    0,
    metrics.totals.totalDurationSeconds,
  );

  const totalPauseSeconds = metrics.pauses.reduce((acc, pause) => {
    return acc + Math.max(0, pause.durationSeconds);
  }, 0);

  const workoutDurationSeconds = Math.max(
    0,
    elapsedDurationSeconds - totalPauseSeconds,
  );

  return {
    elapsedDurationSeconds,
    workoutDurationSeconds,
    totalPauseSeconds,
  };
}
