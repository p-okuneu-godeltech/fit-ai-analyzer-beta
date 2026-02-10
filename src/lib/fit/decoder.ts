import { Decoder, Stream } from "@garmin/fitsdk";
import type { FitDecodeResult, FitDecodedMessages } from "../../types/fit";

export function decodeFitFromArrayBuffer(buffer: ArrayBuffer): FitDecodeResult {
  const uint8 = new Uint8Array(buffer);
  const stream = Stream.fromArrayBuffer(uint8.buffer);

  const isFit = Decoder.isFIT(stream);
  if (!isFit) {
    // Debug: quick visibility when a file is not detected as FIT
    console.log("[fit-decoder] isFIT returned false");
    return {
      messages: {},
      errors: [new Error("Not a FIT file")],
    };
  }

  const decoder = new Decoder(stream);
  const { messages, errors } = decoder.read({
    applyScaleAndOffset: true,
    expandSubFields: true,
    expandComponents: true,
    convertTypesToStrings: true,
    convertDateTimesToDates: true,
    includeUnknownData: false,
    mergeHeartRates: true,
    decodeMemoGlobs: false,
  });

  // Debug: log top-level message keys and basic error info
  // This helps understand the structure returned by @garmin/fitsdk
  try {
    console.log("[fit-decoder] message keys:", Object.keys(messages ?? {}));
    if ((messages as any).record) {
      const records = (messages as any).record as unknown[];
      console.log("[fit-decoder] record count:", records.length);
      console.log("[fit-decoder] first record sample:", records[0]);
    }
    if (errors.length) {
      console.log("[fit-decoder] decode errors:", errors.map((e: Error) => e.message));
    }
  } catch {
    // best-effort debug logging only
  }

  return {
    messages: messages as FitDecodedMessages,
    errors: errors as Error[],
  };
}
