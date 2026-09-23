export type EvidenceKind = "hero-heading" | "first-paragraph" | "cta-line" | "list-item";

export type Evidence = { kind: EvidenceKind; text: string };

const MAX_EVIDENCE_LENGTH = 140;

function clip(text: string): string {
  return text.length > MAX_EVIDENCE_LENGTH ? text.slice(0, MAX_EVIDENCE_LENGTH) : text;
}

const H1 = /^#\s+/;
const ANY_HEADING = /^#{1,6}\s+/;
const LIST_ITEM = /^\s*[-*+]\s+/;
const BLOCKQUOTE = /^>\s/;
const FENCE = /^```/;
const TABLE = /^\|/;
const LINK_ONLY = /^\[[^\]]+\]\([^)]+\)$/;
const MARKDOWN_LINK = /\[([^\]]+)\]\(([^)]+)\)/;

function isPlainProse(line: string): boolean {
  const text = line.trim();
  return (
    text.length >= 10 &&
    !ANY_HEADING.test(text) &&
    !LIST_ITEM.test(line) &&
    !BLOCKQUOTE.test(text) &&
    !FENCE.test(text) &&
    !TABLE.test(text) &&
    !LINK_ONLY.test(text) &&
    !text.startsWith("[")
  );
}

/**
 * Extracts verbatim snippets from `scrape.markdownPreview`, each labelled with
 * the real position it occupies. Every returned string is an exact substring
 * of the input — nothing is paraphrased or invented.
 */
export function extractEvidence(markdownPreview: string): Evidence[] {
  if (!markdownPreview) return [];
  const lines = markdownPreview.split("\n");
  const evidence: Evidence[] = [];
  const seen = new Set<string>();

  const push = (kind: EvidenceKind, raw: string) => {
    const text = clip(raw.trim());
    if (text && !seen.has(text)) {
      seen.add(text);
      evidence.push({ kind, text });
    }
  };

  const headingIndex = lines.findIndex((line) => H1.test(line));
  if (headingIndex >= 0) push("hero-heading", lines[headingIndex].replace(H1, ""));

  const paragraph = lines.slice(headingIndex + 1).find(isPlainProse);
  if (paragraph) push("first-paragraph", paragraph);

  const linkLine = lines.find((line) => MARKDOWN_LINK.test(line));
  const linkMatch = linkLine?.match(MARKDOWN_LINK);
  if (linkMatch) push("cta-line", linkMatch[1]);

  const listItem = lines.find((line) => LIST_ITEM.test(line));
  if (listItem) push("list-item", listItem.replace(LIST_ITEM, ""));

  return evidence;
}
