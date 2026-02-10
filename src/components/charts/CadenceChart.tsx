"use client";

import { useMemo } from "react";
import type { SessionRecord } from "../../types/session";
import { TimeSeriesChart } from "./TimeSeriesChart";

function formatMinutesFromSeconds(seconds: number): number {
  return seconds / 60;
}

type CadenceChartProps = {
  records: SessionRecord[];
};

export function CadenceChart({ records }: CadenceChartProps) {
  const { xValues, yValues } = useMemo(() => {
    if (!records.length) {
      return { xValues: [] as number[], yValues: [] as (number | null)[] };
    }

    const startTime = records[0].timestamp.getTime();
    const lastTime = records[records.length - 1].timestamp.getTime();
    const totalDurationSeconds = (lastTime - startTime) / 1000;
    const totalMinutes = Math.max(1, Math.ceil(totalDurationSeconds / 60));

    const cadenceSums = new Array<number>(totalMinutes).fill(0);
    const cadenceCounts = new Array<number>(totalMinutes).fill(0);

    for (const rec of records) {
      const elapsedSeconds = (rec.timestamp.getTime() - startTime) / 1000;
      const minuteIndex = Math.floor(elapsedSeconds / 60);

      if (minuteIndex < 0 || minuteIndex >= totalMinutes) continue;

      if (rec.cadenceSpm == null || !Number.isFinite(rec.cadenceSpm)) {
        continue;
      }

      cadenceSums[minuteIndex] += rec.cadenceSpm;
      cadenceCounts[minuteIndex] += 1;
    }

    const xValues: number[] = [];
    const yValues: (number | null)[] = [];

    for (let i = 0; i < totalMinutes; i += 1) {
      xValues.push(i);

      if (cadenceCounts[i] === 0) {
        yValues.push(null);
      } else {
        yValues.push(cadenceSums[i] / cadenceCounts[i]);
      }
    }

    return { xValues, yValues };
  }, [records]);

  const hasData = yValues.some((v) => v != null && Number.isFinite(v));

  if (xValues.length === 0 || yValues.length === 0 || !hasData) {
    return (
      <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>
        Cadence data not available or too noisy to plot.
      </p>
    );
  }

  return (
    <TimeSeriesChart
      title="Cadence over time"
      xLabel="Minutes from start"
      yLabel="Cadence (spm)"
      seriesLabel="Cadence"
      xValues={xValues}
      yValues={yValues}
      variant="bar"
      barColor="#db2777"
    />
  );
}
