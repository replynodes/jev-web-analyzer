import { describe, expect, it } from "vitest";
import { safeError } from "@/lib/analyze-errors";

describe("analyze route errors", () => {
  it("maps internal provider failures to a generic public error", () => {
    expect(safeError(new Error("provider included a secret"))).toEqual({ status: 502, code: "UPSTREAM_FAILED", message: "The analysis could not be completed. Please try again." });
  });
  it("keeps validation failures actionable without leaking internals", () => {
    expect(safeError(new Error("BLOCKED_URL")).status).toBe(400);
  });
});
