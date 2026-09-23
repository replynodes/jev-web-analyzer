import { describe, expect, it } from "vitest";
import type { AnalysisResponse } from "./contracts";
import { buildShareText } from "./share-card";

function response(classifications: AnalysisResponse["classifications"]): AnalysisResponse {
  return {
    url: "https://replynodes.com/",
    classifications,
    judgments: [],
    timeline: { startedAt: "2026-09-23T15:29:25.570Z", scrapeMs: 151, extractMs: 0, jevMs: 507, totalMs: 658, fetchStatus: 200, finalUrl: "https://replynodes.com/" },
    usage: { characters: 7150, inputTokens: 3695, outputTokens: 763 },
    model: { requested: "jev-latest" },
    scrape: { requestId: "cdc3631a", markdownPreview: "# Hi", markdownCharacters: 7150, sourceCharacters: 7150, markdownTruncated: false },
  };
}

describe("buildShareText", () => {
  it("uses the status mapping and never emits a numeric total", () => {
    const text = buildShareText(
      response([
        { name: "value_proposition_clarity", type: "choice", value: "clear" },
        { name: "differentiation", type: "choice", value: "moderate" },
        { name: "trust_strength", type: "choice", value: "none_apparent" },
      ]),
    );
    expect(text).toContain("Value proposition clarity: supported");
    expect(text).toContain("Differentiation: partly supported");
    expect(text).toContain("Trust strength: not determined");
    expect(text).not.toMatch(/\d/);
  });

  it("omits the change-first card from the evaluative summary", () => {
    const text = buildShareText(response([{ name: "change_first", type: "choice", value: "make_cta_explicit" }]));
    expect(text).not.toContain("Change first");
  });
});
