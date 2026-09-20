"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResultScorecard } from "@/components/result-scorecard";
import { SiteHeader } from "@/components/site-header";
import { Trace } from "@/components/trace-panel";
import { founderSynthesis } from "@/lib/founder-summary";
import { useAnalysis } from "@/lib/hooks/use-analysis";
import { inputPath, safeInitialUrl, withAnalyzedUrl } from "@/lib/query-url";
import { readSessionJudgments } from "@/lib/session-judgments";

export function ResultPage() {
  const [status, setStatus] = useState<"checking" | "invalid" | "ready">("checking");
  const [requestedUrl, setRequestedUrl] = useState("");
  const [showMarkdown, setShowMarkdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const { result, error, loading, trace, run, abort } = useAnalysis();
  const startedForRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const safe = safeInitialUrl(params.get("url"));
    setRequestedUrl(safe);
    setStatus(safe ? "ready" : "invalid");
  }, []);

  useEffect(() => {
    if (status !== "ready" || !requestedUrl || startedForRef.current === requestedUrl) return;
    startedForRef.current = requestedUrl;
    const judgments = readSessionJudgments(requestedUrl);
    void run(requestedUrl, judgments).then((completed) => {
      if (completed?.url) window.history.replaceState(null, "", withAnalyzedUrl(window.location.href, completed.url));
    });
    return () => abort();
  }, [status, requestedUrl, run, abort]);

  async function copyLink() {
    await navigator.clipboard?.writeText(withAnalyzedUrl(window.location.href, result?.url ?? requestedUrl));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  const displayedUrl = result?.url ?? requestedUrl;
  const synthesis = result ? founderSynthesis(result.classifications) : "";
  const editHref = inputPath(displayedUrl || undefined);

  return (
    <main className="min-h-screen overflow-x-hidden px-4 py-5 md:px-8">
      <SiteHeader crumb="jev web analyzer / result" />
      <section className="mx-auto max-w-6xl pb-16 pt-10 md:pt-14">
        <Link href={editHref} className="inline-flex min-h-11 items-center text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">← Analyze another site</Link>

        {status === "invalid" && (
          <div role="alert" className="mt-6 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            <span>No URL to analyze. Go back and enter a public SaaS URL.</span>
          </div>
        )}

        {status === "ready" && (
          <>
            <div className="mt-6 flex flex-col justify-between gap-3 md:flex-row md:items-end">
              <div className="min-w-0">
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Analysis result</p>
                <h1 className="mt-2 text-2xl font-light">What Jev thinks about your SaaS</h1>
                <p className="mt-2 break-words text-sm text-muted-foreground">{displayedUrl}</p>
                {synthesis && <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">{synthesis}</p>}
              </div>
              {result && <Button variant="outline" size="sm" onClick={() => void copyLink()}><Copy />{copied ? "Copied" : "Copy result link"}</Button>}
            </div>

            {(loading || trace.result) && <Trace trace={trace} />}

            {error && (
              <div role="alert" className="mt-6 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                <AlertCircle className="size-4 shrink-0" />
                <span>{error}</span>
                <Link href={editHref} className="ml-auto shrink-0 min-h-11 flex items-center underline underline-offset-4">Edit and retry</Link>
              </div>
            )}

            {result && <ResultScorecard result={result} showMarkdown={showMarkdown} setShowMarkdown={setShowMarkdown} />}
          </>
        )}
      </section>
    </main>
  );
}
