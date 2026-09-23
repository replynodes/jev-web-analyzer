import { describe, expect, it } from "vitest";
import { classifyFailure } from "./failure";

describe("classifyFailure", () => {
  it("never blames the user's site for a server-side failure", () => {
    for (const code of ["NOT_CONFIGURED", "PROVIDER_UNAUTHORIZED", "PROVIDER_UNAVAILABLE", "PROVIDER_UNREACHABLE", "PROVIDER_RATE_LIMITED", "UPSTREAM_FAILED"]) {
      const result = classifyFailure(code, false);
      expect(result.kind).toBe("service");
      expect(result.title).not.toBe("Site unreachable");
    }
  });

  it("keeps genuine fetch failures as site unreachable", () => {
    for (const code of ["DNS_LOOKUP_FAILED", "SITE_UNREACHABLE", "FETCH_TIMEOUT"]) {
      expect(classifyFailure(code, false).kind).toBe("site");
    }
  });

  it("separates URL rejections from site failures", () => {
    for (const code of ["INVALID_URL", "BLOCKED_URL", "RESPONSE_TOO_LARGE"]) {
      const result = classifyFailure(code, false);
      expect(result.kind).toBe("url");
    }
  });

  it("separates unreadable content from site failures", () => {
    for (const code of ["PROVIDER_BAD_RESPONSE", "INVALID_PROVIDER_RESPONSE"]) {
      expect(classifyFailure(code, true).kind).toBe("content");
    }
  });

  it("falls back to the fetch status only when no code was returned", () => {
    expect(classifyFailure(undefined, true).title).toBe("Jev didn't return a result");
    expect(classifyFailure(undefined, false).title).toBe("The analysis did not complete");
    expect(classifyFailure("", false).kind).toBe("unknown");
  });

  it("is case and whitespace tolerant", () => {
    expect(classifyFailure("  upstream_failed  ", false).kind).toBe("service");
  });
});
