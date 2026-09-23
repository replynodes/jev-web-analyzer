import { describe, expect, it } from "vitest";
import { classifyFailure } from "./failure";

describe("classifyFailure", () => {
  it("never blames the user's site for a server-side failure", () => {
    for (const code of [
      "NOT_CONFIGURED",
      "PROVIDER_UNAUTHORIZED",
      "PROVIDER_UNAVAILABLE",
      "PROVIDER_UNREACHABLE",
      "PROVIDER_RATE_LIMITED",
      "UPSTREAM_FAILED",
      "ANALYSIS_FAILED",
    ]) {
      const result = classifyFailure(code, false);
      expect(result.kind).toBe("service");
      expect(result.title).not.toBe("Site unreachable");
    }
  });

  it("never blames the URL for a malformed or oversized request", () => {
    for (const code of ["INVALID_JSON", "INVALID_INPUT", "REQUEST_TOO_LARGE"]) {
      const result = classifyFailure(code, false);
      expect(result.kind).toBe("request");
      expect(result.kind).not.toBe("url");
    }
  });

  it("treats our own rate limit as throttling, not as an outage", () => {
    const result = classifyFailure("RATE_LIMITED", false);
    expect(result.kind).toBe("rate");
    expect(result.title).toBe("Too many requests");
  });

  it("keeps genuine fetch failures as site unreachable", () => {
    for (const code of ["DNS_LOOKUP_FAILED", "SITE_UNREACHABLE", "FETCH_TIMEOUT"]) {
      expect(classifyFailure(code, false).kind).toBe("site");
    }
  });

  it("treats an unusable or oversized page as a content problem, not a URL problem", () => {
    for (const code of ["RESPONSE_TOO_LARGE", "PROVIDER_BAD_RESPONSE", "INVALID_PROVIDER_RESPONSE"]) {
      expect(classifyFailure(code, true).kind).toBe("content");
    }
  });

  it("only blames the URL for an invalid or blocked URL", () => {
    for (const code of ["INVALID_URL", "BLOCKED_URL"]) {
      expect(classifyFailure(code, false).kind).toBe("url");
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

  it("covers every error code the API can emit", () => {
    const apiCodes = [
      "ANALYSIS_FAILED",
      "BLOCKED_URL",
      "DNS_LOOKUP_FAILED",
      "FETCH_TIMEOUT",
      "INVALID_INPUT",
      "INVALID_JSON",
      "INVALID_PROVIDER_RESPONSE",
      "INVALID_URL",
      "NOT_CONFIGURED",
      "PROVIDER_BAD_RESPONSE",
      "PROVIDER_RATE_LIMITED",
      "PROVIDER_UNAUTHORIZED",
      "PROVIDER_UNAVAILABLE",
      "PROVIDER_UNREACHABLE",
      "RATE_LIMITED",
      "REQUEST_TOO_LARGE",
      "RESPONSE_TOO_LARGE",
      "SITE_UNREACHABLE",
      "UPSTREAM_FAILED",
    ];
    for (const code of apiCodes) {
      expect(classifyFailure(code, false).kind).not.toBe("unknown");
    }
  });
});
