import { z } from "zod";
import { analysisResponseSchema, type AnalysisResponse } from "./contracts";

export type TraceStage = "fetch" | "extract" | "context" | "jev" | "result";
export type TraceStatus = "pending" | "running" | "complete" | "failed";
export type TraceMetrics = {
  scrapeMs?: number; status?: number; finalUrl?: string; extractMs?: number;
  characters?: number; jevMs?: number; inputTokens?: number; outputTokens?: number; totalMs?: number;
};
export type TraceState = { status: TraceStatus; metrics: TraceMetrics; result?: AnalysisResponse; error?: string; cacheHit?: boolean; activeStage?: TraceStage; completedStages?: TraceStage[] };

export type AnalysisEvent =
  | { type: "request-started"; startedAt: string }
  | { type: "fetch-started" }
  | { type: "fetch-completed"; scrapeMs: number; status: number; finalUrl: string }
  | { type: "extract-started" }
  | { type: "extract-completed"; characters: number }
  | { type: "context-prepared"; extractMs: number; characters: number }
  | { type: "jev-started" }
  | { type: "jev-completed"; jevMs: number; inputTokens?: number; outputTokens?: number }
  | { type: "result-built"; result: AnalysisResponse }
  | { type: "cache-hit"; result: AnalysisResponse }
  | { type: "done"; result: AnalysisResponse }
  | { type: "error"; code: string; message: string };

const stageForEvent: Partial<Record<AnalysisEvent["type"], TraceStage>> = {
  "fetch-started": "fetch", "fetch-completed": "fetch", "extract-started": "extract", "extract-completed": "extract", "context-prepared": "context", "jev-started": "jev", "jev-completed": "jev", "result-built": "result",
};

export function reduceTrace(state: TraceState, event: AnalysisEvent): TraceState {
  const stage = stageForEvent[event.type];
  const metrics = { ...state.metrics };
  const completed = (add: TraceStage) => [...new Set<TraceStage>([...(state.completedStages ?? []), add])];
  if (event.type === "request-started") return { ...state, status: "running", metrics: { ...metrics } };
  if (event.type === "fetch-completed") return { ...state, status: "running", activeStage: "extract", completedStages: completed("fetch"), metrics: { ...metrics, scrapeMs: event.scrapeMs, status: event.status, finalUrl: event.finalUrl } };
  if (event.type === "extract-completed") return { ...state, status: "running", activeStage: "context", completedStages: completed("extract"), metrics: { ...metrics, characters: event.characters } };
  if (event.type === "context-prepared") return { ...state, status: "running", activeStage: "jev", completedStages: completed("context"), metrics: { ...metrics, extractMs: event.extractMs, characters: event.characters } };
  if (event.type === "jev-completed") return { ...state, status: "running", activeStage: "result", completedStages: completed("jev"), metrics: { ...metrics, jevMs: event.jevMs, inputTokens: event.inputTokens, outputTokens: event.outputTokens } };
  if (event.type === "cache-hit") return { ...state, status: "running", cacheHit: true, result: event.result, metrics: resultMetrics(event.result) };
  if (event.type === "result-built") return { ...state, status: "running", activeStage: "result", result: event.result, metrics: resultMetrics(event.result) };
  if (event.type === "done") return { ...state, status: "complete", activeStage: undefined, completedStages: state.cacheHit ? [] : ["fetch", "extract", "context", "jev", "result"], result: event.result, metrics: resultMetrics(event.result) };
  if (event.type === "error") return { ...state, status: "failed", error: event.message };
  if (stage) return { ...state, status: "running" };
  return state;
}

export function resultMetrics(result: AnalysisResponse): TraceMetrics {
  return { scrapeMs: result.timeline.scrapeMs, status: result.timeline.fetchStatus, finalUrl: result.timeline.finalUrl ?? result.url, extractMs: result.timeline.extractMs, jevMs: result.timeline.jevMs, totalMs: result.timeline.totalMs, characters: result.usage.characters, inputTokens: result.usage.inputTokens, outputTokens: result.usage.outputTokens };
}

export function parseNdjsonChunk(buffer: string, chunk: string): { events: AnalysisEvent[]; remainder: string; malformed: boolean } {
  const lines = `${buffer}${chunk}`.split("\n");
  const remainder = lines.pop() ?? "";
  const events: AnalysisEvent[] = [];
  let malformed = false;
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const parsed = analysisEventSchema.safeParse(JSON.parse(line));
      if (parsed.success) events.push(parsed.data); else malformed = true;
    } catch { malformed = true; }
  }
  return { events, remainder, malformed };
}

export function flushNdjsonRemainder(buffer: string) {
  if (!buffer.trim()) return { events: [] as AnalysisEvent[], malformed: false };
  try {
    const parsed = analysisEventSchema.safeParse(JSON.parse(buffer));
    return parsed.success ? { events: [parsed.data], malformed: false } : { events: [] as AnalysisEvent[], malformed: true };
  } catch { return { events: [] as AnalysisEvent[], malformed: true }; }
}

export const analysisEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("request-started"), startedAt: z.string() }), z.object({ type: z.literal("fetch-started") }),
  z.object({ type: z.literal("fetch-completed"), scrapeMs: z.number().nonnegative(), status: z.number().int().nonnegative(), finalUrl: z.string().url() }),
  z.object({ type: z.literal("extract-started") }), z.object({ type: z.literal("extract-completed"), characters: z.number().int().nonnegative() }),
  z.object({ type: z.literal("context-prepared"), extractMs: z.number().nonnegative(), characters: z.number().int().nonnegative() }),
  z.object({ type: z.literal("jev-started") }), z.object({ type: z.literal("jev-completed"), jevMs: z.number().nonnegative(), inputTokens: z.number().nonnegative().optional(), outputTokens: z.number().nonnegative().optional() }),
  z.object({ type: z.literal("result-built"), result: analysisResponseSchema }), z.object({ type: z.literal("cache-hit"), result: analysisResponseSchema }), z.object({ type: z.literal("done"), result: analysisResponseSchema }),
  z.object({ type: z.literal("error"), code: z.string(), message: z.string() }),
]);

export function scoreLabel(value: number, criteria: string[]) {
  const index = Math.max(0, Math.min(criteria.length - 1, Math.round(value) - 1));
  return criteria[index] ?? "Unrated";
}

export function answerLabel(name: string, value: boolean | string | number) {
  if (name === "seo_spam_likelihood" && typeof value === "boolean") return value ? "Likely spam-like" : "Likely useful";
  if (typeof value === "boolean") return value ? "Likely yes" : "Likely no";
  if (typeof value === "number") return `${value}`;
  return value;
}
