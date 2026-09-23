"use client";

import Link from "next/link";
import { AlertCircle, RotateCw } from "lucide-react";
import type { TraceState } from "@/lib/analysis-trace";
import { Button } from "@/components/ui/button";
import { ProvenanceTag } from "./provenance-tag";

export function FailureRetry({
  error,
  trace,
  onRetry,
  editHref,
}: {
  error: string;
  trace: TraceState;
  onRetry: () => void;
  editHref: string;
}) {
  const fetched = typeof trace.metrics.status === "number";
  const title = fetched ? "Jev didn't return a result" : "Site unreachable";
  const detail = fetched
    ? "The homepage was fetched, but the classification step returned nothing. This is retryable."
    : "The homepage could not be fetched. Check the URL and retry manually.";
  const requestId = trace.result?.scrape.requestId;

  return (
    <section
      role="alert"
      className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4"
    >
      <div className="flex flex-wrap items-center gap-2">
        <ProvenanceTag kind="run" />
        <AlertCircle className="size-4 text-destructive" />
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{detail}</p>
      <p className="mt-1 text-sm text-destructive">{error || "The analysis could not be completed."}</p>
      <p className="mt-2 break-words font-mono text-xs text-muted-foreground">
        Request ID: {requestId ?? "Request ID not returned"}
      </p>
      <p className="mt-1 font-mono text-xs text-muted-foreground">
        Fetch status: {fetched ? trace.metrics.status : "not returned"}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button type="button" onClick={onRetry}>
          <RotateCw /> Retry analysis
        </Button>
        <Link href={editHref} className="inline-flex min-h-11 items-center text-sm underline underline-offset-4">
          Edit and retry
        </Link>
      </div>
    </section>
  );
}
