import type { AnalysisResponse } from "./contracts";
import { isNegativeValue, labelFor } from "./signal-map";

type Classification = AnalysisResponse["classifications"][number];

export type UnconfirmedItem = { name: string; label: string; message: string };

const NOT_APPARENT = "Not apparent from the homepage";
const NOT_CLEARLY_COMMUNICATED = "Not clearly communicated on the homepage";

/**
 * The "couldn't confirm" list is derived ONLY from Jev's own negative enum
 * values. No categories (pricing, case studies, …) are ever invented.
 */
export function unconfirmedItems(classifications: Classification[]): UnconfirmedItem[] {
  return classifications
    .filter((classification) => typeof classification.value === "string" && isNegativeValue(classification.value))
    .map((classification) => {
      const value = String(classification.value);
      return {
        name: classification.name,
        label: labelFor(classification.name),
        message: value.endsWith("_apparent") ? NOT_APPARENT : NOT_CLEARLY_COMMUNICATED,
      };
    });
}
