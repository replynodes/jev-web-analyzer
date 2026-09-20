export type Judgment = { name: string; type: "boolean" | "choice" | "score"; instructions: string; criteria: string };

export const MAX_JUDGMENTS = 3;
