"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { useFitParser } from "../../../lib/fit/useFitParser";
import { computeSessionMetrics } from "../../../lib/analysis/sessionMetrics";
import { buildRoutePolyline } from "../../../lib/fit/route";
import type { FitParseError, FitParseSuccess } from "../../../types/fit";
import { SplitsTable } from "../../../components/charts/SplitsTable";
import { SessionSummaryPanel } from "../../../components/ui/SessionSummaryPanel";

const RouteMap = dynamic(() => import("../../../components/maps/RouteMap"), {
  ssr: false,
});

export default function FitUploadDebugPage() {
  const { parseFile, loading, error, result } = useFitParser();
  const [localError, setLocalError] = useState<string | null>(null);

  const onFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.name.toLowerCase().endsWith(".fit")) {
        setLocalError("Please select a .FIT file");
        return;
      }

      setLocalError(null);
      await parseFile(file);
    },
    [parseFile],
  );

  const renderResult = () => {
    if (!result) return null;

    if ("type" in result) {
      const err = result as FitParseError;
      return (
        <div style={{ marginTop: "1rem", color: "#b91c1c" }}>
          <h2>FIT Parse Error</h2>
          <p>
            <strong>{err.type}</strong>: {err.message}
          </p>
        </div>
      );
    }

    const outcome = result as FitParseSuccess;
    const metrics = computeSessionMetrics(outcome.parsedSession);
    const polyline = buildRoutePolyline(outcome.parsedSession.records);

    return (
      <div style={{ marginTop: "1rem" }}>
        <h2>Parsed Session Summary</h2>

        <SessionSummaryPanel metrics={metrics} />

        {/* {metrics.halfComparison && (
          <section style={{ marginBottom: "1rem" }}>
            <h3>Pace Drift (First vs Second Half)</h3>
            <p>
              First half: {formatPace(metrics.halfComparison.firstHalfPaceSecondsPerKm)}
              {" • "}
              Second half: {formatPace(metrics.halfComparison.secondHalfPaceSecondsPerKm)}
              {" • "}
              Drift: {metrics.halfComparison.paceDifferenceSecondsPerKm != null
                ? `${metrics.halfComparison.paceDifferenceSecondsPerKm.toFixed(1)} s/km`
                : "–"}
            </p>
          </section>
        )} */}

        <SplitsTable splits={metrics.splits} />

        <section style={{ marginBottom: "1rem" }}>
          <h3>Route Map</h3>
          {polyline.length >= 2 ? (
            <RouteMap polyline={polyline} />
          ) : (
            <p style={{ color: "#6b7280" }}>
              No GPS route available (missing or too few location points).
            </p>
          )}
        </section>
      </div>
    );
  };

  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>FIT Upload Debug</h1>
      <p>Upload a .FIT file to inspect the parsed session.</p>

      <input type="file" onChange={onFileChange} disabled={loading} />

      {loading && <p>Parsing FIT file…</p>}

      {localError && (
        <p style={{ color: "#b91c1c" }}>
          {localError}
        </p>
      )}

      {error && (
        <p style={{ color: "#b91c1c" }}>
          Worker error: {error}
        </p>
      )}

      {renderResult()}
    </main>
  );
}

