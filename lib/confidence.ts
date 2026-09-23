import type { AnalysisResponse } from "./contracts";

type Classification = AnalysisResponse["classifications"][number];

export type ConfidenceAggregate = { min: number; max: number; mean: number; count: number };

/**
 * Aggregate of Jev's own returned per-signal confidence values. Returns null
 * when no classification carried a confidence — never an estimate.
 */
export function aggregateConfidence(classifications: Classification[]): ConfidenceAggregate | null {
  const values = classifications
    .map((classification) => classification.confidence)
    .filter((confidence): confidence is number => typeof confidence === "number" && Number.isFinite(confidence));
  if (!values.length) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const mean = values.reduce((total, value) => total + value, 0) / values.length;
  return { min, max, mean, count: values.length };
}

export const LOW_CONFIDENCE_THRESHOLD = 0.5;

export function isLowConfidence(confidence: number | undefined): boolean {
  return typeof confidence === "number" && Number.isFinite(confidence) && confidence < LOW_CONFIDENCE_THRESHOLD;
}
