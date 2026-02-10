"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { computeSessionMetrics } from "../../../lib/analysis/sessionMetrics";
import { buildRoutePolyline } from "../../../lib/fit/route";
import { useFitParser } from "../../../lib/fit/useFitParser";
import type { FitParseError, FitParseSuccess } from "../../../types/fit";
import { PaceChart } from "../../../components/charts/PaceChart";
import { CadenceChart } from "../../../components/charts/CadenceChart";
import { SplitsTable } from "../../../components/charts/SplitsTable";
import { SessionSummaryPanel } from "../../../components/ui/SessionSummaryPanel";
import { useAuth } from "../../../lib/auth/hooks";

const RouteMap = dynamic(() => import("../../../components/maps/RouteMap"), {
  ssr: false,
});

export default function SessionDebugPage() {
  const { parseFile, loading, error, result } = useFitParser();
  const [localError, setLocalError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sessionName, setSessionName] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const { isAuthenticated } = useAuth();

  const onFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.name.toLowerCase().endsWith(".fit")) {
        setLocalError("Please select a .FIT file");
        return;
      }

      setLocalError(null);
      setSaveError(null);
      setSaveSuccess(false);
      setSessionName("");
      await parseFile(file);
    },
    [parseFile],
  );

  const renderContent = () => {
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

    const handleSave = async () => {
      if (!isAuthenticated) return;
      setSaveError(null);
      setSaveSuccess(false);
      setSaving(true);

      try {
        const response = await fetch("/api/sessions/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            parsedSession: outcome.parsedSession,
            metrics,
            userProvidedName: sessionName.trim() || null,
          }),
        });

        if (!response.ok) {
          setSaveError("Failed to save session");
        } else {
          setSaveSuccess(true);
        }
      } catch (e) {
        setSaveError("Failed to save session");
      } finally {
        setSaving(false);
      }
    };

    return (
      <div style={{ marginTop: "1.5rem" }}>
        <SessionSummaryPanel metrics={metrics} />
        
        <SplitsTable splits={metrics.splits} />

        <section style={{ marginBottom: "1.5rem" }}>
          <h3>Route Map</h3>
          {polyline.length >= 2 ? (
            <RouteMap polyline={polyline} />
          ) : (
            <p style={{ color: "#6b7280" }}>
              No GPS route available (missing or too few location points).
            </p>
          )}
        </section>

        <section style={{ marginBottom: "1.5rem" }}>
          <PaceChart records={outcome.parsedSession.records} />
          <div style={{ height: "1rem" }} />
          <CadenceChart records={outcome.parsedSession.records} />
        </section>

        {isAuthenticated && (
          <section style={{ marginBottom: "1.5rem" }}>
            <h3>Save Session</h3>
            {saveSuccess ? (
              <p style={{ color: "#16a34a", marginTop: "0.5rem" }}>
                Session saved!
              </p>
            ) : (
              <>
                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    alignItems: "center",
                  }}
                >
                  <input
                    type="text"
                    placeholder="Optional session name"
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    style={{ padding: "0.25rem 0.5rem", flex: "0 0 260px" }}
                  />
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? "Saving…" : "Save session"}
                  </button>
                </div>
                {saveError && (
                  <p
                    style={{ color: "#b91c1c", marginTop: "0.5rem" }}
                  >
                    {saveError}
                  </p>
                )}
              </>
            )}
          </section>
        )}
      </div>
    );
  };

  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>Session Debug View</h1>
      <p>
        Upload a .FIT file to see workout vs elapsed time, distance, pace,
        cadence, route, and splits in a single view.
      </p>

      <input type="file" onChange={onFileChange} disabled={loading} />

      {loading && <p>Parsing FIT file…</p>}

      {localError && <p style={{ color: "#b91c1c" }}>{localError}</p>}

      {error && <p style={{ color: "#b91c1c" }}>Worker error: {error}</p>}

      {renderContent()}
    </main>
  );
}
