export type LeaderboardRow = {
  domain: string;
  final_url?: string;
  rubric_version: string;
  status: "ok" | "scrape_failed" | "jev_failed";
  error_code?: string;
  fetched_at: string;
  request_id?: string;
  markdown_sha256?: string;
  markdown_length?: number;
  scrape_ms?: number;
  jev_ms?: number;
  total_ms?: number;
  answers: Record<string, { type: "score" | "choice"; value: number | string; probabilities?: Record<string, number> }>;
  overall?: number;
  usage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number };
};

const FIXED_PREFIX_COLUMNS = [
  "domain", "final_url", "status", "error_code", "fetched_at", "request_id",
  "markdown_sha256", "markdown_length", "scrape_ms", "jev_ms", "total_ms", "rubric_version",
] as const;

const FIXED_SUFFIX_COLUMNS = [
  "overall", "usage_input_tokens", "usage_output_tokens", "usage_total_tokens",
] as const;

function csvCell(value: unknown): string {
  if (value === undefined || value === null) return "";
  const stringValue = String(value);
  if (/[",\n]/.test(stringValue)) return `"${stringValue.replace(/"/g, '""')}"`;
  return stringValue;
}

function questionColumns(questionIds: readonly string[]): string[] {
  return questionIds.flatMap((id) => [`${id}_value`, `${id}_probabilities`]);
}

function rowValues(row: LeaderboardRow, questionIds: readonly string[]): unknown[] {
  const prefix = [
    row.domain, row.final_url, row.status, row.error_code, row.fetched_at, row.request_id,
    row.markdown_sha256, row.markdown_length, row.scrape_ms, row.jev_ms, row.total_ms, row.rubric_version,
  ];
  const perQuestion = questionIds.flatMap((id) => {
    const answer = row.answers[id];
    return [
      answer ? answer.value : undefined,
      answer?.probabilities ? JSON.stringify(answer.probabilities) : undefined,
    ];
  });
  const suffix = [row.overall, row.usage?.inputTokens, row.usage?.outputTokens, row.usage?.totalTokens];
  return [...prefix, ...perQuestion, ...suffix];
}

export function rowsToLeaderboardCsv(rows: readonly LeaderboardRow[], questionIds: readonly string[]): string {
  const header = [...FIXED_PREFIX_COLUMNS, ...questionColumns(questionIds), ...FIXED_SUFFIX_COLUMNS];
  const lines = [header.map(csvCell).join(",")];
  for (const row of rows) lines.push(rowValues(row, questionIds).map(csvCell).join(","));
  return lines.join("\n");
}
