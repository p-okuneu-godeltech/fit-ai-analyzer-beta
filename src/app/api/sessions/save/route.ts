import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import {
  getNextSequenceNumberForUser,
  insertSessionForUser,
} from "@/db/queries/session";
import type { ParsedSession, SessionMetrics, SessionRecord } from "@/types/session";
import { buildRoutePolyline } from "@/lib/fit/route";
import { buildInsertSessionInputFromParsed } from "@/lib/analysis/sessionMetrics";

export type SaveSessionRequestBody = {
  parsedSession: ParsedSession;
  metrics: SessionMetrics;
  userProvidedName?: string | null;
};

export async function POST(request: Request) {
  const user = await requireUser();

  let body: SaveSessionRequestBody;

  try {
    body = (await request.json()) as SaveSessionRequestBody;
  } catch {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  const { parsedSession, metrics, userProvidedName } = body;

  if (!parsedSession || !parsedSession.summary || !Array.isArray(parsedSession.records)) {
    return new NextResponse("Invalid payload", { status: 400 });
  }

  // Normalise dates that were serialized over the wire
  const normalisedParsed: ParsedSession = {
    summary: {
      ...parsedSession.summary,
      startTime: new Date((parsedSession.summary as any).startTime),
      endTime: new Date((parsedSession.summary as any).endTime),
    },
    records: (parsedSession.records as any[]).map((r) => {
      const rec = r as any;
      return {
        ...rec,
        timestamp: new Date(rec.timestamp),
      } as SessionRecord;
    }),
  };

  const sequenceNumber = getNextSequenceNumberForUser(user.id);
  const polyline = buildRoutePolyline(normalisedParsed.records);

  const baseInput = buildInsertSessionInputFromParsed(
    user.id,
    sequenceNumber,
    normalisedParsed,
    metrics,
    polyline,
  );

  const stored = insertSessionForUser({
    ...baseInput,
    userProvidedName: userProvidedName ?? null,
  });

  return NextResponse.json(stored, { status: 201 });
}
