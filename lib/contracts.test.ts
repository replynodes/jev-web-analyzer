import { describe, expect, it } from "vitest";
import { judgmentInputSchema, requestSchema, sanitizeAnswer, sanitizeResolvedModel } from "./contracts";

describe("contracts", () => {
  it("bounds judgment definitions", () => {
    expect(judgmentInputSchema.safeParse({ name: "ok", question: { type: "choice", instructions: "Pick one", criteria: { a: "A", b: "B" } } }).success).toBe(true);
    expect(judgmentInputSchema.safeParse({ name: "bad name", question: { type: "boolean", instructions: "Is it useful?" } }).success).toBe(false);
    expect(requestSchema.safeParse({ url: "https://example.com", judgments: [] }).success).toBe(true);
  });
  it("sanitizes only provider answer fields", () => {
    expect(sanitizeAnswer("x", { probability: 0.8, confidence: 0.7, secret: "no" }, "boolean")).toEqual({ name: "x", type: "boolean", value: true, confidence: 0.7 });
    expect(sanitizeAnswer("x", { choice: "billing", probabilities: { billing: 1, bad: "x" } }, "choice")).toEqual({ name: "x", type: "choice", value: "billing", probabilities: { billing: 1 } });
    expect(sanitizeResolvedModel("jev-1.13.0")).toBe("jev-1.13.0");
    expect(sanitizeResolvedModel("not safe\nsecret")).toBeUndefined();
  });
});
