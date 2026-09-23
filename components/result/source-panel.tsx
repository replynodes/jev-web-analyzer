import type { AnalysisResponse } from "@/lib/contracts";
import { ProvenanceTag } from "./provenance-tag";

export function SourcePanel({ scrape }: { scrape: AnalysisResponse["scrape"] }) {
  return (
    <details className="mt-4 rounded-xl border bg-card p-4">
      <summary className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-medium">
        Source · Homepage Markdown <ProvenanceTag kind="run" />
      </summary>
      {scrape.markdownPreview ? (
        <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-muted p-4 font-mono text-xs leading-5">
          {scrape.markdownPreview}
        </pre>
      ) : (
        <p className="mt-3 text-sm italic text-muted-foreground">No supporting line available</p>
      )}
      <p className="mt-2 text-[11px] text-muted-foreground">
        scrape.markdownPreview · {scrape.markdownCharacters.toLocaleString()} characters captured · markdownTruncated:{" "}
        {String(scrape.markdownTruncated)}
      </p>
    </details>
  );
}
