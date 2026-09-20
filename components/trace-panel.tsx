"use client";

import { useEffect, useState } from "react";
import { Check, Circle, LoaderCircle, X } from "lucide-react";
import type { TraceState } from "@/lib/analysis-trace";

const stages = [
  { key: "fetch", title: "Fetch webpage with ReplyNodes" },
  { key: "extract", title: "Extract clean Markdown" },
  { key: "context", title: "Prepare context for Jev" },
  { key: "jev", title: "Run 10 founder judgments via Jev" },
  { key: "result", title: "Build analysis result" },
] as const;
type StageKey = (typeof stages)[number]["key"];

function stageStatus(stage: StageKey, trace: TraceState): "pending" | "running" | "complete" | "failed" {
  if (trace.status === "failed") return trace.completedStages?.includes(stage) ? "complete" : trace.activeStage === stage ? "failed" : "pending";
  if (trace.completedStages?.includes(stage)) return "complete";
  if (trace.activeStage === stage) return "running";
  return "pending";
}

export function Trace({ trace }: { trace: TraceState }) {
  const [expanded, setExpanded] = useState(trace.status !== "complete");
  useEffect(() => { if (trace.status === "complete") setExpanded(false); }, [trace.status]);
  return (
    <section className="mt-8" aria-live="polite" aria-label="Analysis progress">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium">Execution trace</h2>
        {trace.status === "complete" && (
          <button type="button" className="min-h-11 px-2 text-xs underline underline-offset-4" onClick={() => setExpanded(!expanded)}>
            {expanded ? "Collapse" : "Expand"}
          </button>
        )}
      </div>
      {expanded ? (
        <div className="rounded-xl border bg-card p-4">
          {stages.map(({ key, title }) => {
            const status = stageStatus(key, trace);
            return (
              <div key={key} className="flex gap-3 py-2">
                <div className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full ${status === "complete" ? "bg-emerald-500/15 text-emerald-600" : status === "failed" ? "bg-destructive/15 text-destructive" : status === "running" ? "bg-foreground/10 text-foreground motion-safe:animate-pulse" : "bg-muted text-muted-foreground"}`}>
                  {status === "complete" ? <Check className="size-3" /> : status === "failed" ? <X className="size-3" /> : status === "running" ? <LoaderCircle className="size-3 motion-safe:animate-spin" /> : <Circle className="size-2 fill-current" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">{title}</p>
                  {key === "fetch" && trace.metrics.scrapeMs !== undefined && <p className="font-mono text-xs text-muted-foreground">{trace.metrics.scrapeMs} ms · HTTP {trace.metrics.status ?? "unknown"}</p>}
                  {key === "context" && trace.metrics.characters !== undefined && <p className="font-mono text-xs text-muted-foreground">{trace.metrics.characters.toLocaleString()} characters prepared</p>}
                  {key === "jev" && trace.metrics.jevMs !== undefined && <p className="font-mono text-xs text-muted-foreground">{trace.metrics.jevMs} ms{trace.metrics.inputTokens !== undefined ? ` · ${trace.metrics.inputTokens.toLocaleString()} input tokens` : ""}{trace.metrics.outputTokens !== undefined ? ` · ${trace.metrics.outputTokens.toLocaleString()} output tokens` : ""}</p>}
                  {key === "result" && trace.result && <p className="font-mono text-xs text-muted-foreground">{trace.result.timeline.totalMs} ms total</p>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        trace.result && <div className="rounded-xl border p-3 font-mono text-xs text-muted-foreground">Complete · {trace.result.timeline.totalMs} ms total</div>
      )}
    </section>
  );
}
