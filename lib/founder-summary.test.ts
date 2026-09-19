import { describe, expect, it } from "vitest";
import { answersForSection, founderSynthesis, FOUNDER_SECTIONS, splitCtaSignal } from "./founder-summary";

describe("founder summary helpers", () => {
  it("summarizes only returned founder labels", () => {
    expect(founderSynthesis([
      { name: "audience", type: "choice", value: "developers" },
      { name: "differentiation", type: "choice", value: "strong" },
    ])).toBe("Jev sees this as a Developers audience, Strong differentiation.");
    expect(founderSynthesis([])).toBe("");
  });

  it("splits the encoded CTA without changing the returned key", () => {
    expect(splitCtaSignal("somewhat_get_api_key")).toEqual({ clarity: "Somewhat clear", action: "Get API key" });
    expect(splitCtaSignal("unclear_none_detected")).toEqual({ clarity: "Unclear", action: "None detected" });
  });

  it("keeps founder sections bounded and omits missing answers", () => {
    expect(FOUNDER_SECTIONS).toHaveLength(3);
    expect(answersForSection([{ name: "audience", type: "choice", value: "business" }], ["audience", "value_proposition_clarity"])).toHaveLength(1);
  });
});
