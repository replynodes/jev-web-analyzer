import { describe, expect, it } from "vitest";
import { ANALYSIS_CONTEXT_CAP, analysisContextLabel, prepareAnalysisContext } from "./analysis-context";

describe("analysis context", () => {
  it("sends the exact bounded state and reports the upstream size", () => {
    const markdown = "x".repeat(ANALYSIS_CONTEXT_CAP + 234);
    const context = prepareAnalysisContext(markdown);

    expect(context).toEqual({
      state: "x".repeat(ANALYSIS_CONTEXT_CAP),
      sentCharacters: ANALYSIS_CONTEXT_CAP,
      sourceCharacters: ANALYSIS_CONTEXT_CAP + 234,
      contextTruncated: true,
    });
    expect(analysisContextLabel(context)).toBe("Showing first 120,000 of 120,234 extracted characters");
  });

  it("does not report truncation below the cap", () => {
    const context = prepareAnalysisContext("clean markdown");

    expect(context.contextTruncated).toBe(false);
    expect(analysisContextLabel(context)).toBe("Showing 14 extracted characters");
  });
});
