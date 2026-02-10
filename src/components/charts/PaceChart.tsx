"use client";

import { useMemo } from "react";
import type { SessionRecord } from "../../types/session";
import { TimeSeriesChart } from "./TimeSeriesChart";

function speedToPaceSecondsPerKm(speedMetersPerSecond: number | null): number | null {
  if (speedMetersPerSecond == null || speedMetersPerSecond <= 0) {
    return null;
  }

  const paceSecondsPerKm = 1000 / speedMetersPerSecond;

  // Filter out implausible paces caused by GPS noise or pauses
  if (!Number.isFinite(paceSecondsPerKm)) {
    return null;
  }

  // Keep only 2:00–20:00 min/km window (120–1200 s/km)
  if (paceSecondsPerKm < 120 || paceSecondsPerKm > 1200) {
    return null;
  }

  return paceSecondsPerKm;
}

function formatMinutesFromSeconds(seconds: number): number {
  return seconds / 60;
}

type PaceChartProps = {
  records: SessionRecord[];
};

export function PaceChart({ records }: PaceChartProps) {
  const { xValues, yValues } = useMemo(() => {
    if (!records.length) {
      // eslint-disable-next-line no-console
      console.log("[PaceChart] no records provided");
      return { xValues: [] as number[], yValues: [] as (number | null)[] };
    }

    const startTime = records[0].timestamp.getTime();
    const lastTime = records[records.length - 1].timestamp.getTime();
    const totalDurationSeconds = (lastTime - startTime) / 1000;
    const totalMinutes = Math.max(1, Math.ceil(totalDurationSeconds / 60));

    const paceSums = new Array<number>(totalMinutes).fill(0);
    const paceCounts = new Array<number>(totalMinutes).fill(0);

    for (const rec of records) {
      const elapsedSeconds = (rec.timestamp.getTime() - startTime) / 1000;
      const minuteIndex = Math.floor(elapsedSeconds / 60);

      if (minuteIndex < 0 || minuteIndex >= totalMinutes) continue;

      const paceSecondsPerKm = speedToPaceSecondsPerKm(
        rec.speedMetersPerSecond,
      );

      if (paceSecondsPerKm == null) continue;

      paceSums[minuteIndex] += paceSecondsPerKm;
      paceCounts[minuteIndex] += 1;
    }

    const xValues: number[] = [];
    const yValues: (number | null)[] = [];

    for (let i = 0; i < totalMinutes; i += 1) {
      xValues.push(i);

      if (paceCounts[i] === 0) {
        yValues.push(null);
      } else {
        const avgSecondsPerKm = paceSums[i] / paceCounts[i];
        yValues.push(avgSecondsPerKm / 60);
      }
    }

    // eslint-disable-next-line no-console
    console.log("[PaceChart] data sample", {
      recordCount: records.length,
      xSample: xValues.slice(0, 5),
      ySample: yValues.slice(0, 5),
    });

    return { xValues, yValues };
  }, [records]);

  const hasData = yValues.some((v) => v != null && Number.isFinite(v));

  if (xValues.length === 0 || yValues.length === 0 || !hasData) {
    return (
      <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>
        Pace data not available or too noisy to plot.
      </p>
    );
  }

  return (
    <TimeSeriesChart
      title="Pace over time"
      xLabel="Minutes from start"
      yLabel="Pace (min/km)"
      seriesLabel="Pace"
      xValues={xValues}
      yValues={yValues}
      variant="bar"
      barColor="#16a34a"
    />
  );
}
