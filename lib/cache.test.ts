import { describe, expect, it } from "vitest";
import { ANALYSIS_TTL_MS, cacheKey, clearCache, getCached, setCached } from "./cache";

describe("analysis cache", () => {
  it("keys URL and judgments and expires successful values", () => {
    clearCache(); const key = cacheKey("https://example.com", []); setCached(key, { ok: true }, 1000);
    expect(getCached(key, 1001)).toEqual({ ok: true });
    expect(getCached(key, 1000 + ANALYSIS_TTL_MS)).toBeUndefined();
    expect(cacheKey("https://example.com", [])).not.toBe(cacheKey("https://example.com", [{ name: "x" }]));
  });
});
