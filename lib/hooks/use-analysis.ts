"use client";

import { useCallback, useRef, useState } from "react";
import { ANALYZE_API_PATH } from "@/lib/analyze-path";
import { buildAnalyzeRequestBody } from "@/lib/analyze-request";
import { flushNdjsonRemainder, parseNdjsonChunk, reduceTrace, type AnalysisEvent, type TraceState } from "@/lib/analysis-trace";
import type { AnalysisResponse } from "@/lib/contracts";
import type { Judgment } from "@/lib/judgment";

const initialTrace: TraceState = { status: "pending", metrics: {} };

export function useAnalysis() {
  const [result, setResult] = useState<AnalysisResponse>();
  const [error, setError] = useState("");
  const [errorCode, setErrorCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [trace, setTrace] = useState<TraceState>(initialTrace);
  const abortRef = useRef<AbortController | undefined>(undefined);

  const abort = useCallback(() => { abortRef.current?.abort(); }, []);

  const run = useCallback(async (url: string, judgments: Judgment[]) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true); setError(""); setErrorCode(""); setResult(undefined); setTrace(initialTrace);
    const body = buildAnalyzeRequestBody(url, judgments);
    let completedResult: AnalysisResponse | undefined;
    try {
      const response = await fetch(ANALYZE_API_PATH, { method: "POST", headers: { "content-type": "application/json", accept: "application/x-ndjson" }, body: JSON.stringify(body), signal: controller.signal });
      if (!response.ok && !response.body) { const data = await response.json(); setErrorCode(typeof data.error?.code === "string" ? data.error.code : ""); throw new Error(data.error?.message || "Analysis failed."); }
      if (!response.body) throw new Error("The analysis stream was unavailable.");
      const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = ""; let malformed = false; let receivedResult = false;
      const apply = (event: AnalysisEvent) => { setTrace((state) => reduceTrace(state, event)); if (event.type === "result-built" || event.type === "done" || event.type === "cache-hit") { receivedResult = true; completedResult = event.result; setResult(event.result); } if (event.type === "error") { setErrorCode(event.code); throw new Error(event.message); } };
      while (true) { const part = await reader.read(); if (part.done) break; const parsed = parseNdjsonChunk(buffer, decoder.decode(part.value, { stream: true })); buffer = parsed.remainder; malformed ||= parsed.malformed; parsed.events.forEach(apply); }
      const tail = flushNdjsonRemainder(buffer + decoder.decode()); malformed ||= tail.malformed; tail.events.forEach(apply);
      if (malformed && !receivedResult) throw new Error("The analysis stream was malformed.");
      if (!receivedResult) throw new Error("The analysis did not return a result.");
    } catch (caught) {
      if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : "Analysis failed.");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
    return controller.signal.aborted ? undefined : completedResult;
  }, []);

  return { result, error, errorCode, loading, trace, run, abort };
}
