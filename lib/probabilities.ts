import { isActionable, isNonActionable } from "./signal-map";

export type ProbabilityEntry = { value: string; probability: number };

export type SignalConclusion =
  | {
      kind: "returned";
      value: string;
      probability?: number;
      closeCall: boolean;
      closeAlternative: ProbabilityEntry | null;
    }
  | {
      kind: "undetermined";
      returnedValue: string;
      probability?: number;
      nextActionable: ProbabilityEntry | null;
    };

/**
 * Native distribution sorted by probability, descending. Ties keep the order
 * the gateway returned them in, so callers must always render the returned
 * value explicitly rather than trusting the sorted top-1.
 */
export function sortedProbabilities(probabilities: Record<string, number> = {}): ProbabilityEntry[] {
  return Object.entries(probabilities)
    .filter(([, probability]) => typeof probability === "number" && Number.isFinite(probability))
    .map(([value, probability]) => ({ value, probability }))
    .sort((a, b) => b.probability - a.probability);
}

const CLOSE_CALL_THRESHOLD = 0.1;
const FLOAT_EPSILON = 1e-9;

export function isCloseCall(probabilities: Record<string, number>): boolean {
  const sorted = sortedProbabilities(probabilities);
  return (
    sorted.length >= 2 &&
    sorted[0].probability - sorted[1].probability < CLOSE_CALL_THRESHOLD - FLOAT_EPSILON
  );
}

/**
 * Highest-probability option that is NOT the value Jev returned. The returned
 * value is never allowed to stand in for, or appear before, the actual answer.
 */
export function closeAlternative(
  probabilities: Record<string, number>,
  returnedValue: string,
): ProbabilityEntry | null {
  const alternative = sortedProbabilities(probabilities).find(
    (entry) => entry.value !== returnedValue && entry.probability > 0,
  );
  return alternative ?? null;
}

export function returnedValueProbability(
  probabilities: Record<string, number> | undefined,
  returnedValue: string,
): number | undefined {
  if (!probabilities) return undefined;
  const probability = probabilities[returnedValue];
  return typeof probability === "number" && Number.isFinite(probability) ? probability : undefined;
}

/**
 * The next option that actually describes an actionable state, skipping the
 * non-actionable and negative enums (R7).
 */
export function nextActionable(probabilities: Record<string, number>): ProbabilityEntry | null {
  const candidate = sortedProbabilities(probabilities).find(
    (entry) => entry.probability > 0 && isActionable(entry.value),
  );
  return candidate ?? null;
}

/**
 * Resolves how a returned value should be rendered. A non-actionable top-1 is
 * never a conclusion: it is surfaced as an inability statement that still
 * discloses the raw returned value plus the next actionable option.
 */
export function signalConclusion(
  value: string,
  probabilities: Record<string, number> | undefined,
): SignalConclusion {
  const probability = returnedValueProbability(probabilities, value);
  if (isNonActionable(value)) {
    return {
      kind: "undetermined",
      returnedValue: value,
      probability,
      nextActionable: probabilities ? nextActionable(probabilities) : null,
    };
  }
  const closeCall = probabilities ? isCloseCall(probabilities) : false;
  return {
    kind: "returned",
    value,
    probability,
    closeCall,
    closeAlternative: closeCall && probabilities ? closeAlternative(probabilities, value) : null,
  };
}
