import { customAnswerTitle, displayAnswerValue } from "@/lib/answer-display";
import { isLowConfidence } from "@/lib/confidence";
import type { AnalysisResponse } from "@/lib/contracts";
import { hasStatusChip, labelFor, statusForDisplay } from "@/lib/signal-map";
import { cn } from "@/lib/utils";
import { ProvenanceTag } from "./provenance-tag";
import { ConclusionBlock, ConfidenceBadge, DistributionDisclosure, StatusChip, type Classification } from "./signal-parts";

export function SignalCard({ classification, label }: { classification: Classification; label?: string }) {
  const low = isLowConfidence(classification.confidence);
  return (
    <article className={cn("rounded-xl border bg-card p-4 shadow-sm", low && "border-[#eccb92] dark:border-[#6b4d1c]")}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col items-start gap-2">
          <ProvenanceTag kind="jev" />
          <h3 className="text-sm font-semibold">{label ?? labelFor(classification.name)}</h3>
        </div>
        <ConfidenceBadge confidence={classification.confidence} />
      </div>
      <div className="mt-3">
        {hasStatusChip(classification.name) ? (
          <div className="mb-3">
            <StatusChip status={statusForDisplay(classification.name, String(classification.value))} />
          </div>
        ) : null}
        <ConclusionBlock classification={classification} />
        <DistributionDisclosure probabilities={classification.probabilities} />
      </div>
    </article>
  );
}

/**
 * Custom judgments are user-supplied questions, not part of the 10 founder
 * signals. They are collapsed by default so the page never reads like a
 * questionnaire.
 */
export function CustomJudgments({ judgments }: { judgments: AnalysisResponse["judgments"] }) {
  if (!judgments.length) return null;
  return (
    <details className="rounded-xl border border-dashed bg-card p-4">
      <summary className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-medium">
        <ProvenanceTag kind="jev" /> Your custom judgments ({judgments.length})
      </summary>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {judgments.map((judgment) => (
          <article key={judgment.name} className="rounded-lg border p-3">
            <h4 className="text-xs font-medium text-muted-foreground">{customAnswerTitle(judgment)}</h4>
            <p className="mt-1.5 text-base font-light">{displayAnswerValue(judgment)}</p>
          </article>
        ))}
      </div>
    </details>
  );
}
