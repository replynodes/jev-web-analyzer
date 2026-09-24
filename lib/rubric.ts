import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { sanitizeAnswer } from "./contracts";

export type RubricScoreQuestion = { type: "score"; instructions: string; criteria: readonly string[] };
export type RubricChoiceQuestion = { type: "choice"; instructions: string; criteria: Record<string, string> };
export type RubricQuestion = RubricScoreQuestion | RubricChoiceQuestion;

export type RubricFile = {
  rubric_version: string;
  rationale: string;
  score_scale: { levels: number; raw_min: number; raw_max: number; direction: string };
  score_question_ids: readonly string[];
  category_question_ids: readonly string[];
  overall_formula: string;
  questions: Record<string, RubricQuestion>;
};

const DEFAULT_RUBRIC_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "data", "rubric-v1.json");

export function loadRubric(rubricPath: string = DEFAULT_RUBRIC_PATH): RubricFile {
  return JSON.parse(readFileSync(rubricPath, "utf8")) as RubricFile;
}

export type SanitizedRubricAnswer =
  | { type: "score"; value: number; probabilities?: Record<string, number> }
  | { type: "choice"; value: string; probabilities?: Record<string, number> };

export function sanitizeRubricAnswer(
  questionId: string,
  raw: unknown,
  question: RubricQuestion,
  providerMetadata?: unknown,
): SanitizedRubricAnswer | null {
  const sanitized = sanitizeAnswer(questionId, raw, question.type, providerMetadata);
  if (!sanitized) return null;
  if (question.type === "score" && sanitized.type === "score") {
    const value = sanitized.value as number;
    const maxLevel = question.criteria.length - 1;
    if (!Number.isFinite(value) || value < 0 || value > maxLevel) return null;
    return { type: "score", value, ...(sanitized.probabilities ? { probabilities: sanitized.probabilities } : {}) };
  }
  return { type: "choice", value: sanitized.value as string, ...(sanitized.probabilities ? { probabilities: sanitized.probabilities } : {}) };
}

export function computeOverall(scores: readonly number[], levels: number): number | undefined {
  if (scores.length === 0 || levels < 2) return undefined;
  const maxLevel = levels - 1;
  for (const score of scores) {
    if (!Number.isFinite(score) || score < 0 || score > maxLevel) return undefined;
  }
  const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  return Math.round((mean / maxLevel) * 100);
}
