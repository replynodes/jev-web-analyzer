import { describe, expect, it } from "vitest";
import type { AnalysisResponse } from "./contracts";
import { aggregateConfidence, isLowConfidence } from "./confidence";

type Classification = AnalysisResponse["classifications"][number];

function classification(confidence?: number): Classification {
  return { name: "understandable_in_10_seconds", type: "choice", value: "yes", ...(confidence === undefined ? {} : { confidence }) };
}

describe("confidence helpers", () => {
  it("aggregates min, max, mean and count of returned confidences", () => {
    const aggregate = aggregateConfidence([classification(0.99), classification(0.28), classification(0.5)]);
    expect(aggregate).not.toBeNull();
    expect(aggregate?.count).toBe(3);
    expect(aggregate?.min).toBeCloseTo(0.28, 5);
    expect(aggregate?.max).toBeCloseTo(0.99, 5);
    expect(aggregate?.mean).toBeCloseTo((0.99 + 0.28 + 0.5) / 3, 5);
  });

  it("ignores classifications without a returned confidence", () => {
    const aggregate = aggregateConfidence([classification(0.4), classification()]);
    expect(aggregate?.count).toBe(1);
  });

  it("returns null when no confidence was returned", () => {
    expect(aggregateConfidence([classification(), classification()])).toBeNull();
    expect(aggregateConfidence([])).toBeNull();
  });

  it("treats values below 0.50 as low confidence", () => {
    expect(isLowConfidence(0.49)).toBe(true);
    expect(isLowConfidence(0.5)).toBe(false);
    expect(isLowConfidence(undefined)).toBe(false);
  });
});
