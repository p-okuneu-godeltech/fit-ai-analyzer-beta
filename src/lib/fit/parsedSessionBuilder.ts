import type { ParsedSession, SessionRecord } from "../../types/session";
import type { FitDecodedMessages, FitParseError, FitParseOutcome } from "../../types/fit";
import { normalizeParsedSession } from "./normalize";

export function buildParsedSessionFromMessages(
  messages: FitDecodedMessages,
  errors: Error[],
): FitParseOutcome | FitParseError {
  // Debug: inspect raw messages shape before we try to map to SessionRecord
//   try {
    // console.log("[parsed-session-builder] incoming message keys:", Object.keys(messages));
    // const rawRecord = (messages as any).record ?? (messages as any).recordMesgs;
    // if (rawRecord) {
    //   const asArray = Array.isArray(rawRecord) ? rawRecord : [];
    //   console.log("[parsed-session-builder] raw record count:", asArray.length);
    //   console.log("[parsed-session-builder] first raw record sample:", asArray[0]);
    // } else {
    //   console.log("[parsed-session-builder] no 'record' key on messages");
//     }
//   } catch {
    // best-effort debug only
//   }

  const recordMessages = ((messages as any).record ?? (messages as any).recordMesgs ?? []) as Array<
    Record<string, unknown>
  >;

  if (!recordMessages.length) {
    return {
      type: "no-records",
      message: "FIT file contains no record messages",
      details: { errors },
    };
  }

  const records: SessionRecord[] = [];
  let cadenceSum = 0;
  let cadenceCount = 0;

  for (const msg of recordMessages) {
    const timestamp = msg.timestamp instanceof Date ? msg.timestamp : null;

    if (!timestamp) {
      continue;
    }

    const distanceMeters = typeof msg.distance === "number" ? msg.distance : null;
    const speedMetersPerSecond =
      typeof msg.speed === "number" ? (msg.speed as number) : null;
    const cadenceSpm =
      typeof msg.cadence === "number" ? (msg.cadence as number) * 2 : null;
    const latitudeDeg =
      typeof msg.positionLat === "number"
        ? (msg.positionLat as number) * (180 / 2 ** 31)
        : null;
    const longitudeDeg =
      typeof msg.positionLong === "number"
        ? (msg.positionLong as number) * (180 / 2 ** 31)
        : null;

    if (distanceMeters === null) {
      continue;
    }

    records.push({
      timestamp,
      distanceMeters,
      speedMetersPerSecond,
      cadenceSpm,
      latitudeDeg,
      longitudeDeg,
    });

    if (cadenceSpm !== null) {
      cadenceSum += cadenceSpm;
      cadenceCount += 1;
    }
  }

  if (!records.length) {
    return {
      type: "no-records",
      message: "No valid records with timestamp and distance found",
      details: { errors },
    };
  }

  records.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  const baseParsed: ParsedSession = {
    records,
    summary: {
      id: "temp",
      userId: "temp-user",
      startTime: records[0].timestamp,
      endTime: records[records.length - 1].timestamp,
      totalDistanceMeters: records[records.length - 1].distanceMeters,
      totalDurationSeconds:
        (records[records.length - 1].timestamp.getTime() -
          records[0].timestamp.getTime()) /
        1000,
      averagePaceSecondsPerKm: null,
      averageCadenceSpm: cadenceCount > 0 ? cadenceSum / cadenceCount : null,
    },
  };

  const normalized = normalizeParsedSession(baseParsed);

  return {
    parsedSession: normalized,
    rawMessages: messages,
  };
}
