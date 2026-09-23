import type { AnalysisResponse } from "./contracts";
import { labelFor, signalMeta, statusForDisplay } from "./signal-map";

const STATUS_PHRASE: Record<string, string> = {
  supported: "supported",
  partial: "partly supported",
  weak: "weak",
  insufficient: "not determined",
};

function hostname(url: string): string {
  try {
    return new URL(url).hostname || url;
  } catch {
    return url;
  }
}

/**
 * Share text built from the same status mapping as the page. It carries no
 * numeric total, score or percentage — only the returned enum statuses.
 */
export function buildShareText(result: AnalysisResponse): string {
  const parts = result.classifications
    .filter((classification) => signalMeta(classification.name)?.kind === "valence" && classification.name !== "change_first")
    .map((classification) => `${labelFor(classification.name)}: ${STATUS_PHRASE[statusForDisplay(classification.name, String(classification.value))]}`);
  const body = parts.length ? parts.join(" · ") : "No evaluative signals were returned.";
  return `Jev's read of ${hostname(result.url)} — ${body}. Returned enums only.`;
}
