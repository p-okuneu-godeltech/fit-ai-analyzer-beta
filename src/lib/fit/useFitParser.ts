"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FitParseOutcome } from "../../types/fit";
import type { FitParserRequest, FitParserResponse } from "./workerMessages";

let requestCounter = 0;

function createWorker(): Worker {
  return new Worker(new URL("./fitParser.worker", import.meta.url), {
    type: "module",
  });
}

export function useFitParser() {
  const workerRef = useRef<Worker | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FitParseOutcome | null>(null);

  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  const parseFile = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    setResult(null);

    const buffer = await file.arrayBuffer();

    if (!workerRef.current) {
      workerRef.current = createWorker();
    }

    const worker = workerRef.current;

    const id = `req-${requestCounter++}`;

    const responsePromise = new Promise<FitParseOutcome>((resolve, reject) => {
      const handleMessage = (event: MessageEvent<FitParserResponse>) => {
        if (event.data.id !== id) return;

        worker.removeEventListener("message", handleMessage);

        if (!event.data.ok) {
          reject(new Error(event.data.error));
          return;
        }

        resolve(event.data.result);
      };

      worker.addEventListener("message", handleMessage);

      const request: FitParserRequest = {
        id,
        buffer,
      };

      worker.postMessage(request, [buffer]);
    });

    try {
      const outcome = await responsePromise;
      setResult(outcome);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    parseFile,
    loading,
    error,
    result,
  };
}
