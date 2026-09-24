#!/usr/bin/env -S pnpm exec tsx
//
// Offline batch runner: scores many homepages with Jev against a frozen rubric
// and writes a static dataset into the repo. No database, no queue, no auth,
// no worker — this is a manually-invoked CLI, entirely outside the Next.js
// request/response boundary (see docs/adr/0001-jev-gateway-demo.md).
//
// Local usage (env vars are not auto-loaded outside the Next.js process):
//   pnpm exec tsx --env-file=.env.local scripts/batch.ts -- --concurrency=4
// or export REPLYNODES_API_KEY / AI_GATEWAY_API_KEY in the shell and run:
//   pnpm run batch -- --domains=data/domains.txt --force
//
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { experimental_evaluate as evaluate, APICallError } from "ai";
import { prepareAnalysisContext } from "../lib/analysis-context";
import { rowsToLeaderboardCsv, type LeaderboardRow } from "../lib/csv";
import { exampleDomainUrl } from "../lib/example-domains";
import { computeOverall, loadRubric, sanitizeRubricAnswer, type RubricFile } from "../lib/rubric";
import { fetchPublicMarkdown } from "../lib/url-safety";

const MODEL = "typesafe-ai/jev" as const;

type BatchOptions = {
  domainsFile: string;
  outDir: string;
  concurrency: number;
  force: boolean;
  maxRetries: number;
  timeoutMs: number;
  month: string;
  pricePer1kInput?: number;
  pricePer1kOutput?: number;
};

function currentMonth(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

function parseNumericFlag(flag: string, value: string, min: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`${flag} expects a number, got: ${value}`);
  return Math.max(min, parsed);
}

export function parseArgs(argv: readonly string[]): BatchOptions {
  const options: BatchOptions = {
    domainsFile: "data/domains.txt",
    outDir: "data",
    concurrency: 4,
    force: false,
    maxRetries: 3,
    timeoutMs: 120_000,
    month: currentMonth(),
  };
  for (const arg of argv) {
    if (arg === "--force") { options.force = true; continue; }
    const equalsIndex = arg.indexOf("=");
    const flag = equalsIndex === -1 ? arg : arg.slice(0, equalsIndex);
    const value = equalsIndex === -1 ? undefined : arg.slice(equalsIndex + 1);
    switch (flag) {
      case "--domains": if (value) options.domainsFile = value; break;
      case "--out-dir": if (value) options.outDir = value; break;
      case "--concurrency": if (value) options.concurrency = parseNumericFlag(flag, value, 1); break;
      case "--retries": if (value) options.maxRetries = parseNumericFlag(flag, value, 0); break;
      case "--timeout-ms": if (value) options.timeoutMs = parseNumericFlag(flag, value, 1000); break;
      case "--price-per-1k-input": if (value) options.pricePer1kInput = parseNumericFlag(flag, value, 0); break;
      case "--price-per-1k-output": if (value) options.pricePer1kOutput = parseNumericFlag(flag, value, 0); break;
    }
  }
  return options;
}

export async function readDomains(filePath: string): Promise<string[]> {
  let content: string;
  try {
    content = await readFile(filePath, "utf8");
  } catch {
    throw new Error(`Cannot read domains file: ${filePath}`);
  }
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
}

function jsonPathFor(opts: BatchOptions): string {
  return path.join(opts.outDir, `leaderboard-${opts.month}.json`);
}

function csvPathFor(opts: BatchOptions): string {
  return path.join(opts.outDir, `leaderboard-${opts.month}.csv`);
}

async function loadExistingRows(jsonPath: string): Promise<Map<string, LeaderboardRow>> {
  try {
    const content = await readFile(jsonPath, "utf8");
    const parsed = JSON.parse(content) as { rows?: LeaderboardRow[] };
    const map = new Map<string, LeaderboardRow>();
    for (const row of parsed.rows ?? []) map.set(row.domain, row);
    return map;
  } catch {
    return new Map();
  }
}

