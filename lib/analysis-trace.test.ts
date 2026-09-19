import { describe, expect, it } from "vitest";
import { flushNdjsonRemainder, parseNdjsonChunk, reduceTrace, scoreLabel, type AnalysisEvent, type TraceState } from "./analysis-trace";

describe("analysis trace protocol", () => {
  it("parses NDJSON when records are split across chunks", () => {
    const first = parseNdjsonChunk("", '{"type":"fetch-started"}\n{"type":"fetch-com',);
    expect(first.events).toEqual([{ type: "fetch-started" }]);
    const second = parseNdjsonChunk(first.remainder, 'pleted","scrapeMs":12,"status":200,"finalUrl":"https://example.com"}\n');
    expect(second.malformed).toBe(false);
    expect(second.events[0]).toMatchObject({ type: "fetch-completed", scrapeMs: 12 });
  });

  it("safely reports malformed records and retains valid records", () => {
    const parsed = parseNdjsonChunk("", '{"type":"jev-started"}\nnot-json\n');
    expect(parsed.events).toEqual([{ type: "jev-started" }]);
    expect(parsed.malformed).toBe(true);
    expect(flushNdjsonRemainder(" ").malformed).toBe(false);
  });

  it("reduces progressive stages and final metrics", () => {
    let state: TraceState = { status: "pending", metrics: {} };
    const events: AnalysisEvent[] = [
      { type: "request-started", startedAt: "2026-01-01T00:00:00.000Z" }, { type: "fetch-started" },
      { type: "fetch-completed", scrapeMs: 20, status: 200, finalUrl: "https://example.com" }, { type: "context-prepared", extractMs: 2, characters: 123 },
      { type: "jev-started" }, { type: "jev-completed", jevMs: 31, outputTokens: 4 },
    ];
    for (const event of events) state = reduceTrace(state, event);
    expect(state.metrics).toMatchObject({ scrapeMs: 20, extractMs: 2, characters: 123, jevMs: 31, outputTokens: 4 });
  });

  it("maps five-point scores to their native rubric labels", () => {
    expect(scoreLabel(4, ["Thin", "Limited", "Adequate", "Strong", "Exceptional"])).toBe("Strong");
    expect(scoreLabel(0, ["Low", "High"])).toBe("Low");
  });
});
