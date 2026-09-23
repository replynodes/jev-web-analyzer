import { describe, expect, it } from "vitest";
import type { AnalysisResponse } from "./contracts";
import { unconfirmedItems } from "./unconfirmed";

type Classification = AnalysisResponse["classifications"][number];

function classification(name: string, value: string): Classification {
  return { name, type: "choice", value };
}

describe("unconfirmedItems", () => {
  it("derives the list only from negative enum values", () => {
    const items = unconfirmedItems([
      classification("differentiation", "not_apparent"),
      classification("value_proposition_clarity", "unclear"),
      classification("trust_strength", "weak"),
      classification("copy_specificity", "mostly_generic"),
      classification("understandable_in_10_seconds", "yes"),
      classification("cta_signal", "clear_start_free"),
    ]);
    expect(items.map((item) => item.name)).toEqual([
      "differentiation",
      "value_proposition_clarity",
      "trust_strength",
      "copy_specificity",
    ]);
  });

  it("uses the brief's wording and never invents categories", () => {
    const items = unconfirmedItems([
      classification("differentiation", "not_apparent"),
      classification("strongest_reason_to_choose", "no_clear_reason"),
    ]);
    expect(items[0].message).toBe("Not apparent from the homepage");
    expect(items[1].message).toBe("Not clearly communicated on the homepage");
    for (const item of items) {
      expect(item.message).not.toMatch(/pricing|case stud|blog|testimonial/i);
    }
  });

  it("returns an empty list when Jev returned no negative values", () => {
    expect(unconfirmedItems([classification("differentiation", "strong")])).toEqual([]);
  });
});
