import { describe, expect, it } from "vitest";
import { judgmentInputSchema, requestSchema, sanitizeAnswer, sanitizeResolvedModel } from "./contracts";
import { DEFAULT_QUESTIONS } from "./founder-questions";

describe("contracts", () => {
  it("bounds judgment definitions", () => {
    expect(judgmentInputSchema.safeParse({ name: "ok", question: { type: "choice", instructions: "Pick one", criteria: { a: "A", b: "B" } } }).success).toBe(true);
    expect(judgmentInputSchema.safeParse({ name: "bad name", question: { type: "boolean", instructions: "Is it useful?" } }).success).toBe(false);
    expect(requestSchema.safeParse({ url: "https://example.com", judgments: [] }).success).toBe(true);
  });
  it("accepts the exact sixteen-option CTA contract", () => {
    const question = DEFAULT_QUESTIONS.cta_signal;
    expect(Object.keys(question.criteria)).toHaveLength(16);
    expect(judgmentInputSchema.safeParse({ name: "cta_signal", question }).success).toBe(true);
  });
  it("sanitizes only provider answer fields", () => {
    expect(sanitizeAnswer("x", { probability: 0.8, confidence: 0.7, secret: "no" }, "boolean")).toEqual({ name: "x", type: "boolean", value: true, probabilities: { true: 0.8, false: 0.19999999999999996 } });
    expect(sanitizeAnswer("x", { choice: "billing", probabilities: { billing: 1, bad: "x" } }, "choice")).toEqual({ name: "x", type: "choice", value: "billing", probabilities: { billing: 1 } });
    expect(sanitizeAnswer("x", { choice: "billing", reason: "Visible pricing supports this." }, "choice")).toMatchObject({ reason: "Visible pricing supports this." });
    expect(sanitizeAnswer("x", { choice: "billing", explanation: "\u0000secret" }, "choice")).not.toHaveProperty("reason");
  });
  it("extracts a resolved model only from sanitized provider metadata", () => {
    expect(sanitizeResolvedModel({ typesafe: { resolvedModelId: "jev-1.13.0" } })).toBe("jev-1.13.0");
    expect(sanitizeResolvedModel(undefined)).toBeUndefined();
    expect(sanitizeResolvedModel({ typesafe: { version: "not safe\nsecret" } })).toBeUndefined();
    expect(sanitizeResolvedModel({ resolvedModel: "response-model-id" })).toBeUndefined();
    expect(sanitizeResolvedModel({ typesafe: { version: 1.13 } })).toBeUndefined();
  });
  it("maps native distributions and explicit TypeSafe confidence", () => {
    const metadata = { typesafe: { confidence: { x: 0.7, y: 2, z: "bad" } } };
    expect(sanitizeAnswer("x", { probability: 0.25 }, "boolean", metadata)).toEqual({ name: "x", type: "boolean", value: false, probabilities: { true: 0.25, false: 0.75 }, confidence: 0.7 });
    expect(sanitizeAnswer("x", { probability: 0.25 }, "boolean", { typesafe: { confidence: 0.9 } })).toEqual({ name: "x", type: "boolean", value: false, probabilities: { true: 0.25, false: 0.75 }, confidence: 0.9 });
    expect(sanitizeAnswer("y", { score: 4, probabilities: { "1": 0.1, "4": 0.9 } }, "score", metadata)).toEqual({ name: "y", type: "score", value: 4, probabilities: { "1": 0.1, "4": 0.9 } });
    expect(sanitizeAnswer("z", { choice: "a", probabilities: { a: 0.4, b: 1.2, c: -0.1 } }, "choice", metadata)).toEqual({ name: "z", type: "choice", value: "a", probabilities: { a: 0.4 } });
    expect(sanitizeAnswer("x", { probability: 0.5 }, "boolean", { typesafe: { confidence: 1.1 } })).toEqual({ name: "x", type: "boolean", value: true, probabilities: { true: 0.5, false: 0.5 } });
    expect(sanitizeAnswer("x", { probability: Number.NaN }, "boolean", metadata)).toBeNull();
  });
});
