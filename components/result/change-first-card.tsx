import { isLowConfidence } from "@/lib/confidence";
import type { AnalysisResponse } from "@/lib/contracts";
import { cn } from "@/lib/utils";
import { ProvenanceTag } from "./provenance-tag";
import { ConclusionBlock, ConfidenceBadge, DistributionDisclosure } from "./signal-parts";

export function ChangeFirstCard({ classification }: { classification: AnalysisResponse["classifications"][number] }) {
  const low = isLowConfidence(classification.confidence);
  return (
    <article className={cn("rounded-xl border bg-card p-5 shadow-sm", low && "border-[#eccb92] dark:border-[#6b4d1c]")}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col items-start gap-2">
          <ProvenanceTag kind="jev" />
          <h3 className="text-sm font-semibold">Change first</h3>
        </div>
        <ConfidenceBadge confidence={classification.confidence} />
      </div>
      <span
        className={cn(
          "mt-3 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide",
          low
            ? "border-[#eccb92] bg-[#fdf3e3] text-[#b45309] dark:border-[#6b4d1c] dark:bg-[#3a2a10] dark:text-[#fbbf24]"
            : "border-border bg-muted text-muted-foreground",
        )}
      >
        {low ? "Tentative suggestion · Jev is not confident" : "Returned classification"}
      </span>
      <div className="mt-3">
        <ConclusionBlock classification={classification} />
        <DistributionDisclosure probabilities={classification.probabilities} />
      </div>
    </article>
  );
}
