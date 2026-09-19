import { z } from "zod";

const NAME = /^[a-z][a-z0-9_-]{0,31}$/;
const LABEL = /^[a-zA-Z0-9][a-zA-Z0-9 _-]{0,47}$/;

export const judgmentSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("boolean"),
    instructions: z.string().trim().min(3).max(240),
  }),
  z.object({
    type: z.literal("choice"),
    instructions: z.string().trim().min(3).max(240),
    criteria: z.record(z.string().regex(LABEL), z.string().trim().min(1).max(160))
      .refine((value) => Object.keys(value).length >= 2 && Object.keys(value).length <= 10),
  }),
  z.object({
    type: z.literal("score"),
    instructions: z.string().trim().min(3).max(240),
    criteria: z.array(z.string().trim().min(1).max(160)).min(2).max(10),
  }),
]);

export const judgmentInputSchema = z.object({
  name: z.string().regex(NAME),
  question: judgmentSchema,
}).strict();

export const requestSchema = z.object({
  url: z.string().trim().min(1).max(2048),
  judgments: z.array(judgmentInputSchema).max(3).default([]),
}).strict();

export type JudgmentInput = z.infer<typeof judgmentInputSchema>;

export const answerSchema = z.object({
  name: z.string(),
  type: z.enum(["boolean", "choice", "score"]),
  value: z.union([z.boolean(), z.string(), z.number()]),
  probabilities: z.record(z.string(), z.number().min(0).max(1)).optional(),
  confidence: z.number().min(0).max(1).optional(),
});

export const analysisResponseSchema = z.object({
  url: z.string().url(),
  classifications: z.array(answerSchema),
  judgments: z.array(answerSchema),
  timeline: z.object({
    startedAt: z.string(),
    scrapeMs: z.number().nonnegative(),
    extractMs: z.number().nonnegative(),
    jevMs: z.number().nonnegative(),
    totalMs: z.number().nonnegative(),
  }),
  usage: z.object({ inputTokens: z.number().nonnegative().optional(), outputTokens: z.number().nonnegative().optional(), characters: z.number().nonnegative() }),
  model: z.object({ requested: z.literal("typesafe/jev-latest"), resolved: z.string().optional() }),
  scrape: z.object({ requestId: z.string().max(200), markdownPreview: z.string().max(4000) }),
});

export type AnalysisResponse = z.infer<typeof analysisResponseSchema>;

export function sanitizeResolvedModel(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length > 160) return undefined;
  return /^[\w./:@-]+$/.test(value) ? value : undefined;
}

export function sanitizeAnswer(name: string, raw: unknown, expectedType: "boolean" | "choice" | "score") {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  const value = expectedType === "boolean" ? item.probability : expectedType === "choice" ? item.choice : item.score;
  const safeValue = expectedType === "boolean"
    ? typeof value === "number" && value >= 0 && value <= 1 ? value >= 0.5 : null
    : expectedType === "score"
      ? typeof value === "number" && Number.isFinite(value) ? value : null
      : typeof value === "string" && value.length <= 80 ? value : null;
  if (safeValue === null) return null;
  const probabilities = item.probabilities;
  const safeProbabilities = probabilities && typeof probabilities === "object"
    ? Object.fromEntries(Object.entries(probabilities as Record<string, unknown>).filter(([, probability]) => typeof probability === "number" && probability >= 0 && probability <= 1).slice(0, 20)) as Record<string, number>
    : undefined;
  const confidence = typeof item.confidence === "number" && item.confidence >= 0 && item.confidence <= 1 ? item.confidence : undefined;
  return { name, type: expectedType, value: safeValue, ...(safeProbabilities && Object.keys(safeProbabilities).length ? { probabilities: safeProbabilities } : {}), ...(confidence === undefined ? {} : { confidence }) };
}
