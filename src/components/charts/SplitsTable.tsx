"use client";

import type { Split } from "../../types/session";
import { formatCadence, formatDistanceKm, formatPace } from "../../utils/format";
import styles from "./SplitsTable.module.css";

type SplitsTableProps = {
  splits: Split[];
};

export function SplitsTable({ splits }: SplitsTableProps) {
  if (!splits.length) {
    return null;
  }

  return (
    <section className={styles.container}>
      <h3>Per-km Splits</h3>
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>km</th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Distance</th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Pace</th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Cadence</th>
          </tr>
        </thead>
        <tbody>
          {splits.map((split) => (
            <tr key={split.index}>
              <td style={{ padding: "0.25rem 0" }}>{split.index}</td>
              <td style={{ padding: "0.25rem 0" }}>{formatDistanceKm(split.distanceMeters)}</td>
              <td style={{ padding: "0.25rem 0" }}>{formatPace(split.paceSecondsPerKm)}</td>
              <td style={{ padding: "0.25rem 0" }}>{formatCadence(split.averageCadenceSpm)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
