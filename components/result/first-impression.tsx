import { aggregateConfidence, isLowConfidence } from "@/lib/confidence";
import type { AnalysisResponse } from "@/lib/contracts";
import { extractEvidence } from "@/lib/evidence";
import { extractHeroHeading, heroSignals, type HeroSignal } from "@/lib/hero";
import { cn } from "@/lib/utils";
import { ProvenanceTag } from "./provenance-tag";
import { ConclusionBlock, ConfidenceBadge, percent } from "./signal-parts";

const EVIDENCE_LABEL: Record<string, string> = {
  "hero-heading": "Hero heading",
  "first-paragraph": "First paragraph",
  "cta-line": "CTA line",
  "list-item": "List item",
};

function HeroSignalCard({ signal }: { signal: HeroSignal }) {
  const { classification, label } = signal;
  const low = classification ? isLowConfidence(classification.confidence) : false;
  return (
    <div className={cn("rounded-xl border bg-card p-4 shadow-sm", low && "border-[#eccb92] dark:border-[#6b4d1c]")}>
      <div className="flex items-center justify-between gap-2">
        <ProvenanceTag kind="jev" />
        {classification ? <ConfidenceBadge confidence={classification.confidence} /> : null}
      </div>
      <p className="mt-3 text-[11px] font-extrabold uppercase tracking-[0.11em] text-muted-foreground">{label}</p>
      {classification ? (
        <div className="mt-1">
          <ConclusionBlock classification={classification} />
        </div>
      ) : (
        <p className="mt-1 text-sm font-semibold text-muted-foreground">Not returned</p>
      )}
    </div>
  );
}

function EvidenceBlock({ markdownPreview }: { markdownPreview: string }) {
  const evidence = extractEvidence(markdownPreview);
  return (
    <div className="mt-6 rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <ProvenanceTag kind="homepage" />
        <span className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-muted-foreground">
          Lines Jev read
        </span>
      </div>
      {evidence.length ? (
        <ul className="mt-3 space-y-3">
          {evidence.map((entry) => (
            <li key={`${entry.kind}-${entry.text}`}>
              <span className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-muted-foreground">
                {EVIDENCE_LABEL[entry.kind]}
              </span>
              <blockquote className="mt-1 border-l-2 border-[#a9dcd2] pl-3 text-sm dark:border-[#1f5a51]">
                {entry.text}
              </blockquote>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm italic text-muted-foreground">No supporting line available</p>
      )}
    </div>
  );
}

export function ThinContentBanner({ characters }: { characters: number }) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#eccb92] bg-[#fdf3e3] px-4 py-3 text-sm font-bold text-[#b45309] dark:border-[#6b4d1c] dark:bg-[#3a2a10] dark:text-[#fbbf24]">
      <ProvenanceTag kind="run" />
      Thin page ({characters.toLocaleString()} characters) — signals may be low-evidence.
    </div>
  );
}

export function FirstImpression({ result }: { result: AnalysisResponse }) {
  const heading = extractHeroHeading(result.scrape.markdownPreview);
  const signals = heroSignals(result.classifications);
  const aggregate = aggregateConfidence(result.classifications);

  return (
    <section>
      <p className="text-[11px] font-extrabold uppercase tracking-[0.13em] text-muted-foreground">
        Your homepage, as Jev read it
      </p>

      <div className="mt-3">
        {heading ? (
          <>
            <ProvenanceTag kind="homepage" />
            <h1 className="mt-3 max-w-4xl text-3xl font-extrabold leading-[1.05] tracking-[-0.04em] md:text-5xl">
              {heading}
            </h1>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No H1 returned for this homepage · quote omitted.</p>
        )}
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {signals.map((signal) => (
          <HeroSignalCard key={signal.name} signal={signal} />
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card px-4 py-3">
          <ProvenanceTag kind="jev" />
          <span className="text-sm">
            {aggregate ? (
              <>
                <b>
                  Confidence {percent(aggregate.min)}–{percent(aggregate.max)} · mean {percent(aggregate.mean)} across{" "}
                  {aggregate.count} signals
                </b>
              </>
            ) : (
              <b>Confidence unavailable</b>
            )}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          Aggregate of Jev&apos;s own returned per-signal confidence values
        </span>
      </div>

      <EvidenceBlock markdownPreview={result.scrape.markdownPreview} />
    </section>
  );
}
