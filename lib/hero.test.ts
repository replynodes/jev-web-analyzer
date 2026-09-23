import { describe, expect, it } from "vitest";
import type { AnalysisResponse } from "./contracts";
import { extractHeroHeading, heroSignals } from "./hero";

type Classification = AnalysisResponse["classifications"][number];

function classification(name: string, value: string, confidence?: number): Classification {
  return { name, type: "choice", value, ...(confidence === undefined ? {} : { confidence }) };
}

describe("hero helpers", () => {
  it("extracts the first Markdown H1 verbatim", () => {
    expect(extractHeroHeading("# Example Domain\n\nBody")).toBe("Example Domain");
    expect(extractHeroHeading("Intro\n\n# The web context {API} for teams\n\nBody")).toBe("The web context {API} for teams");
  });

  it("returns null when the homepage has no H1", () => {
    expect(extractHeroHeading("## Only a subheading\n\nBody")).toBeNull();
    expect(extractHeroHeading("")).toBeNull();
  });

  it("builds the three hero signal slots from real enums only", () => {
    const slots = heroSignals([
      classification("audience", "developers", 0.96),
      classification("strongest_reason_to_choose", "unique_capability", 0.38),
      classification("self_serve_motion", "strongly_self_serve", 0.3),
      classification("trust_strength", "strong"),
    ]);
    expect(slots.map((slot) => slot.name)).toEqual(["audience", "strongest_reason_to_choose", "self_serve_motion"]);
    expect(slots.map((slot) => slot.label)).toEqual(["For", "Reason to choose", "Motion"]);
    expect(slots[0].classification?.value).toBe("developers");
  });

  it("leaves a slot without a classification when Jev did not return it", () => {
    const slots = heroSignals([classification("audience", "developers")]);
    expect(slots[1].classification).toBeUndefined();
    expect(slots[2].classification).toBeUndefined();
  });
});
