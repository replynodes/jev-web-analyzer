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
      .refine((value) => Object.keys(value).length >= 2 && Object.keys(value).length <= 20),
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
  question: z.string().max(240).optional(),
  instructions: z.string().max(240).optional(),
  reason: z.string().max(240).optional(),
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
    fetchStatus: z.number().int().nonnegative().optional(),
    finalUrl: z.string().url().optional(),
  }),
  usage: z.object({ inputTokens: z.number().nonnegative().optional(), outputTokens: z.number().nonnegative().optional(), characters: z.number().nonnegative() }),
  model: z.object({ requested: z.literal("jev-latest"), resolved: z.string().optional() }),
  scrape: z.object({ requestId: z.string().max(200), markdownPreview: z.string().max(4000) }),
});

export type AnalysisResponse = z.infer<typeof analysisResponseSchema>;
export type SanitizedAnswer = NonNullable<ReturnType<typeof sanitizeAnswer>> & { question?: string; instructions?: string };

const RESOLVED_MODEL_KEYS = ["resolvedModel", "resolvedModelId", "modelVersion", "version"] as const;

function safeModelString(value: unknown) {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized.length <= 160 && /^[\w./:@-]+$/.test(normalized) ? normalized : undefined;
}

export function sanitizeResolvedModel(providerMetadata: unknown): string | undefined {
  if (!providerMetadata || typeof providerMetadata !== "object") return undefined;
  for (const namespace of Object.values(providerMetadata as Record<string, unknown>)) {
    if (!namespace || typeof namespace !== "object") continue;
    const metadata = namespace as Record<string, unknown>;
    for (const key of RESOLVED_MODEL_KEYS) {
      const value = safeModelString(metadata[key]);
      if (value) return value;
    }
  }
  return undefined;
}

function sanitizeConfidence(providerMetadata: unknown, questionId: string) {
  if (!providerMetadata || typeof providerMetadata !== "object") return undefined;
  const typesafe = (providerMetadata as Record<string, unknown>).typesafe;
  if (!typesafe || typeof typesafe !== "object") return undefined;
  const confidence = (typesafe as Record<string, unknown>).confidence;
  const value = typeof confidence === "number"
    ? confidence
    : confidence && typeof confidence === "object"
      ? (confidence as Record<string, unknown>)[questionId]
      : undefined;
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1 ? value : undefined;
}

function sanitizeReason(item: Record<string, unknown>) {
  const candidate = typeof item.reason === "string" ? item.reason : typeof item.explanation === "string" ? item.explanation : undefined;
  if (!candidate || candidate.length > 240 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(candidate)) return undefined;
  const reason = candidate.trim();
  return reason.length >= 3 ? reason : undefined;
}

export function sanitizeAnswer(name: string, raw: unknown, expectedType: "boolean" | "choice" | "score", providerMetadata?: unknown) {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  const value = expectedType === "boolean" ? item.probability : expectedType === "choice" ? item.choice : item.score;
  const booleanProbability = typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1 ? value : null;
  const safeValue = expectedType === "boolean"
    ? booleanProbability === null ? null : booleanProbability >= 0.5
    : expectedType === "score"
      ? typeof value === "number" && Number.isFinite(value) ? value : null
      : typeof value === "string" && value.length <= 80 ? value : null;
  if (safeValue === null) return null;
  const probabilities = item.probabilities;
  const safeProbabilities = probabilities && typeof probabilities === "object"
    ? Object.fromEntries(Object.entries(probabilities as Record<string, unknown>).filter(([, probability]) => typeof probability === "number" && probability >= 0 && probability <= 1).slice(0, 20)) as Record<string, number>
    : undefined;
  const confidence = sanitizeConfidence(providerMetadata, name);
  const booleanProbabilities = booleanProbability === null ? undefined : { true: booleanProbability, false: 1 - booleanProbability };
  const outputProbabilities = expectedType === "boolean" ? booleanProbabilities : safeProbabilities && Object.keys(safeProbabilities).length ? safeProbabilities : undefined;
  const reason = sanitizeReason(item);
  return { name, type: expectedType, value: safeValue, ...(outputProbabilities ? { probabilities: outputProbabilities } : {}), ...(confidence === undefined ? {} : { confidence }), ...(reason ? { reason } : {}) };
}

export function withPromptMetadata(
  answer: SanitizedAnswer | null,
  prompt: { question: string; instructions: string },
) : SanitizedAnswer | null {
  return answer ? { ...answer, question: prompt.question, instructions: prompt.instructions } : answer;
}
