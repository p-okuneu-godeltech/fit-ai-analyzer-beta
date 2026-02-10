"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth/hooks";
import type { SessionMetrics, SessionRecord } from "@/types/session";
import type { RoutePolyline } from "@/lib/fit/route";
import { SessionSummaryPanel } from "@/components/ui/SessionSummaryPanel";
import dynamic from "next/dynamic";
import { SplitsTable } from "@/components/charts/SplitsTable";
import { PaceChart } from "@/components/charts/PaceChart";
import { CadenceChart } from "@/components/charts/CadenceChart";

const RouteMap = dynamic(() => import("@/components/maps/RouteMap"), {
  ssr: false,
});

type SessionDetailResponse = {
  id: number;
  metricsJson: string;
  routePolylineJson: string;
  recordsJson: string;
};

export default function SessionDetailPage() {
  const params = useParams<{ id: string }>();
  const { isAuthenticated, isLoading } = useAuth();

  const [metrics, setMetrics] = useState<SessionMetrics | null>(null);
  const [records, setRecords] = useState<SessionRecord[] | null>(null);
  const [polyline, setPolyline] = useState<RoutePolyline | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const id = params?.id;
    if (!id) return;

    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch(`/api/sessions/${id}`);
        if (!res.ok) {
          throw new Error("Failed to load session");
        }
        const json = (await res.json()) as SessionDetailResponse;
        if (cancelled) return;

        const parsedMetrics = JSON.parse(json.metricsJson) as SessionMetrics;
        const parsedPolyline = JSON.parse(
          json.routePolylineJson,
        ) as RoutePolyline;
        const rawRecords = JSON.parse(json.recordsJson) as any[];

        const normalisedRecords: SessionRecord[] = rawRecords.map((r) => ({
          ...r,
          timestamp: new Date(r.timestamp),
        }));

        setMetrics(parsedMetrics);
        setPolyline(parsedPolyline);
        setRecords(normalisedRecords);
      } catch (e) {
        if (!cancelled) {
          setError("Failed to load session");
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, params]);

  if (isLoading) {
    return (
      <main style={{ padding: "2rem" }}>
        <p>Loading…</p>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main style={{ padding: "2rem" }}>
        <p>You need to sign in to view this session.</p>
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ padding: "2rem" }}>
        <p style={{ color: "#b91c1c" }}>{error}</p>
      </main>
    );
  }

  if (!metrics || !records) {
    return (
      <main style={{ padding: "2rem" }}>
        <p>Loading session data…</p>
      </main>
    );
  }

  return (
    <main style={{ padding: "2rem" }}>
      <h1>Session Detail</h1>
      <SessionSummaryPanel metrics={metrics} />
      <SplitsTable splits={metrics.splits} />

      <section style={{ marginBottom: "1.5rem" }}>
        <h3>Route Map</h3>
        {polyline && polyline.length >= 2 ? (
          <RouteMap polyline={polyline} />
        ) : (
          <p style={{ color: "#6b7280" }}>
            No GPS route available (missing or too few location points).
          </p>
        )}
      </section>

      <section style={{ marginBottom: "1.5rem" }}>
        <PaceChart records={records} />
        <div style={{ height: "1rem" }} />
        <CadenceChart records={records} />
      </section>
    </main>
  );
}
