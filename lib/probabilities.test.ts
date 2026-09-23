import { describe, expect, it } from "vitest";
import {
  closeAlternative,
  isCloseCall,
  nextActionable,
  returnedValueProbability,
  signalConclusion,
  sortedProbabilities,
} from "./probabilities";

describe("probability helpers", () => {
  it("sorts probabilities descending without dropping entries", () => {
    const sorted = sortedProbabilities({ a: 0.2, b: 0.6, c: 0.2 });
    expect(sorted.map((entry) => entry.value)).toEqual(["b", "a", "c"]);
    expect(sorted).toHaveLength(3);
  });

  it("treats a gap below 0.10 as a close call and 0.10 as not close", () => {
    expect(isCloseCall({ a: 0.44, b: 0.44 })).toBe(true);
    expect(isCloseCall({ a: 0.39, b: 0.31 })).toBe(true);
    expect(isCloseCall({ a: 0.5, b: 0.4 })).toBe(false);
    expect(isCloseCall({ a: 0.8 })).toBe(false);
  });

  it("excludes the returned value from the close alternative", () => {
    const probabilities = { mostly_self_serve: 0.44, strongly_self_serve: 0.44, hybrid: 0.12 };
    expect(closeAlternative(probabilities, "strongly_self_serve")?.value).toBe("mostly_self_serve");
    expect(closeAlternative(probabilities, "mostly_self_serve")?.value).toBe("strongly_self_serve");
  });

  it("reports the probability of the value Jev actually returned", () => {
    expect(returnedValueProbability({ yes: 0.7, no: 0.3 }, "yes")).toBe(0.7);
    expect(returnedValueProbability({ yes: 0.7 }, "missing")).toBeUndefined();
    expect(returnedValueProbability(undefined, "yes")).toBeUndefined();
  });

  it("never renders a non-actionable top-1 as a conclusion", () => {
    const nonActionable = ["other", "no_clear_reason", "not_apparent", "none_apparent", "unclear_other", "unclear_none_detected"];
    for (const value of nonActionable) {
      const conclusion = signalConclusion(value, { [value]: 0.63, strong: 0.3 });
      expect(conclusion.kind, value).toBe("undetermined");
    }
  });

  it("renders the returned value as the conclusion for an actionable signal", () => {
    const conclusion = signalConclusion("mostly_self_serve", { strongly_self_serve: 0.44, mostly_self_serve: 0.44 });
    expect(conclusion.kind).toBe("returned");
    if (conclusion.kind !== "returned") throw new Error("expected returned");
    expect(conclusion.value).toBe("mostly_self_serve");
    expect(conclusion.closeCall).toBe(true);
    expect(conclusion.closeAlternative?.value).toBe("strongly_self_serve");
  });

  it("skips non-actionable and negative options when finding the next actionable value", () => {
    expect(nextActionable({ not_apparent: 0.55, strong: 0.3, weak: 0.1 })?.value).toBe("strong");
    expect(nextActionable({ other: 0.63, make_cta_explicit: 0.27 })?.value).toBe("make_cta_explicit");
    expect(nextActionable({ other: 0.9, weak: 0.1 })).toBeNull();
  });
});
