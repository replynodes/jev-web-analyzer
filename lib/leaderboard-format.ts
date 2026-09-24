import type { RubricFile, RubricQuestion } from "./rubric";

export type ScoreBand = { label: string; shieldsColor: string; hex: string };

const SCORE_BANDS: readonly (ScoreBand & { min: number })[] = [
  { min: 85, label: "Excellent", shieldsColor: "brightgreen", hex: "#4c1" },
  { min: 70, label: "Good", shieldsColor: "green", hex: "#97ca00" },
  { min: 55, label: "Fair", shieldsColor: "yellowgreen", hex: "#a4a61d" },
  { min: 40, label: "Weak", shieldsColor: "yellow", hex: "#dfb317" },
  { min: 25, label: "Poor", shieldsColor: "orange", hex: "#fe7d37" },
  { min: -Infinity, label: "Very poor", shieldsColor: "red", hex: "#e05d44" },
];

export function scoreBand(overall: number): ScoreBand {
  const band = SCORE_BANDS.find((candidate) => overall >= candidate.min)!;
  return { label: band.label, shieldsColor: band.shieldsColor, hex: band.hex };
}

/**
 * The rubric level text Jev's answer matched, for display alongside the raw
 * score/choice. Score answers are fractional in [0, levels-1] (per the Jev
 * evaluation contract), so the matched level is the nearest integer level.
 */
export function matchedLevelDescription(
  question: RubricQuestion,
  answer: { type: "score" | "choice"; value: number | string },
): string | undefined {
  if (question.type === "score" && answer.type === "score") {
    const level = Math.min(question.criteria.length - 1, Math.max(0, Math.round(answer.value as number)));
    return question.criteria[level];
  }
  if (question.type === "choice" && answer.type === "choice") {
    return question.criteria[answer.value as string];
  }
  return undefined;
}

export function pricingLabel(value: string): string {
  const labels: Record<string, string> = {
    visible_price: "Visible price",
    freemium_or_free_trial: "Freemium / free trial",
    contact_sales_only: "Contact sales only",
    no_pricing_info: "No pricing info",
  };
  return labels[value] ?? value;
}

export function formatRunDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}

export const SITE_URL = "https://replynodes.com/jev-web-analyzer";

export function badgeMarkdown(domain: string): string {
  const badgeUrl = `https://img.shields.io/endpoint?url=${encodeURIComponent(`${SITE_URL}/api/badge/${domain}`)}`;
  const permalink = `${SITE_URL}/leaderboard/${domain}`;
  return `[![Jev score](${badgeUrl})](${permalink})`;
}

export type RubricQuestionMeta = { id: string; label: string };

export function scoreQuestionMeta(rubric: RubricFile): RubricQuestionMeta[] {
  return rubric.score_question_ids.map((id) => ({ id, label: labelForQuestionId(id) }));
}

export function labelForQuestionId(id: string): string {
  return id
    .split("_")
    .map((word) => (word === "icp" || word === "cta" ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(" ");
}
