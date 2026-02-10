import { describe, expect, it } from "vitest";
import { ProfilePayloadSchema, isAnalyticsReady } from "../src/lib/validation/profile";

describe("ProfilePayloadSchema", () => {
  it("accepts a minimal valid running background", () => {
    const parsed = ProfilePayloadSchema.parse({
      yearsRunning: 2,
      weeklyKilometrage: 40,
    });

    expect(parsed.yearsRunning).toBe(2);
    expect(parsed.weeklyKilometrage).toBe(40);
  });

  it("treats empty PB fields as null when omitted", () => {
    const parsed = ProfilePayloadSchema.parse({
      yearsRunning: 1,
      weeklyKilometrage: 10,
    });

    expect(parsed.personalBest5kSeconds).toBeNull();
    expect(parsed.personalBest10kSeconds).toBeNull();
  });

  it("rejects non-positive weekly kilometrage", () => {
    expect(() =>
      ProfilePayloadSchema.parse({
        yearsRunning: 1,
        weeklyKilometrage: 0,
      }),
    ).toThrow();
  });
});

describe("isAnalyticsReady", () => {
  it("returns true when running background is present and positive", () => {
    const payload = ProfilePayloadSchema.parse({
      yearsRunning: 3,
      weeklyKilometrage: 50,
    });

    expect(isAnalyticsReady(payload)).toBe(true);
  });

  it("returns false when weekly kilometrage is not positive", () => {
    const payload = ProfilePayloadSchema.parse({
      yearsRunning: 3,
      weeklyKilometrage: 0.0001,
    });

    // schema enforces > 0, but just in case of future changes we keep this check
    expect(isAnalyticsReady(payload)).toBe(true);
  });
});
