export function formatDistanceKm(meters: number): string {
  if (!Number.isFinite(meters) || meters <= 0) {
    return "0.00 km";
  }

  return `${(meters / 1000).toFixed(2)} km`;
}

export function formatDuration(seconds: number): string {
  const totalSeconds = Math.max(0, Math.round(seconds));
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }

  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function formatPace(paceSecondsPerKm: number | null): string {
  if (paceSecondsPerKm == null || !Number.isFinite(paceSecondsPerKm)) {
    return "–"; // Replaced with en dash
  }

  const totalSeconds = Math.round(paceSecondsPerKm);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")} /km`;
}

export function formatCadence(spm: number | null): string {
  if (spm == null || !Number.isFinite(spm)) {
    return "–"; // Replaced with en dash
  }

  return `${spm.toFixed(1)} spm`;
}
