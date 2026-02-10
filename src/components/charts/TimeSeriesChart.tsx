"use client";

import { useEffect, useRef } from "react";
import type uPlot from "uplot";
import Uplot from "uplot";

type TimeSeriesChartProps = {
  width?: number;
  height?: number;
  title?: string;
  xLabel?: string;
  yLabel?: string;
  seriesLabel: string;
  xValues: number[];
  yValues: (number | null)[];
  variant?: "line" | "bar";
  barColor?: string;
};

export function TimeSeriesChart({
  width = 800,
  height = 240,
  title,
  xLabel,
  yLabel,
  seriesLabel,
  xValues,
  yValues,
  variant = "line",
  barColor = "#2563eb",
}: TimeSeriesChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const plotRef = useRef<uPlot | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (plotRef.current) {
      plotRef.current.destroy();
      plotRef.current = null;
    }

    if (xValues.length === 0 || yValues.length === 0) {
      return;
    }

    const data: uPlot.AlignedData = [xValues, yValues];

    const isBar = variant === "bar";

    const opts: uPlot.Options = {
      width,
      height,
      title,
      series: [
        {},
        {
          label: seriesLabel,
          stroke: barColor,
          width: isBar ? 0 : 2,
          spanGaps: true,
        },
      ],
      axes: [
        {
          label: xLabel,
        },
        {
          label: yLabel,
        },
      ],
      scales: {
        x: {
          time: false,
        },
      },
      hooks: isBar
        ? {
            draw: [
              (u) => {
                const ctx = u.ctx;
                const xVals = u.data[0] as number[];
                const yVals = u.data[1] as (number | null)[];

                if (!xVals.length) return;

                const { top, left, width: plotWidth, height: plotHeight } =
                  u.bbox;
                const baseY = top + plotHeight;

                const pxPerBin =
                  xVals.length > 1
                    ? Math.abs(
                        u.valToPos(xVals[1], "x", true) -
                          u.valToPos(xVals[0], "x", true),
                      ) * 0.8
                    : plotWidth * 0.8;

                ctx.save();
                ctx.fillStyle = barColor;

                for (let i = 0; i < xVals.length; i += 1) {
                  const y = yVals[i];
                  if (y == null || !Number.isFinite(y)) continue;

                  const xCenter = u.valToPos(xVals[i], "x", true);
                  const x0 = xCenter - pxPerBin / 2;
                  const yPos = u.valToPos(y, "y", true);
                  const barHeight = baseY - yPos;

                  if (barHeight <= 0) continue;

                  ctx.fillRect(x0, yPos, pxPerBin, barHeight);
                }

                ctx.restore();
              },
            ],
          }
        : undefined,
    };

    plotRef.current = new Uplot(opts, data, containerRef.current);

    return () => {
      if (plotRef.current) {
        plotRef.current.destroy();
        plotRef.current = null;
      }
    };
  }, [barColor, height, seriesLabel, title, variant, width, xLabel, xValues, yLabel, yValues]);

  return <div ref={containerRef} />;
}
