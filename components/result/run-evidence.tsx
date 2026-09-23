import type { TraceState } from "@/lib/analysis-trace";
import type { AnalysisResponse } from "@/lib/contracts";
import { ProvenanceTag } from "./provenance-tag";

function cell(value: string | number | undefined, format?: (value: number) => string) {
  if (value === undefined || value === "") return "Not returned";
  if (typeof value === "number") return format ? format(value) : value.toLocaleString();
  return value;
}

export function RunEvidence({ result, trace }: { result?: AnalysisResponse; trace: TraceState }) {
  const metrics = trace.metrics;
  const rows: Array<[string, string]> = [
    ["Model requested", cell(result?.model.requested)],
    ["Resolved version", "not exposed by gateway"],
    ["Source", "Homepage Markdown"],
    ["Characters", cell(result?.usage.characters ?? metrics.characters)],
    ["Pages analyzed", "1"],
    ["Analysis time", cell(result?.timeline.totalMs ?? metrics.totalMs, (value) => `${value} ms`)],
    ["Fetch status", cell(result?.timeline.fetchStatus ?? metrics.status, (value) => `HTTP ${value}`)],
    ["Input tokens", cell(result?.usage.inputTokens ?? metrics.inputTokens)],
    ["Output tokens", cell(result?.usage.outputTokens ?? metrics.outputTokens)],
    ["Request ID", cell(result?.scrape.requestId)],
  ];

  const scrapeMs = result?.timeline.scrapeMs ?? metrics.scrapeMs;
  const jevMs = result?.timeline.jevMs ?? metrics.jevMs;
  const characters = result?.usage.characters ?? metrics.characters;
  const count = result?.classifications.length;

  const steps: Array<[string, string]> = [
    ["Homepage", scrapeMs === undefined ? "fetched" : `${scrapeMs} ms scrape`],
    ["Markdown", characters === undefined ? "extracted" : `${characters.toLocaleString()} characters`],
    ["Jev", jevMs === undefined ? "classified" : `${jevMs} ms`],
    ["Classifications", count === undefined ? "pending" : `${count} signals`],
  ];

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded-xl border bg-card px-4 py-3">
            <span className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-[0.1em] text-muted-foreground">
              {label} · RUN
            </span>
            <strong className="break-words font-mono text-[13px] font-semibold">{value}</strong>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <ProvenanceTag kind="run" />
        {steps.map(([label, detail], index) => (
          <div key={label} className="flex items-center gap-2">
            {index > 0 ? <span className="text-muted-foreground">→</span> : null}
            <span className="rounded-lg border bg-card px-3 py-2 text-xs">
              <b className="block text-[13px]">{label}</b>
              <span className="text-[11px] text-muted-foreground">{detail}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
