import type { FitParseOutcome } from "../../types/fit";

export type FitParserRequest = {
  id: string;
  buffer: ArrayBuffer;
};

export type FitParserSuccessResponse = {
  id: string;
  ok: true;
  result: FitParseOutcome;
};

export type FitParserErrorResponse = {
  id: string;
  ok: false;
  error: string;
};

export type FitParserResponse = FitParserSuccessResponse | FitParserErrorResponse;
