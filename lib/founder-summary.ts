import type { AnalysisResponse } from "./contracts";

export const FOUNDER_SECTIONS = [
  { key: "clarity", title: "Clarity", answers: ["understandable_in_10_seconds", "audience", "value_proposition_clarity"] },
  { key: "positioning", title: "Positioning & Conversion", answers: ["differentiation", "strongest_reason_to_choose", "cta_signal", "self_serve_motion"] },
  { key: "trust", title: "Trust & Messaging", answers: ["trust_strength", "copy_specificity", "change_first"] },
] as const;

type Answer = AnalysisResponse["classifications"][number];
const readable: Record<string, string> = {
  yes: "Likely yes", partly: "Unclear", no: "Likely no", clear: "Clear", partly_clear: "Partly clear", unclear: "Unclear",
  developers: "Developers", marketing_teams: "Marketing teams", saas_founders: "SaaS founders", sales_teams: "Sales teams", smbs: "SMBs", enterprise_teams: "Enterprise teams", consumers: "Consumers", mixed: "Mixed", other: "Other",
  strong: "Strong", moderate: "Moderate", weak: "Weak", not_apparent: "Not apparent", customer_outcome: "Customer outcome", unique_capability: "Unique capability", proof: "Proof", integrations: "Integrations", ease_of_use: "Ease of use", price_value: "Price/value", no_clear_reason: "No clear reason",
  strongly_self_serve: "Strongly self-serve", mostly_self_serve: "Mostly self-serve", hybrid: "Hybrid", mostly_sales_led: "Mostly sales-led", strongly_sales_led: "Strongly sales-led", none_apparent: "None apparent", mostly_specific: "Mostly specific", mixed_specific: "Mixed", mostly_generic: "Mostly generic",
};
const ctaActions: Record<string, string> = { start_free: "Start free", try_product: "Try product", get_api_key: "Get API key", book_demo: "Book demo", join_waitlist: "Join waitlist", contact_sales: "Contact sales", view_docs: "View docs", github: "GitHub", none_detected: "None detected", other: "Other" };

export function readableAnswer(value: string) { return readable[value] ?? (value.includes("_") && /^(clear|somewhat|unclear)_/.test(value) ? (() => { const cta = splitCtaSignal(value); return `${cta.clarity} · ${cta.action}`; })() : value.replaceAll("_", " ")); }

export function splitCtaSignal(value: string) {
  const [clarity, ...actionParts] = value.split("_");
  return { clarity: clarity === "clear" ? "Clear" : clarity === "somewhat" ? "Somewhat clear" : "Unclear", action: ctaActions[actionParts.join("_")] ?? "Other" };
}

function answer(answers: Answer[], name: string) { return answers.find((item) => item.name === name); }
function value(item: Answer | undefined) { return item && typeof item.value === "string" ? readableAnswer(item.value) : undefined; }

export function founderSynthesis(answers: Answer[]) {
  const formats: Array<[string, (current: string) => string]> = [["audience", (current) => `a ${current} audience`], ["value_proposition_clarity", (current) => `a ${current} value proposition`], ["differentiation", (current) => `${current} differentiation`], ["self_serve_motion", (current) => `${current} motion`]];
  const parts = formats.flatMap(([name, format]) => { const current = value(answer(answers, name)); return current ? [format(current)] : []; });
  return parts.length ? `Jev sees this as ${parts.join(", ")}.` : "";
}

export function answersForSection(answers: Answer[], names: readonly string[]) { return names.flatMap((name) => { const current = answer(answers, name); return current ? [current] : []; }); }
