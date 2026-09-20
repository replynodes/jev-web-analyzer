"use client";

import { ChevronDown } from "lucide-react";
import { analysisContextLabel } from "@/lib/analysis-context";
import { customAnswerTitle, displayAnswerValue } from "@/lib/answer-display";
import type { AnalysisResponse } from "@/lib/contracts";
import { answersForSection, FOUNDER_SECTIONS, readableAnswer, splitCtaSignal } from "@/lib/founder-summary";

type Answer = AnalysisResponse["classifications"][number];

const FOUNDER_TITLES: Record<string, string> = {
  understandable_in_10_seconds: "Understandable in 10 seconds",
  audience: "Target audience",
  value_proposition_clarity: "Value proposition",
  differentiation: "Differentiation",
  strongest_reason_to_choose: "Strongest reason to choose",
  cta_signal: "CTA signal",
  self_serve_motion: "Self-serve vs sales-led",
  trust_strength: "Trust signals",
  copy_specificity: "Specific vs generic copy",
  change_first: "What Jev would change first",
};

function Distribution({ answer }: { answer: Answer }) {
  return (
    <details open className="mt-2">
      <summary className="min-h-11 cursor-pointer py-2 text-xs text-muted-foreground">View probability distribution</summary>
      {answer.probabilities ? (
        <div className="space-y-1.5 pb-2">
          {Object.entries(answer.probabilities).map(([key, probability]) => (
            <div key={key} className="flex items-center gap-2 text-xs">
              <span className="w-28 shrink-0 truncate text-muted-foreground" title={readableAnswer(key)}>{readableAnswer(key)}</span>
              <div className="h-1.5 min-w-0 flex-1 rounded-full bg-muted">
                <div className="h-full rounded-full bg-foreground" style={{ width: `${Math.round(probability * 100)}%` }} />
              </div>
              <span className="w-10 text-right font-mono">{Math.round(probability * 100)}%</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="pb-2 text-xs text-muted-foreground">No probability distribution was returned.</p>
      )}
    </details>
  );
}

function FounderCard({ answer }: { answer: Answer }) {
  const raw = String(answer.value);
  const title = answer.name === "cta_signal" ? "CTA signal" : (FOUNDER_TITLES[answer.name] ?? answer.name);
  const cta = answer.name === "cta_signal" ? splitCtaSignal(raw) : undefined;
  const display = answer.name === "understandable_in_10_seconds"
    ? ({ yes: "Likely yes", partly: "Unclear", no: "Likely no" }[raw] ?? readableAnswer(raw))
    : cta
      ? ""
      : readableAnswer(raw);
  return (
    <article className="rounded-lg border p-3">
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-xs font-medium text-muted-foreground">{title}</h4>
        {answer.confidence !== undefined && <span className="whitespace-nowrap font-mono text-xs text-muted-foreground">{Math.round(answer.confidence * 100)}%</span>}
      </div>
      {cta ? (
        <div className="mt-1.5 space-y-0.5 text-base font-light">
          <p>CTA: {cta.action}</p>
          <p>CTA clarity: {cta.clarity}</p>
        </div>
      ) : (
        <p className={`mt-1.5 text-base font-light ${answer.name === "change_first" ? "leading-6" : ""}`}>{answer.name === "change_first" ? `${String(display).replace(/\.$/, "")}.` : display}</p>
      )}
      {answer.reason && <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{answer.reason}</p>}
      <Distribution answer={answer} />
    </article>
  );
}

function ClassificationCard({ answer, custom }: { answer: Answer; custom: boolean }) {
  return (
    <article className="rounded-lg border p-3">
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-xs font-medium text-muted-foreground">{custom ? customAnswerTitle(answer) : answer.name}</h4>
        {answer.confidence !== undefined && <span className="whitespace-nowrap font-mono text-xs text-muted-foreground">{Math.round(answer.confidence * 100)}%</span>}
      </div>
      <p className="mt-1.5 text-base font-light">{displayAnswerValue(answer)}</p>
      {answer.reason && <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{answer.reason}</p>}
      <Distribution answer={answer} />
    </article>
  );
}

function TechnicalDetails({ result, showMarkdown, setShowMarkdown }: { result: AnalysisResponse; showMarkdown: boolean; setShowMarkdown: (value: boolean) => void }) {
  const contextLabel = analysisContextLabel({ sentCharacters: result.usage.characters, sourceCharacters: result.scrape.sourceCharacters, contextTruncated: result.scrape.markdownTruncated });
  return (
    <details className="rounded-xl border p-4 md:p-5">
      <summary className="min-h-11 cursor-pointer py-3 text-sm font-medium">Technical details</summary>
      <dl className="mt-3 grid gap-3 text-xs text-muted-foreground sm:grid-cols-2">
        <div><dt>Fetched with ReplyNodes</dt><dd className="font-mono text-foreground">{result.scrape.requestId.slice(0, 16)}</dd></div>
        <div><dt>Requested model</dt><dd className="font-mono text-foreground">{result.model.requested}</dd></div>
        <div>{result.model.resolved ? <><dt>Resolved version</dt><dd className="font-mono text-foreground">{result.model.resolved}</dd></> : <dt>Resolved version: not exposed by gateway</dt>}</div>
        <div><dt>Characters sent to Jev</dt><dd className="font-mono text-foreground">{result.usage.characters.toLocaleString()}</dd></div>
        <div><dt>Actual returned token usage</dt><dd className="font-mono text-foreground">{result.usage.inputTokens !== undefined || result.usage.outputTokens !== undefined ? `${result.usage.inputTokens ?? "—"} in · ${result.usage.outputTokens ?? "—"} out` : "not returned"}</dd></div>
        <div><dt>Measured timings</dt><dd className="font-mono text-foreground">ReplyNodes {result.timeline.scrapeMs} ms · extract {result.timeline.extractMs} ms · Jev {result.timeline.jevMs} ms · total {result.timeline.totalMs} ms</dd></div>
      </dl>
      <button type="button" onClick={() => setShowMarkdown(!showMarkdown)} className="mt-4 flex min-h-11 w-full items-center justify-between rounded-lg border p-3 text-left text-sm">
        <span>{contextLabel}{result.scrape.markdownTruncated ? " · context truncated" : ""}</span>
        <ChevronDown className={`size-4 transition-transform ${showMarkdown ? "rotate-180" : ""}`} />
      </button>
      {showMarkdown && <pre className="mt-3 max-h-96 overflow-auto rounded-lg bg-muted p-4 text-xs leading-6 whitespace-pre-wrap">{result.scrape.markdownPreview}</pre>}
    </details>
  );
}

export function WhyBuild() {
  return (
    <section className="rounded-xl border border-dashed bg-card p-4 md:p-5">
      <h3 className="text-sm font-medium">Why did we build this?</h3>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">Founders struggle to see their site like first-time visitors. ReplyNodes retrieves and converts live website content to clean context, and Jev makes structured probabilistic judgments. This is not an SEO score, objective company or product rating, AI detector, replacement for customer research, or definitive SaaS score.</p>
      <p className="mt-4 overflow-x-auto whitespace-nowrap rounded-lg bg-muted px-3 py-3 font-mono text-xs">Your website → ReplyNodes (live web → clean context) → Jev (structured judgments) → Founder teardown</p>
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <a className="underline underline-offset-4" href="https://replynodes.com/" target="_blank" rel="noreferrer">Build with ReplyNodes</a>
        <a className="underline underline-offset-4" href="https://github.com/replynodes/jev-web-analyzer" target="_blank" rel="noreferrer">View source on GitHub</a>
        <span className="text-xs text-muted-foreground">Unofficial community project, not affiliated with TypeSafe AI.</span>
      </div>
    </section>
  );
}

export function ResultScorecard({ result, showMarkdown, setShowMarkdown }: { result: AnalysisResponse; showMarkdown: boolean; setShowMarkdown: (value: boolean) => void }) {
  return (
    <div className="mt-6 space-y-4 animate-fade-in">
      <div className="grid gap-4 lg:grid-cols-3 lg:items-start">
        {FOUNDER_SECTIONS.map((section) => (
          <section key={section.key} aria-labelledby={`${section.key}-heading`} className="rounded-xl border bg-card p-3 md:p-4">
            <h3 id={`${section.key}-heading`} className="text-sm font-medium">{section.title}</h3>
            <div className="mt-3 grid gap-2.5">
              {answersForSection(result.classifications, section.answers).map((answer) => <FounderCard key={answer.name} answer={answer} />)}
            </div>
          </section>
        ))}
      </div>
      {result.judgments.length > 0 && (
        <section className="rounded-xl border border-dashed p-4 md:p-5">
          <h3 className="text-sm font-medium">Custom judgments</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {result.judgments.map((answer) => <ClassificationCard key={answer.name} answer={answer} custom />)}
          </div>
        </section>
      )}
      <TechnicalDetails result={result} showMarkdown={showMarkdown} setShowMarkdown={setShowMarkdown} />
      <WhyBuild />
    </div>
  );
}