const TRANSIENT_CODES = new Set([
  "PROVIDER_RATE_LIMITED", "PROVIDER_UNAVAILABLE", "PROVIDER_UNREACHABLE",
  "FETCH_TIMEOUT", "SITE_UNREACHABLE", "DNS_LOOKUP_FAILED", "JEV_TIMEOUT",
]);
const PERMANENT_CODES = new Set([
  "INVALID_URL", "BLOCKED_URL", "RESPONSE_TOO_LARGE", "PROVIDER_BAD_RESPONSE",
  "PROVIDER_UNAUTHORIZED", "INVALID_JEV_ANSWER_SHAPE",
]);

function classifyError(error: unknown): { code: string; transient: boolean } {
  if (APICallError.isInstance(error)) {
    const status = error.statusCode;
    if (status === 429 || (typeof status === "number" && status >= 500)) return { code: `API_${status}`, transient: true };
    return { code: `API_${status ?? "UNKNOWN"}`, transient: false };
  }
  if (error instanceof Error) {
    if (error.name === "AbortError" || error.name === "TimeoutError") return { code: "JEV_TIMEOUT", transient: true };
    const code = error.message;
    if (PERMANENT_CODES.has(code)) return { code, transient: false };
    if (TRANSIENT_CODES.has(code)) return { code, transient: true };
    return { code, transient: true };
  }
  return { code: "UNKNOWN", transient: true };
}

