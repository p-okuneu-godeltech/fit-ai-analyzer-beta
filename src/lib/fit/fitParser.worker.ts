/// <reference lib="webworker" />

import { decodeFitFromArrayBuffer } from "./decoder";
import type { FitParseOutcome, FitParseError } from "../../types/fit";
import type { FitParserRequest, FitParserResponse } from "./workerMessages";
import { buildParsedSessionFromMessages } from "./parsedSessionBuilder";

const ctx: DedicatedWorkerGlobalScope = self as unknown as DedicatedWorkerGlobalScope;

ctx.onmessage = (event: MessageEvent<FitParserRequest>) => {
  const { id, buffer } = event.data;

  try {
    const decodeResult = decodeFitFromArrayBuffer(buffer);

    if (decodeResult.errors.length > 0 && !decodeResult.messages) {
      const errorResponse: FitParserResponse = {
        id,
        ok: false,
        error: decodeResult.errors.map((e) => e.message).join(", "),
      };
      ctx.postMessage(errorResponse);
      return;
    }

    const outcome: FitParseOutcome | FitParseError = buildParsedSessionFromMessages(
      decodeResult.messages,
      decodeResult.errors,
    );

    const response: FitParserResponse = {
      id,
      ok: true,
      result: outcome,
    };

    ctx.postMessage(response);
  } catch (error) {
    const response: FitParserResponse = {
      id,
      ok: false,
      error: error instanceof Error ? error.message : "Unknown worker error",
    };
    ctx.postMessage(response);
  }
};
