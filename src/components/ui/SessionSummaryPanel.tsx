"use client";

import type { SessionMetrics } from "../../types/session";
import { computeSessionTimeSummary } from "../../lib/analysis/sessionMetrics";
import { formatCadence, formatDistanceKm, formatDuration, formatPace } from "../../utils/format";

type SessionSummaryPanelProps = {
  metrics: SessionMetrics;
};

export function SessionSummaryPanel({ metrics }: SessionSummaryPanelProps) {
  const timeSummary = computeSessionTimeSummary(metrics);

  return (
    <section style={{ marginBottom: "1rem" }}>
      <h2>Session Summary</h2>
      <ul>
        <li>Distance: {formatDistanceKm(metrics.totals.totalDistanceMeters)}</li>
        <li>Workout time: {formatDuration(timeSummary.workoutDurationSeconds)}</li>
        <li>Elapsed time: {formatDuration(timeSummary.elapsedDurationSeconds)}</li>
        <li>Average pace: {formatPace(metrics.totals.averagePaceSecondsPerKm)}</li>
        <li>Average cadence: {formatCadence(metrics.totals.averageCadenceSpm)}</li>
      </ul>
      <p style={{ marginTop: "0.5rem", color: "#6b7280", fontSize: "0.875rem" }}>
        Metrics are derived from GPS distance and inferred pauses. Short sessions,
        GPS gaps, or missing cadence can make averages and splits less reliable.
      </p>
    </section>
  );
}
