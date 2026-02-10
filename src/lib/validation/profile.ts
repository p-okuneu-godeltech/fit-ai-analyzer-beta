import { z } from "zod";
import type { StressLevel } from "@/types/profile";
import type { UpsertProfileInput } from "@/db/queries/profile";

const StressLevelSchema = z
  .enum(["never", "few_times_a_week", "few_times_a_day", "everyday"])
  .nullable();

export const ProfilePayloadSchema = z.object({
  yearsRunning: z.coerce
    .number()
    .min(0, "Years running cannot be negative"),
  weeklyKilometrage: z.coerce
    .number()
    .gt(0, "Weekly kilometrage must be a positive number"),
  personalBest5kSeconds: z
    .union([
      z.coerce.number().int().positive(),
      z.literal(null),
    ])
    .optional()
    .default(null),
  personalBest5kDate: z
    .union([
      z.string().datetime(),
      z.literal(null),
    ])
    .optional()
    .default(null),
  personalBest10kSeconds: z
    .union([
      z.coerce.number().int().positive(),
      z.literal(null),
    ])
    .optional()
    .default(null),
  personalBest10kDate: z
    .union([
      z.string().datetime(),
      z.literal(null),
    ])
    .optional()
    .default(null),
  averageDailyCalories: z
    .union([
      z.coerce.number().positive(),
      z.literal(null),
    ])
    .optional()
    .default(null),
  sleepHours: z
    .union([
      z.coerce
        .number()
        .positive()
        .max(24, "Sleep hours per night must be 24 or less"),
      z.literal(null),
    ])
    .optional()
    .default(null),
  sleepConsistencyScore: z
    .union([
      z.coerce.number().min(0).max(100),
      z.literal(null),
    ])
    .optional()
    .default(null),
  stressLevel: StressLevelSchema.optional().default(null),
});

export type ProfilePayload = z.infer<typeof ProfilePayloadSchema>;

export function parseProfilePayload(input: unknown): ProfilePayload {
  const result = ProfilePayloadSchema.safeParse(input);
  if (!result.success) {
    throw new Error(result.error.message);
  }
  return result.data;
}

export function toUpsertProfileInput(payload: ProfilePayload): UpsertProfileInput {
  const parseDate = (value: string | null): Date | null => {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  return {
    yearsRunning: payload.yearsRunning,
    weeklyKilometrage: payload.weeklyKilometrage,
    personalBest5kSeconds: payload.personalBest5kSeconds ?? null,
    personalBest5kDate: parseDate(payload.personalBest5kDate),
    personalBest10kSeconds: payload.personalBest10kSeconds ?? null,
    personalBest10kDate: parseDate(payload.personalBest10kDate),
    averageDailyCalories: payload.averageDailyCalories ?? null,
    sleepHours: payload.sleepHours ?? null,
    sleepConsistencyScore: payload.sleepConsistencyScore ?? null,
    stressLevel: (payload.stressLevel ?? null) as StressLevel | null,
  };
}

export function isAnalyticsReady(payload: ProfilePayload): boolean {
  return (
    payload.yearsRunning >= 0 &&
    payload.weeklyKilometrage > 0
  );
}
