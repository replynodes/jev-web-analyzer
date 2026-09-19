import { experimental_evaluate as evaluate } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { allowRequest } from "@/lib/abuse";
import { safeError } from "@/lib/analyze-errors";
import { cacheKey, getCached, setCached } from "@/lib/cache";
import { answerSchema, requestSchema, sanitizeAnswer, sanitizeResolvedModel, withPromptMetadata, type AnalysisResponse, type JudgmentInput } from "@/lib/contracts";
import { fetchPublicMarkdown } from "@/lib/url-safety";
import type { AnalysisEvent } from "@/lib/analysis-trace";
import { DEFAULT_QUESTIONS } from "@/lib/founder-questions";
import { prepareAnalysisContext } from "@/lib/analysis-context";

export const maxDuration = 60;
const MODEL = "typesafe-ai/jev" as const;
const REQUESTED_MODEL = "jev-latest" as const;
function clientIp(request: Request) { return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown"; }
function fail(status: number, code: string, message: string) { return NextResponse.json({ error: { code, message } }, { status }); }
function normalizeQuestions(judgments: JudgmentInput[]) { return Object.fromEntries(judgments.map(({ name, question }) => [name, question])); }
function wantsStream(request: Request) { return request.headers.get("accept")?.split(",").some((item) => item.trim().split(";", 1)[0]?.trim().toLowerCase() === "application/x-ndjson") ?? false; }
function eventLine(event: AnalysisEvent) { return new TextEncoder().encode(`${JSON.stringify(event)}\n`); }
function streamError(error: unknown) { const result = safeError(error); return { type: "error" as const, code: result.code, message: result.message }; }
function streamFailure(status: number, code: string, message: string) { return new Response(`${JSON.stringify({ type: "error", code, message })}\n`, { status, headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-cache", "x-accel-buffering": "no" } }); }
export function GET() { return NextResponse.json({ message: "Use POST /jev-web-analyzer/api/analyze to analyze a URL." }, { status: 405, headers: { Allow: "POST" } }); }

async function analyze(inputUrl: string, judgments: JudgmentInput[], emit: (event: AnalysisEvent) => void, cached?: AnalysisResponse): Promise<AnalysisResponse> {
  if (cached) { emit({ type: "request-started", startedAt: cached.timeline.startedAt }); emit({ type: "cache-hit", result: cached }); emit({ type: "done", result: cached }); return cached; }
  const startedAt = new Date().toISOString(); emit({ type: "request-started", startedAt }); emit({ type: "fetch-started" });
  const started = performance.now(); const scraped = await fetchPublicMarkdown(inputUrl, process.env.REPLYNODES_API_KEY!); const scrapeMs = Math.round(performance.now() - started);
  emit({ type: "fetch-completed", scrapeMs, status: scraped.status, finalUrl: scraped.url });
  emit({ type: "extract-started" }); const extractStart = performance.now(); const context = prepareAnalysisContext(scraped.markdown); const { state, sentCharacters, sourceCharacters, contextTruncated } = context; const extractMs = Math.round(performance.now() - extractStart); emit({ type: "extract-completed", characters: sentCharacters }); emit({ type: "context-prepared", extractMs, characters: sentCharacters }); emit({ type: "jev-started" });
  const jevStart = performance.now(); const result = await evaluate({ model: MODEL, state, questions: { ...DEFAULT_QUESTIONS, ...normalizeQuestions(judgments) }, maxRetries: 0, abortSignal: AbortSignal.timeout(30_000) }); const jevMs = Math.round(performance.now() - jevStart);
  const providerMetadata = (result as unknown as { providerMetadata?: unknown }).providerMetadata; const answers = result.answers as Record<string, unknown>;
  const classifications = Object.keys(DEFAULT_QUESTIONS).map((name) => sanitizeAnswer(name, answers[name], (DEFAULT_QUESTIONS as Record<string, { type: "boolean" | "choice" | "score" }>)[name].type, providerMetadata)).filter((item): item is NonNullable<typeof item> => Boolean(item));
  const custom = judgments.map(({ name, question }) => withPromptMetadata(sanitizeAnswer(name, answers[name], question.type, providerMetadata), { question: question.instructions, instructions: question.instructions })).filter((item): item is NonNullable<typeof item> => Boolean(item));
  const output: AnalysisResponse = { url: scraped.url, classifications, judgments: custom, timeline: { startedAt, scrapeMs, extractMs, jevMs, totalMs: Math.round(performance.now() - started), fetchStatus: scraped.status, finalUrl: scraped.url }, usage: { characters: sentCharacters, inputTokens: typeof result.usage?.inputTokens === "number" ? result.usage.inputTokens : undefined, outputTokens: typeof result.usage?.outputTokens === "number" ? result.usage.outputTokens : undefined }, model: { requested: REQUESTED_MODEL, resolved: sanitizeResolvedModel(providerMetadata) }, scrape: { requestId: scraped.requestId, markdownPreview: state, markdownCharacters: sentCharacters, sourceCharacters, markdownTruncated: contextTruncated } };
  const valid = z.object({ classifications: z.array(answerSchema), judgments: z.array(answerSchema) }).safeParse(output); if (!valid.success) throw new Error("INVALID_PROVIDER_RESPONSE");
  emit({ type: "jev-completed", jevMs, ...(output.usage.inputTokens === undefined ? {} : { inputTokens: output.usage.inputTokens }), ...(output.usage.outputTokens === undefined ? {} : { outputTokens: output.usage.outputTokens }) }); setCached(cacheKey(inputUrl, judgments), output); emit({ type: "result-built", result: output }); emit({ type: "done", result: output }); return output;
}

export async function POST(request: Request) {
  const stream = wantsStream(request); const respondError = (status: number, code: string, message: string) => stream ? streamFailure(status, code, message) : fail(status, code, message);
  if (!allowRequest(clientIp(request))) return respondError(429, "RATE_LIMITED", "Too many requests. Please try again shortly."); if (!process.env.REPLYNODES_API_KEY || !process.env.AI_GATEWAY_API_KEY) return respondError(503, "NOT_CONFIGURED", "Analysis is temporarily unavailable.");
  let body: unknown; try { if (Number(request.headers.get("content-length") ?? 0) > 24_000) return respondError(413, "REQUEST_TOO_LARGE", "The request is too large."); body = await request.json(); } catch { return respondError(400, "INVALID_JSON", "The request body is invalid."); }
  const parsed = requestSchema.safeParse(body); if (!parsed.success) return respondError(400, "INVALID_INPUT", "Enter a valid public URL and bounded judgments."); const { url: inputUrl, judgments } = parsed.data; const key = cacheKey(inputUrl, judgments); const cached = getCached<AnalysisResponse>(key);
  if (!stream && cached) return NextResponse.json(cached, { headers: { "x-analysis-cache": "hit" } });
  if (!stream) { try { const output = await analyze(inputUrl, judgments, () => undefined, cached); return NextResponse.json(output, { headers: { "x-analysis-cache": cached ? "hit" : "miss" } }); } catch (error) { const result = safeError(error); return fail(result.status, result.code, result.message); } }
  const readable = new ReadableStream<Uint8Array>({ async start(controller) { const emit = (event: AnalysisEvent) => controller.enqueue(eventLine(event)); try { await analyze(inputUrl, judgments, emit, cached); controller.close(); } catch (error) { controller.enqueue(eventLine(streamError(error))); controller.close(); } } });
  return new Response(readable, { headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-cache", "x-accel-buffering": "no" } });
}