async function withRetry<T>(attempt: () => Promise<T>, opts: { maxRetries: number; baseDelayMs: number }): Promise<T> {
  let lastError: unknown;
  for (let tryIndex = 0; tryIndex <= opts.maxRetries; tryIndex++) {
    try {
      return await attempt();
    } catch (error) {
      lastError = error;
      const preclassified = (error as { transient?: boolean })?.transient;
      const transient = typeof preclassified === "boolean" ? preclassified : classifyError(error).transient;
      if (!transient || tryIndex === opts.maxRetries) throw error;
      const delay = opts.baseDelayMs * 2 ** tryIndex + Math.random() * 250;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

function failedRow(params: {
  domain: string;
  status: LeaderboardRow["status"];
  errorCode: string;
  rubricVersion: string;
  scrapeMs?: number;
  jevMs?: number;
  totalMs?: number;
  finalUrl?: string;
  requestId?: string;
  markdownSha256?: string;
  markdownLength?: number;
}): LeaderboardRow {
  return {
    domain: params.domain,
    final_url: params.finalUrl,
    rubric_version: params.rubricVersion,
    status: params.status,
    error_code: params.errorCode,
    fetched_at: new Date().toISOString(),
    request_id: params.requestId,
    markdown_sha256: params.markdownSha256,
    markdown_length: params.markdownLength,
    scrape_ms: params.scrapeMs,
    jev_ms: params.jevMs,
    total_ms: params.totalMs,
    answers: {},
  };
}

async function runOne(domain: string, ctx: { replynodesKey: string; rubric: RubricFile }): Promise<LeaderboardRow> {
  const started = performance.now();
  let scraped: Awaited<ReturnType<typeof fetchPublicMarkdown>>;
  let scrapeMs: number;
  try {
    scraped = await fetchPublicMarkdown(exampleDomainUrl(domain), ctx.replynodesKey);
    scrapeMs = Math.round(performance.now() - started);
  } catch (error) {
    const { code, transient } = classifyError(error);
    throw Object.assign(new Error(code), {
      transient,
      rubricRow: failedRow({ domain, status: "scrape_failed", errorCode: code, rubricVersion: ctx.rubric.rubric_version, scrapeMs: Math.round(performance.now() - started) }),
    });
  }

  const markdownSha256 = createHash("sha256").update(scraped.markdown).digest("hex");
  const markdownLength = scraped.markdown.length;
  const { state } = prepareAnalysisContext(scraped.markdown);
  const jevStart = performance.now();
  let result: Awaited<ReturnType<typeof evaluate>>;
  let jevMs: number;
  try {
    result = await evaluate({
      model: MODEL,
      state,
      questions: ctx.rubric.questions,
      maxRetries: 0,
      abortSignal: AbortSignal.timeout(30_000),
    });
    jevMs = Math.round(performance.now() - jevStart);
  } catch (error) {
    const { code, transient } = classifyError(error);
    throw Object.assign(new Error(code), {
      transient,
      rubricRow: failedRow({
        domain, status: "jev_failed", errorCode: code, rubricVersion: ctx.rubric.rubric_version,
        scrapeMs, jevMs: Math.round(performance.now() - jevStart), totalMs: Math.round(performance.now() - started),
        finalUrl: scraped.url, requestId: scraped.requestId, markdownSha256, markdownLength,
      }),
    });
  }

  const providerMetadata = (result as unknown as { providerMetadata?: unknown }).providerMetadata;
  const rawAnswers = result.answers as Record<string, unknown>;
  const answers: LeaderboardRow["answers"] = {};
  let sanitizeFailedQuestionId: string | undefined;
  for (const [questionId, question] of Object.entries(ctx.rubric.questions)) {
    const sanitized = sanitizeRubricAnswer(questionId, rawAnswers[questionId], question, providerMetadata);
    if (!sanitized) { sanitizeFailedQuestionId = questionId; break; }
    answers[questionId] = sanitized;
  }

  const totalMs = Math.round(performance.now() - started);
  if (sanitizeFailedQuestionId) {
    throw Object.assign(new Error("INVALID_JEV_ANSWER_SHAPE"), {
      transient: false,
      rubricRow: failedRow({
        domain, status: "jev_failed", errorCode: `INVALID_JEV_ANSWER_SHAPE:${sanitizeFailedQuestionId}`, rubricVersion: ctx.rubric.rubric_version,
        scrapeMs, jevMs, totalMs, finalUrl: scraped.url, requestId: scraped.requestId, markdownSha256, markdownLength,
      }),
    });
  }

  const overall = computeOverall(
    ctx.rubric.score_question_ids.map((id) => answers[id].value as number),
    ctx.rubric.score_scale.levels,
  );

  return {
    domain,
    final_url: scraped.url,
    rubric_version: ctx.rubric.rubric_version,
    status: "ok",
    fetched_at: new Date().toISOString(),
    request_id: scraped.requestId,
    markdown_sha256: markdownSha256,
    markdown_length: markdownLength,
    scrape_ms: scrapeMs,
    jev_ms: jevMs,
    total_ms: totalMs,
    answers,
    overall,
    usage: {
      inputTokens: typeof result.usage?.inputTokens === "number" ? result.usage.inputTokens : undefined,
      outputTokens: typeof result.usage?.outputTokens === "number" ? result.usage.outputTokens : undefined,
      totalTokens: typeof result.usage?.totalTokens === "number" ? result.usage.totalTokens : undefined,
    },
  };
}

// Known limitation: this resolves with the timeout placeholder but does not
// abort `promise` itself, since fetchPublicMarkdown/evaluate aren't wired to
// an externally supplied AbortController. A timed-out domain's underlying
// scrape/jev call keeps running until its own internal bound elapses (25s
// scrape, 30s jev); its eventual result is simply discarded. Acceptable for
// a manual offline tool since both internal calls already have hard caps.
function withHardTimeout<T>(promise: Promise<T>, ms: number, onTimeout: () => T): Promise<T> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(onTimeout()), ms);
    promise.then(
      (value) => { clearTimeout(timer); resolve(value); },
      () => { clearTimeout(timer); resolve(onTimeout()); },
    );
  });
}

async function runPool<T>(items: readonly T[], concurrency: number, worker: (item: T, index: number) => Promise<void>): Promise<void> {
  let cursor = 0;
  async function next(): Promise<void> {
    while (cursor < items.length) {
      const index = cursor++;
      await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => next()));
}

function percentile(sorted: readonly number[], p: number): number | undefined {
  if (sorted.length === 0) return undefined;
  const index = Math.min(sorted.length - 1, Math.floor(p * sorted.length));
  return sorted[index];
}

