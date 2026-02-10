import type { SessionRecord, ParsedSession } from "../types/session";

export type FitDecodedMessages = {
  record?: unknown[];
  session?: unknown[];
  lap?: unknown[];
  activity?: unknown[];
  [key: string]: unknown;
};

export type FitDecodeResult = {
  messages: FitDecodedMessages;
  errors: Error[];
};

export type FitParseErrorType =
  | "not-fit-file"
  | "decode-failed"
  | "no-records"
  | "non-running-activity"
  | "unsupported-format";

export type FitParseError = {
  type: FitParseErrorType;
  message: string;
  details?: unknown;
};

export type FitParseSuccess = {
  parsedSession: ParsedSession;
  rawMessages: FitDecodedMessages;
};

export type FitParseOutcome = FitParseSuccess | FitParseError;

export type FitSessionRecord = SessionRecord;
export type FitParsedSession = ParsedSession;
