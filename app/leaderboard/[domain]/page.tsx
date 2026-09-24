import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfidenceBadge } from "@/components/result/signal-parts";
import { SiteHeader } from "@/components/site-header";
import { isLowConfidence } from "@/lib/confidence";
import type { LeaderboardData } from "@/lib/leaderboard";
import { badgeMarkdown, formatRunDate, labelForQuestionId, loadLeaderboardData, matchedLevelDescription, pricingLabel, scoreBand } from "@/lib/leaderboard";
import { cn } from "@/lib/utils";

function findRow(data: LeaderboardData | null, domain: string) {
  return data?.dataset.rows.find((row) => row.domain === domain);
}

export function generateStaticParams() {
  return loadLeaderboardData()?.dataset.rows.map((row) => ({ domain: row.domain })) ?? [];
}

export async function generateMetadata({ params }: { params: Promise<{ domain: string }> }): Promise<Metadata> {
  const { domain } = await params;
  const row = findRow(loadLeaderboardData(), domain);
  if (!row || row.status !== "ok") return { title: `${domain} · Jev leaderboard · ReplyNodes` };
  return {
    title: `${domain} — ${row.overall}/100 · Jev leaderboard · ReplyNodes`,
    description: `How clearly ${domain}'s homepage communicates to a first-time visitor, judged by Jev against a fixed rubric.`,
  };
}

export default async function LeaderboardDomainPage({ params }: { params: Promise<{ domain: string }> }) {
  const { domain } = await params;
  const data = loadLeaderboardData();
  const row = findRow(data, domain);
  if (!data || !row) notFound();

  const { dataset, rubric } = data;
  const band = row.overall === undefined ? undefined : scoreBand(row.overall);
  // A row scored under a different rubric_version than the one currently
  // loaded would show level text that never actually applied to that
  // judgment (rubric text can change between versions) — skip the matched
  // description rather than risk showing the wrong one.
  const rubricMatchesRow = row.rubric_version === rubric.rubric_version;

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10">
      <SiteHeader crumb={domain} />

      <div className="flex flex-col gap-2">
        <Link href="/leaderboard" className="text-sm text-muted-foreground underline underline-offset-2">← Back to leaderboard</Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{domain}</h1>
          {row.status === "ok" && row.overall !== undefined ? (
            <span
              className="inline-flex min-w-12 items-center justify-center rounded-full px-3 py-1 text-sm font-bold text-white"
              style={{ backgroundColor: band?.hex }}
            >
              {row.overall}/100
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>Rubric version <b className="font-mono text-foreground">{row.rubric_version}</b></span>
          <span>Analyzed <b className="text-foreground">{formatRunDate(row.fetched_at)}</b></span>
          {row.final_url ? (
            <a href={row.final_url} target="_blank" rel="noreferrer" className="underline underline-offset-2">{row.final_url}</a>
          ) : null}
        </div>
      </div>

      {dataset.sample ? (
        <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          This is sample data for demonstration — not a real Jev run.
        </div>
      ) : null}

      {row.status !== "ok" ? (
        <div className="rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">
          This domain could not be analyzed in this run (<code className="font-mono">{row.status}</code>
          {row.error_code ? <>, <code className="font-mono">{row.error_code}</code></> : null}). No scores are available.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {rubric.score_question_ids.map((id) => {
            const answer = row.answers[id];
            const question = rubric.questions[id];
            if (!answer || answer.type !== "score" || !question) return null;
            const description = rubricMatchesRow ? matchedLevelDescription(question, answer) : undefined;
            const low = isLowConfidence(answer.confidence);
            return (
              <article key={id} className={cn("rounded-xl border bg-card p-4 shadow-sm", low && "border-[#eccb92] dark:border-[#6b4d1c]")}>
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-sm font-semibold">{labelForQuestionId(id)}</h2>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border bg-muted px-2 py-0.5 text-xs font-bold tabular-nums">{answer.value.toFixed(1)} / 4</span>
                    <ConfidenceBadge confidence={answer.confidence} />
                  </div>
                </div>
                {description ? <p className="mt-2 text-sm text-muted-foreground">{description}</p> : null}
              </article>
            );
          })}

          {row.answers.pricing_visibility ? (
            <article className={cn("rounded-xl border bg-card p-4 shadow-sm", isLowConfidence(row.answers.pricing_visibility.confidence) && "border-[#eccb92] dark:border-[#6b4d1c]")}>
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-sm font-semibold">Pricing visibility</h2>
                <ConfidenceBadge confidence={row.answers.pricing_visibility.confidence} />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{pricingLabel(String(row.answers.pricing_visibility.value))} — reported as a category, not part of the score.</p>
            </article>
          ) : null}
        </div>
      )}

      <article className="rounded-xl border border-dashed p-4 text-xs text-muted-foreground">
        <h2 className="mb-2 text-sm font-semibold text-foreground">Run evidence</h2>
        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div><dt>Scrape</dt><dd className="font-mono text-foreground">{row.scrape_ms ?? "—"} ms</dd></div>
          <div><dt>Jev</dt><dd className="font-mono text-foreground">{row.jev_ms ?? "—"} ms</dd></div>
          <div><dt>Total</dt><dd className="font-mono text-foreground">{row.total_ms ?? "—"} ms</dd></div>
          <div><dt>ReplyNodes request</dt><dd className="truncate font-mono text-foreground">{row.request_id ?? "—"}</dd></div>
        </dl>
      </article>

      {row.status === "ok" ? (
        <article className="rounded-xl border p-4">
          <h2 className="mb-2 text-sm font-semibold">Add this badge to your README</h2>
          <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs"><code>{badgeMarkdown(domain)}</code></pre>
        </article>
      ) : null}
    </main>
  );
}
