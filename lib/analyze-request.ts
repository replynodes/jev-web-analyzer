import type { Judgment } from "./judgment";

export type AnalyzeRequestBody = {
  url: string;
  judgments: Array<{ name: string; question: { type: Judgment["type"]; instructions: string; criteria?: Record<string, string> | string[] } }>;
};

export function buildAnalyzeRequestBody(url: string, judgments: Judgment[]): AnalyzeRequestBody {
  return {
    url,
    judgments: judgments.map(({ name, type, instructions, criteria }) => ({
      name,
      question: {
        type,
        instructions,
        ...(type === "choice"
          ? { criteria: Object.fromEntries(criteria.split("\n").map((item) => { const [key, ...rest] = item.split(":"); return [key.trim(), rest.join(":").trim()]; })) }
          : type === "score"
            ? { criteria: criteria.split("\n").map((item) => item.trim()).filter(Boolean) }
            : {}),
      },
    })),
  };
}
