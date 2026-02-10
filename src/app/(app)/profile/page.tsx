"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/hooks";
import type { StressLevel, UserProfile } from "@/types/profile";

type ProfileFormState = {
  yearsRunning: string;
  weeklyKilometrage: string;
  personalBest5kSeconds: string;
  personalBest5kDate: string;
  personalBest10kSeconds: string;
  personalBest10kDate: string;
  averageDailyCalories: string;
  sleepHours: string;
  sleepConsistencyScore: string;
  stressLevel: StressLevel | "";
};

const EMPTY_FORM: ProfileFormState = {
  yearsRunning: "0",
  weeklyKilometrage: "",
  personalBest5kSeconds: "",
  personalBest5kDate: "",
  personalBest10kSeconds: "",
  personalBest10kDate: "",
  averageDailyCalories: "",
  sleepHours: "",
  sleepConsistencyScore: "",
  stressLevel: "",
};

export default function ProfilePage() {
  const { isAuthenticated, isLoading, signInWithGoogle } = useAuth();
  const [form, setForm] = useState<ProfileFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [analyticsReady, setAnalyticsReady] = useState(false);

  const toDateInputValue = (value: unknown): string => {
    if (!value) return "";

    let date: Date;
    if (value instanceof Date) {
      date = value;
    } else if (typeof value === "string" || typeof value === "number") {
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) return "";
      date = parsed;
    } else {
      return "";
    }

    return date.toISOString().slice(0, 10);
  };

  const formatSecondsToTime = (value: number | null): string => {
    if (value == null || Number.isNaN(value)) return "";
    const total = Math.max(0, Math.floor(value));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    const hh = hours.toString().padStart(2, "0");
    const mm = minutes.toString().padStart(2, "0");
    const ss = seconds.toString().padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  };

  const parseTimeToSeconds = (raw: string): number => {
    const value = raw.trim();
    if (!value) {
      throw new Error("Time value is empty");
    }
    const parts = value.split(":");
    if (parts.length !== 3) {
      throw new Error("Use hh:mm:ss format for personal bests");
    }
    const [hStr, mStr, sStr] = parts;
    const h = Number(hStr);
    const m = Number(mStr);
    const s = Number(sStr);
    if (
      !Number.isFinite(h) ||
      !Number.isFinite(m) ||
      !Number.isFinite(s) ||
      h < 0 ||
      m < 0 ||
      m >= 60 ||
      s < 0 ||
      s >= 60
    ) {
      throw new Error("Invalid time; expected hh:mm:ss with 0≤mm,ss<60");
    }
    return h * 3600 + m * 60 + s;
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/profile", { cache: "no-store" });
        if (!res.ok) {
          throw new Error("Failed to load profile");
        }
        const data: {
          profile: UserProfile | null;
          analyticsReady: boolean;
        } = await res.json();

        if (cancelled) return;

        setAnalyticsReady(data.analyticsReady);

        if (data.profile) {
          const p = data.profile;
          const personalBest5kDateValue = toDateInputValue(
            p.personalBest5kDate,
          );
          const personalBest10kDateValue = toDateInputValue(
            p.personalBest10kDate,
          );
          setForm({
            yearsRunning: p.yearsRunning?.toString() ?? "0",
            weeklyKilometrage: p.weeklyKilometrage?.toString() ?? "",
            personalBest5kSeconds: formatSecondsToTime(
              p.personalBest5kSeconds,
            ),
            personalBest5kDate: personalBest5kDateValue,
            personalBest10kSeconds: formatSecondsToTime(
              p.personalBest10kSeconds,
            ),
            personalBest10kDate: personalBest10kDateValue,
            averageDailyCalories:
              p.averageDailyCalories?.toString() ?? "",
            sleepHours: p.sleepHours?.toString() ?? "",
            sleepConsistencyScore:
              p.sleepConsistencyScore?.toString() ?? "",
            stressLevel: (p.stressLevel ?? "") as StressLevel | "",
          });
        }
      } catch (e) {
        if (!cancelled) {
          setError((e as Error).message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const updateField = (field: keyof ProfileFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      let personalBest5kSeconds: number | null = null;
      let personalBest10kSeconds: number | null = null;

      if (form.personalBest5kSeconds.trim() !== "") {
        personalBest5kSeconds = parseTimeToSeconds(form.personalBest5kSeconds);
      }

      if (form.personalBest10kSeconds.trim() !== "") {
        personalBest10kSeconds = parseTimeToSeconds(form.personalBest10kSeconds);
      }

      const payload = {
        yearsRunning: form.yearsRunning,
        weeklyKilometrage: form.weeklyKilometrage,
        personalBest5kSeconds,
        personalBest5kDate:
          form.personalBest5kDate.trim() === ""
            ? null
            : new Date(form.personalBest5kDate).toISOString(),
        personalBest10kSeconds,
        personalBest10kDate:
          form.personalBest10kDate.trim() === ""
            ? null
            : new Date(form.personalBest10kDate).toISOString(),
        averageDailyCalories:
          form.averageDailyCalories.trim() === ""
            ? null
            : Number(form.averageDailyCalories),
        sleepHours:
          form.sleepHours.trim() === "" ? null : Number(form.sleepHours),
        sleepConsistencyScore:
          form.sleepConsistencyScore.trim() === ""
            ? null
            : Number(form.sleepConsistencyScore),
        stressLevel:
          form.stressLevel === "" ? null : (form.stressLevel as StressLevel),
      };

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to save profile");
      }

      setAnalyticsReady(data.analyticsReady === true);
      setSuccess("Profile saved successfully.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <main style={{ padding: "2rem", paddingTop: 0 }}>
        <h1>Your Running Profile</h1>
        <p>Checking authentication…</p>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main style={{ padding: "2rem", paddingTop: 0 }}>
        <h1>Your Running Profile</h1>
        <p style={{ marginBottom: "1rem" }}>
          Sign in with Google to create and edit your running profile.
        </p>
        <button
          type="button"
          onClick={() => signInWithGoogle()}
          style={{
            padding: "8px 16px",
            borderRadius: 999,
            border: "1px solid #ddd",
            background: "#fff",
            cursor: "pointer",
          }}
        >
          Sign in with Google
        </button>
      </main>
    );
  }

  return (
    <main style={{ padding: "2rem", paddingTop: 0, maxWidth: 640 }}>
      <h1>Your Running Profile</h1>
      <p style={{ color: "#4b5563", marginBottom: "1rem" }}>
        This information helps the analytics engine interpret your runs.
        Uploading FIT files does not require a profile, but advanced
        analytics will.
      </p>

      {analyticsReady ? (
        <p style={{ color: "#047857", marginBottom: "1rem" }}>
          Your profile is complete for analytics.
        </p>
      ) : (
        <p style={{ color: "#b45309", marginBottom: "1rem" }}>
          Running background is required before analytics can be used.
        </p>
      )}

      {loading && <p>Loading profile…</p>}
      {error && <p style={{ color: "#b91c1c" }}>{error}</p>}
      {success && (
        <div style={{ marginBottom: "1rem" }}>
          <p style={{ color: "#047857", marginBottom: 8 }}>{success}</p>
          <Link
            href="/session/upload"
            style={{
              display: "inline-block",
              padding: "8px 16px",
              borderRadius: 999,
              border: "1px solid #111827",
              background: "#fff",
              color: "#111827",
              textDecoration: "none",
            }}
          >
            Go to session upload
          </Link>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ marginTop: "1rem" }}>
        <fieldset
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <legend style={{ padding: "0 8px", fontWeight: 600 }}>
            Running background (required)
          </legend>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", marginBottom: 4 }}>
              Years running
            </label>
            <input
              type="number"
              min={0}
              value={form.yearsRunning}
              onChange={(e) => updateField("yearsRunning", e.target.value)}
              required
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", marginBottom: 4 }}>
              Typical weekly kilometrage
            </label>
            <input
              type="number"
              min={0}
              step="0.1"
              value={form.weeklyKilometrage}
              onChange={(e) => updateField("weeklyKilometrage", e.target.value)}
              required
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", marginBottom: 4 }}>
              5k personal best (hh:mm:ss)
            </label>
            <input
              type="text"
              value={form.personalBest5kSeconds}
              onChange={(e) => updateField("personalBest5kSeconds", e.target.value)}
              placeholder="Leave empty if none (e.g. 00:20:00)"
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", marginBottom: 4 }}>
              5k personal best date
            </label>
            <input
              type="date"
              value={form.personalBest5kDate}
              onChange={(e) => updateField("personalBest5kDate", e.target.value)}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", marginBottom: 4 }}>
              10k personal best (hh:mm:ss)
            </label>
            <input
              type="text"
              value={form.personalBest10kSeconds}
              onChange={(e) => updateField("personalBest10kSeconds", e.target.value)}
              placeholder="Leave empty if none (e.g. 00:42:00)"
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", marginBottom: 4 }}>
              10k personal best date
            </label>
            <input
              type="date"
              value={form.personalBest10kDate}
              onChange={(e) => updateField("personalBest10kDate", e.target.value)}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
            />
          </div>
        </fieldset>

        <fieldset
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <legend style={{ padding: "0 8px", fontWeight: 600 }}>
            Lifestyle (optional)
          </legend>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", marginBottom: 4 }}>
              Average daily calories
            </label>
            <input
              type="number"
              min={0}
              value={form.averageDailyCalories}
              onChange={(e) => updateField("averageDailyCalories", e.target.value)}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", marginBottom: 4 }}>
              Sleep hours per night (0–24)
            </label>
            <input
              type="number"
              min={0}
              max={24}
              step="0.1"
              value={form.sleepHours}
              onChange={(e) => updateField("sleepHours", e.target.value)}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", marginBottom: 4 }}>
              Sleep consistency (0-100)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={form.sleepConsistencyScore}
              onChange={(e) =>
                updateField("sleepConsistencyScore", e.target.value)
              }
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", marginBottom: 4 }}>
              Stress level
            </label>
            <select
              value={form.stressLevel}
              onChange={(e) =>
                updateField("stressLevel", e.target.value as StressLevel | "")
              }
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
            >
              <option value="">Select an option (optional)</option>
              <option value="never">Never</option>
              <option value="few_times_a_week">Few times a week</option>
              <option value="everyday">Everyday</option>
              <option value="few_times_a_day">Few times a day</option>
            </select>
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={saving}
          style={{
            padding: "10px 20px",
            borderRadius: 999,
            border: "1px solid #111827",
            background: saving ? "#e5e7eb" : "#111827",
            color: saving ? "#4b5563" : "#fff",
            cursor: saving ? "default" : "pointer",
          }}
        >
          {saving ? "Saving…" : "Save profile"}
        </button>
      </form>
    </main>
  );
}
