import type { FounderQuestionName } from "./founder-questions";

export type SignalKind = "valence" | "informational";
export type SignalTier = "primary" | "secondary";
export type SignalStatus = "supported" | "partial" | "weak" | "insufficient";

export type SignalMeta = {
  label: string;
  kind: SignalKind;
  tier: SignalTier;
};

export const SIGNAL_META: Record<FounderQuestionName, SignalMeta> = {
  understandable_in_10_seconds: { label: "Understandable in 10 seconds", kind: "valence", tier: "primary" },
  audience: { label: "Audience", kind: "informational", tier: "secondary" },
  value_proposition_clarity: { label: "Value proposition clarity", kind: "valence", tier: "primary" },
  differentiation: { label: "Differentiation", kind: "valence", tier: "primary" },
  strongest_reason_to_choose: { label: "Reason to choose", kind: "informational", tier: "secondary" },
  cta_signal: { label: "CTA signal", kind: "valence", tier: "primary" },
  trust_strength: { label: "Trust strength", kind: "valence", tier: "primary" },
  self_serve_motion: { label: "Self-serve motion", kind: "informational", tier: "secondary" },
  copy_specificity: { label: "Copy specificity", kind: "valence", tier: "primary" },
  change_first: { label: "Change first", kind: "valence", tier: "primary" },
};

export const PRIMARY_SIGNAL_NAMES = [
  "understandable_in_10_seconds",
  "value_proposition_clarity",
  "differentiation",
  "cta_signal",
  "trust_strength",
  "copy_specificity",
] as const;

export const SECONDARY_SIGNAL_NAMES = [
  "audience",
  "strongest_reason_to_choose",
  "self_serve_motion",
] as const;

export const CHANGE_FIRST_SIGNAL = "change_first" as const;

/**
 * Values Jev returns that must never be rendered as a conclusion (R7). They
 * carry no actionable judgment about the homepage.
 */
export const NON_ACTIONABLE_VALUES: ReadonlySet<string> = new Set([
  "other",
  "no_clear_reason",
  "not_apparent",
  "none_apparent",
  "unclear_other",
  "unclear_none_detected",
]);

export function isNonActionable(value: string): boolean {
  return NON_ACTIONABLE_VALUES.has(value);
}

/**
 * Negative enum values Jev can return (R9). Used to derive the "couldn't
 * confirm" list and to skip negative options when looking for the next
 * actionable alternative.
 */
export function isNegativeValue(value: string): boolean {
  return (
    value === "weak" ||
    value === "mostly_generic" ||
    value === "unclear" ||
    value === "no_clear_reason" ||
    value.startsWith("unclear") ||
    value.endsWith("_apparent")
  );
}

export function isActionable(value: string): boolean {
  return !isNonActionable(value) && !isNegativeValue(value);
}

/**
 * Exhaustive status mapping. Every enum value declared in
 * `lib/founder-questions.ts` is listed explicitly; an unknown signal or value
 * throws instead of silently falling through.
 *
 * Informational signals (audience, strongest_reason_to_choose,
 * self_serve_motion) carry no good/bad valence; their actionable values map to
 * the neutral `partial` bucket and the UI never renders a chip for them.
 */
const STATUS_BY_SIGNAL: Record<FounderQuestionName, Record<string, SignalStatus>> = {
  understandable_in_10_seconds: { yes: "supported", partly: "partial", no: "weak" },
  audience: {
    developers: "partial",
    marketing_teams: "partial",
    saas_founders: "partial",
    sales_teams: "partial",
    smbs: "partial",
    enterprise_teams: "partial",
    consumers: "partial",
    mixed: "partial",
    other: "insufficient",
  },
  value_proposition_clarity: { clear: "supported", partly_clear: "partial", unclear: "weak" },
  differentiation: { strong: "supported", moderate: "partial", weak: "weak", not_apparent: "insufficient" },
  strongest_reason_to_choose: {
    customer_outcome: "partial",
    unique_capability: "partial",
    proof: "partial",
    integrations: "partial",
    ease_of_use: "partial",
    price_value: "partial",
    no_clear_reason: "insufficient",
    other: "insufficient",
  },
  cta_signal: {
    clear_start_free: "supported",
    clear_try_product: "supported",
    clear_get_api_key: "supported",
    clear_book_demo: "supported",
    clear_join_waitlist: "supported",
    clear_contact_sales: "supported",
    clear_view_docs: "supported",
    clear_github: "supported",
    somewhat_start_free: "partial",
    somewhat_try_product: "partial",
    somewhat_get_api_key: "partial",
    somewhat_book_demo: "partial",
    somewhat_view_docs: "partial",
    somewhat_github: "partial",
    unclear_none_detected: "insufficient",
    unclear_other: "insufficient",
  },
  trust_strength: { strong: "supported", moderate: "partial", weak: "weak", none_apparent: "insufficient" },
  self_serve_motion: {
    strongly_self_serve: "partial",
    mostly_self_serve: "partial",
    hybrid: "partial",
    mostly_sales_led: "partial",
    strongly_sales_led: "partial",
  },
  copy_specificity: { mostly_specific: "supported", mixed: "partial", mostly_generic: "weak" },
  change_first: {
    lead_with_customer_outcome: "supported",
    add_customer_proof: "supported",
    clarify_differentiation: "supported",
    make_cta_explicit: "supported",
    tighten_target_audience: "supported",
    explain_value_proposition: "supported",
    other: "insufficient",
  },
};

export function signalMeta(name: string): SignalMeta | undefined {
  return (SIGNAL_META as Record<string, SignalMeta>)[name];
}

export function labelFor(name: string): string {
  return signalMeta(name)?.label ?? humanize(name);
}

/**
 * Status chip is only meaningful for evaluative signals. Informational signals
 * and the change-first card never render one.
 */
export function hasStatusChip(name: string): boolean {
  return signalMeta(name)?.kind === "valence" && name !== CHANGE_FIRST_SIGNAL;
}

export function statusFor(name: string, value: string): SignalStatus {
  const byValue = (STATUS_BY_SIGNAL as Record<string, Record<string, SignalStatus>>)[name];
  if (!byValue) throw new Error(`Unknown signal: ${name}`);
  const status = byValue[value];
  if (!status) throw new Error(`Unknown value "${value}" for signal "${name}"`);
  return status;
}

/**
 * UI-facing variant: an unrecognized enum from the gateway is surfaced as the
 * neutral `partial` chip rather than crashing the page.
 */
export function statusForDisplay(name: string, value: string): SignalStatus {
  try {
    return statusFor(name, value);
  } catch {
    return "partial";
  }
}

export const ACRONYMS: Record<string, string> = {
  cta: "CTA",
  api: "API",
  saas: "SaaS",
  smbs: "SMBs",
  github: "GitHub",
  mcp: "MCP",
  icp: "ICP",
  seo: "SEO",
};

export function humanize(value: string): string {
  const joined = value
    .split("_")
    .map((word) => ACRONYMS[word] ?? word)
    .join(" ");
  return joined.length ? joined.charAt(0).toUpperCase() + joined.slice(1) : joined;
}
