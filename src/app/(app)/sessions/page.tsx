"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/hooks";
import type { StoredSessionSummary } from "@/db/queries/session";
import { formatDistanceKm, formatDuration } from "@/utils/format";
import styles from "@/components/ui/SessionsList.module.css";

type SessionsResponse = {
  sessions: StoredSessionSummary[];
};

export default function SessionsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [sessions, setSessions] = useState<StoredSessionSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch("/api/sessions");
        if (!res.ok) {
          throw new Error("Failed to load sessions");
        }
        const json = (await res.json()) as SessionsResponse;
        if (!cancelled) {
          setSessions(json.sessions);
        }
      } catch (e) {
        if (!cancelled) {
          setError("Failed to load sessions");
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

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
        <p>You need to sign in to view your sessions.</p>
      </main>
    );
  }

  return (
    <main style={{ padding: "2rem" }}>
      <div className={styles.header}>
        <h1>Your Sessions</h1>
        <Link href="/session/upload" className={styles.addButton}>
          <span>+</span>
          <span>Add New Session</span>
        </Link>
      </div>
      {error && <p style={{ color: "#b91c1c" }}>{error}</p>}
      {!error && sessions && sessions.length === 0 && (
        <p style={{ color: "#6b7280" }}>No sessions saved yet.</p>
      )}
      {!error && sessions && sessions.length > 0 && (
        <div className={styles.list}>
          {sessions.map((session) => {
            const displayName =
              session.userProvidedName ?? `session ${session.sequenceNumber}`;

            const variantIndex = session.sequenceNumber % 4;
            const variantClassName =
              styles[`variant${variantIndex}` as keyof typeof styles] ?? "";

            return (
              <div key={session.id} className={styles.item}>
                <Link href={`/sessions/${session.id}`}>
                <div className={styles.thumbnailWrapper}>
                  <div className={`${styles.thumbnailBase} ${variantClassName}`}>
                    <img
                      src="/map.png"
                      alt="Session route thumbnail"
                      className={styles.thumbnailImage}
                    />
                  </div>
                </div>
                <div className={styles.itemContent}>
                  <h2 className={styles.itemTitle}>{displayName}</h2>
                  <p className={styles.itemMeta}>
                    <span>{formatDistanceKm(session.totalDistanceMeters)}</span>
                    {" · "}
                    <span>
                      {formatDuration(session.totalDurationSeconds)} elapsed
                    </span>
                  </p>
                </div>
                </Link>
                <div className={styles.itemActions}>
                  <button
                    type="button"
                    className={styles.removeButton}
                    onClick={async (event) => {
                      event.preventDefault();
                      event.stopPropagation();

                      try {
                        const res = await fetch(`/api/sessions/${session.id}`, {
                          method: "DELETE",
                        });

                        if (res.ok) {
                          setSessions((prev) =>
                            prev ? prev.filter((s) => s.id !== session.id) : prev,
                          );
                        }
                      } catch {
                        // Swallow errors for now; could surface UI message later
                      }
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
