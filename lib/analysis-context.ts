export const ANALYSIS_CONTEXT_CAP = 120_000;

export type AnalysisContext = {
  state: string;
  sentCharacters: number;
  sourceCharacters: number;
  contextTruncated: boolean;
};

export function prepareAnalysisContext(cleanMarkdown: string): AnalysisContext {
  const sourceCharacters = cleanMarkdown.length;
  const state = cleanMarkdown.slice(0, ANALYSIS_CONTEXT_CAP);
  return {
    state,
    sentCharacters: state.length,
    sourceCharacters,
    contextTruncated: sourceCharacters > ANALYSIS_CONTEXT_CAP,
  };
}

export function analysisContextLabel(context: Pick<AnalysisContext, "sentCharacters" | "sourceCharacters" | "contextTruncated">) {
  return context.contextTruncated
    ? `Showing first ${context.sentCharacters.toLocaleString()} of ${context.sourceCharacters.toLocaleString()} extracted characters`
    : `Showing ${context.sourceCharacters.toLocaleString()} extracted characters`;
}
