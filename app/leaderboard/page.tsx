import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table";
import { formatRunDate, loadLeaderboard, scoreQuestionMeta } from "@/lib/leaderboard";
import { loadRubric } from "@/lib/rubric";

export const metadata: Metadata = {
  title: "Leaderboard · Jev Web Analyzer · ReplyNodes",
  description: "How well do SaaS and dev-tool homepages communicate to a first-time visitor, judged by Jev against a fixed, published rubric.",
};

export default function LeaderboardPage() {
  let dataset;
  try {
    dataset = loadLeaderboard();
  } catch {
    dataset = null;
  }

  if (!dataset) {
    return (
      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10">
        <SiteHeader crumb="Leaderboard" />
        <p className="text-muted-foreground">No leaderboard data has been generated yet. Run <code className="rounded bg-muted px-1 py-0.5">pnpm run batch</code> to produce one.</p>
      </main>
    );
  }

  const rubric = loadRubric();
  const scoreQuestions = scoreQuestionMeta(rubric);
  const okRows = dataset.rows.filter((row) => row.status === "ok");
  const failedCount = dataset.rows.length - okRows.length;

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10">
      <SiteHeader crumb="Leaderboard" />

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Jev homepage leaderboard</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          How clearly each homepage communicates to a first-time visitor, judged by Jev against a fixed rubric. Not a measure of product or company quality — see{" "}
          <a href="https://github.com/replynodes/jev-web-analyzer/blob/main/METHODOLOGY.md" target="_blank" rel="noreferrer" className="underline underline-offset-2">the methodology</a>.
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>Rubric version <b className="font-mono text-foreground">{dataset.rubric_version}</b></span>
          <span>Run date <b className="text-foreground">{formatRunDate(dataset.generated_at)}</b></span>
          <a href="https://github.com/replynodes/jev-web-analyzer/blob/main/METHODOLOGY.md" target="_blank" rel="noreferrer" className="underline underline-offset-2">Methodology</a>
        </div>
      </div>

      {dataset.sample ? (
        <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          This is a small sample dataset for demonstration — not real Jev output. Run the batch script to generate real results.
        </div>
      ) : null}

      <LeaderboardTable rows={okRows} scoreQuestions={scoreQuestions} />

      {failedCount > 0 ? (
        <p className="text-xs text-muted-foreground">{failedCount} domain{failedCount === 1 ? "" : "s"} failed to analyze in this run and {failedCount === 1 ? "is" : "are"} excluded from the table above.</p>
      ) : null}
    </main>
  );
}