function printSummary(rows: readonly LeaderboardRow[], wallMs: number, opts: BatchOptions): void {
  const attempted = rows.length;
  const ok = rows.filter((row) => row.status === "ok");
  const failed = rows.filter((row) => row.status !== "ok");
  const sortedLatency = ok.map((row) => row.total_ms ?? 0).sort((a, b) => a - b);
  const median = percentile(sortedLatency, 0.5);
  const p95 = percentile(sortedLatency, 0.95);
  const totalInputTokens = rows.reduce((sum, row) => sum + (row.usage?.inputTokens ?? 0), 0);
  const totalOutputTokens = rows.reduce((sum, row) => sum + (row.usage?.outputTokens ?? 0), 0);

  console.log("--- batch run summary ---");
  console.log(`domains attempted: ${attempted}`);
  console.log(`ok: ${ok.length}`);
  console.log(`failed: ${failed.length}`);
  console.log(`wall time: ${(wallMs / 1000).toFixed(1)}s`);
  console.log(`latency median: ${median ?? "n/a"}ms, p95: ${p95 ?? "n/a"}ms`);
  if (opts.pricePer1kInput !== undefined && opts.pricePer1kOutput !== undefined) {
    const cost = (totalInputTokens / 1000) * opts.pricePer1kInput + (totalOutputTokens / 1000) * opts.pricePer1kOutput;
    console.log(`total cost: $${cost.toFixed(4)} (input tokens: ${totalInputTokens}, output tokens: ${totalOutputTokens})`);
  } else {
    console.log("cost: not available (no token pricing configured; pass --price-per-1k-input/--price-per-1k-output)");
  }
}

async function writeOutputs(rows: LeaderboardRow[], rubric: RubricFile, opts: BatchOptions): Promise<{ jsonPath: string; csvPath: string }> {
  await mkdir(opts.outDir, { recursive: true });
  const jsonPath = jsonPathFor(opts);
  const csvPath = csvPathFor(opts);
  const payload = { generated_at: new Date().toISOString(), rubric_version: rubric.rubric_version, rows };
  await writeFile(jsonPath, JSON.stringify(payload, null, 2));
  const questionIds = [...rubric.score_question_ids, ...rubric.category_question_ids];
  await writeFile(csvPath, rowsToLeaderboardCsv(rows, questionIds));
  return { jsonPath, csvPath };
}

async function main(): Promise<void> {
  const replynodesKey = process.env.REPLYNODES_API_KEY;
  const gatewayKey = process.env.AI_GATEWAY_API_KEY;
  const missing = [!replynodesKey && "REPLYNODES_API_KEY", !gatewayKey && "AI_GATEWAY_API_KEY"].filter(Boolean);
  if (missing.length) {
    console.error(`Missing required env var(s): ${missing.join(", ")}`);
    process.exitCode = 1;
    return;
  }

  let opts: BatchOptions;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
    return;
  }
  const rubric = loadRubric();

  let domains: string[];
  try {
    domains = await readDomains(opts.domainsFile);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
    return;
  }

  const jsonPath = jsonPathFor(opts);
  const existing = opts.force ? new Map<string, LeaderboardRow>() : await loadExistingRows(jsonPath);
  const toRun = domains.filter((domain) => !existing.has(domain));
  console.log(`domains: ${domains.length} total, ${domains.length - toRun.length} already present (skipped), ${toRun.length} to run`);

  const results: LeaderboardRow[] = [...existing.values()];
  const wallStart = performance.now();

  await runPool(toRun, opts.concurrency, async (domain) => {
    const row = await withHardTimeout(
      withRetry(() => runOne(domain, { replynodesKey: replynodesKey!, rubric }), { maxRetries: opts.maxRetries, baseDelayMs: 500 }).catch((error) => {
        const rubricRow = (error as { rubricRow?: LeaderboardRow })?.rubricRow;
        if (rubricRow) return rubricRow;
        const { code } = classifyError(error);
        return failedRow({ domain, status: "scrape_failed", errorCode: code, rubricVersion: rubric.rubric_version });
      }),
      opts.timeoutMs,
      () => failedRow({ domain, status: "jev_failed", errorCode: "DOMAIN_TIMEOUT", rubricVersion: rubric.rubric_version }),
    );
    results.push(row);
  });

  const wallMs = Math.round(performance.now() - wallStart);
  await writeOutputs(results, rubric, opts);
  printSummary(results, wallMs, opts);
}

const isMainModule = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
