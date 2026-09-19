import { describe, expect, it } from "vitest";
import { customAnswerTitle, displayAnswerValue } from "./answer-display";

describe("answer display helpers", () => {
  it("uses sanitized custom instructions as the heading", () => {
    expect(customAnswerTitle({ name: "custom", type: "boolean", value: true, instructions: "Is this useful?" })).toBe("Is this useful?");
  });
  it("keeps semantic boolean labels and raw score values", () => {
    expect(displayAnswerValue({ name: "x", type: "boolean", value: false })).toBe("Likely no");
    expect(displayAnswerValue({ name: "x", type: "score", value: 4 }, ["Low", "Limited", "Adequate", "Strong", "Exceptional"])).toBe("Strong · 4/5");
  });
});
