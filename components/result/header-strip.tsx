import Link from "next/link";
import { ProvenanceTag } from "./provenance-tag";

function hostname(url: string): string {
  try {
    return new URL(url).hostname || url;
  } catch {
    return url;
  }
}

export function ResultHeaderStrip({
  url,
  startedAt,
  editHref,
  pending = false,
}: {
  url: string;
  startedAt?: string;
  editHref: string;
  pending?: boolean;
}) {
  const host = hostname(url);
  const date = startedAt ? new Date(startedAt).toLocaleString() : undefined;

  return (
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div className="min-w-0">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Analysis result</p>
        {pending ? (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <ProvenanceTag kind="run" />
            <h1 className="truncate text-xl font-semibold tracking-tight">Homepage analysis</h1>
          </div>
        ) : (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <ProvenanceTag kind="run" />
            <h1 className="truncate text-xl font-semibold tracking-tight">{host || "Untitled analysis"}</h1>
          </div>
        )}
        {pending ? (
          <div className="mt-1 h-4 w-56 animate-pulse rounded bg-muted" aria-hidden="true" />
        ) : (
          <p className="mt-1 break-words text-sm text-muted-foreground">
            {url || "Homepage result"}
            {date ? ` · ${date}` : ""}
          </p>
        )}
      </div>
      <Link
        href={editHref}
        className="inline-flex min-h-11 shrink-0 items-center text-sm underline underline-offset-4 hover:text-foreground"
      >
        Analyze another URL
      </Link>
    </div>
  );
}
