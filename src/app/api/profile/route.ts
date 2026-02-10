import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { getProfileByUserId, upsertProfileForUser } from "@/db/queries/profile";
import {
  parseProfilePayload,
  toUpsertProfileInput,
  isAnalyticsReady,
} from "@/lib/validation/profile";

export async function GET() {
  const user = await requireUser();
  const profile = getProfileByUserId(user.id);

  if (!profile) {
    return NextResponse.json({ profile: null, analyticsReady: false });
  }

  const analyticsReady = isAnalyticsReady({
    yearsRunning: profile.yearsRunning ?? 0,
    weeklyKilometrage: profile.weeklyKilometrage ?? 0,
    personalBest5kSeconds: profile.personalBest5kSeconds,
    personalBest5kDate: profile.personalBest5kDate
      ? profile.personalBest5kDate.toISOString()
      : null,
    personalBest10kSeconds: profile.personalBest10kSeconds,
    personalBest10kDate: profile.personalBest10kDate
      ? profile.personalBest10kDate.toISOString()
      : null,
    averageDailyCalories: profile.averageDailyCalories,
    sleepHours: profile.sleepHours,
    sleepConsistencyScore: profile.sleepConsistencyScore,
    stressLevel: profile.stressLevel,
  });

  return NextResponse.json({ profile, analyticsReady });
}

export async function PUT(request: Request) {
  const user = await requireUser();

  let payloadRaw: unknown;
  try {
    payloadRaw = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 },
    );
  }

  let payload;
  try {
    payload = parseProfilePayload(payloadRaw);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }

  const upsertInput = toUpsertProfileInput(payload);
  const profile = upsertProfileForUser(user.id, upsertInput);
  const analyticsReady = isAnalyticsReady(payload);

  return NextResponse.json({ profile, analyticsReady });
}
