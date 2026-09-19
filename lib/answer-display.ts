import type { AnalysisResponse } from "./contracts";
import { answerLabel, scoreLabel } from "./analysis-trace";

export type DisplayAnswer = AnalysisResponse["classifications"][number];

export function customAnswerTitle(answer: DisplayAnswer) {
  return answer.instructions?.trim() || answer.question?.trim() || answer.name;
}

export function displayAnswerValue(answer: DisplayAnswer, rubric: string[] = []) {
  if (answer.type === "boolean") return answerLabel(answer.name, answer.value);
  if (answer.type === "score" && typeof answer.value === "number") return rubric.length ? `${scoreLabel(answer.value, rubric)} · ${answer.value}/${rubric.length}` : `${answer.value}`;
  return String(answer.value);
}
