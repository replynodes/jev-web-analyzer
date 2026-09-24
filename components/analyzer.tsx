"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LoaderCircle, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteHeader } from "@/components/site-header";
import type { LeaderboardRow } from "@/lib/csv";
import { EXAMPLE_DOMAINS, exampleDomainUrl } from "@/lib/example-domains";
import { MAX_JUDGMENTS, type Judgment } from "@/lib/judgment";
import { scoreBand } from "@/lib/leaderboard-format";
import { resultPath, safeInitialUrl } from "@/lib/query-url";
import { saveSessionJudgments } from "@/lib/session-judgments";

export function Analyzer({ leaderboardPreview = [] }: { leaderboardPreview?: LeaderboardRow[] }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [judgments, setJudgments] = useState<Judgment[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const urlInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setUrl(safeInitialUrl(new URLSearchParams(window.location.search).get("url"))); }, []);

  function fillExample(domain: string) {
    setUrl(exampleDomainUrl(domain));
    urlInputRef.current?.focus();
  }

  function update(index: number, patch: Partial<Judgment>) {
    setJudgments((items) => items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function submit() {
    const trimmed = url.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    const target = safeInitialUrl(trimmed) || trimmed;
    saveSessionJudgments(target, judgments);
    router.push(resultPath(target));
  }

  return (
    <main className="min-h-screen overflow-x-hidden px-4 py-5 md:px-8">
      <SiteHeader crumb="jev web analyzer" />
      <section className="mx-auto max-w-5xl pb-16 pt-16 md:pt-24">
        <div className="max-w-3xl">
          <p className="mb-5 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Jev Web Analyzer</p>
          <h1 className="text-4xl font-light tracking-tight md:text-6xl">Paste your homepage. See what Jev reads.</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">ReplyNodes turns the page into clean Markdown. Jev judges what it communicates to a first-time visitor.</p>
        </div>
        <div className="mt-10 rounded-2xl border bg-card p-3 shadow-border-medium md:p-4">
          <form onSubmit={(event) => { event.preventDefault(); submit(); }} className="flex flex-col gap-3 md:flex-row">
            <Input ref={urlInputRef} aria-label="Public URL" type="url" required value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://yourproduct.com" className="h-12 min-w-0 flex-1 border-0 bg-transparent text-base shadow-none focus-visible:ring-0" />
            <Button type="submit" disabled={submitting || !url.trim()} className="h-12 rounded-xl px-6">
              {submitting ? <LoaderCircle className="animate-spin" /> : null}
              {submitting ? "Opening" : "Analyze →"}
            </Button>
          </form>
        </div>
        <LeaderboardPreview rows={leaderboardPreview} />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Try:</span>
          {EXAMPLE_DOMAINS.map((domain) => (
            <button key={domain} type="button" onClick={() => fillExample(domain)} className="flex min-h-11 items-center rounded-full border px-3 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
              {domain}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">No signup. Uses your public website only.</p>
        <CustomJudgments judgments={judgments} setJudgments={setJudgments} update={update} />
        <footer className="mt-16 flex flex-col gap-2 border-t pt-5 text-xs text-muted-foreground md:flex-row md:justify-between">
          <span>Fetched with ReplyNodes · Jev via Vercel AI Gateway</span>
          <span>Unofficial community project, not affiliated with TypeSafe AI.</span>
        </footer>
      </section>
    </main>
  );
}

function LeaderboardPreview({ rows }: { rows: LeaderboardRow[] }) {
  if (!rows.length) return null;
  return (
    <div className="mt-6 rounded-2xl border bg-card p-4 shadow-border-small">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Jev leaderboard</p>
          <p className="mt-0.5 text-xs text-muted-foreground">How other homepages score against the same rubric.</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/leaderboard">See more →</Link>
        </Button>
      </div>
      <ul className="mt-3 divide-y">
        {rows.map((row) => {
          if (row.overall === undefined) return null;
          return (
            <li key={row.domain}>
              <Link href={`/leaderboard/${row.domain}`} className="flex items-center justify-between gap-3 py-2 hover:opacity-80">
                <span className="truncate text-sm">{row.domain}</span>
                <span
                  className="inline-flex min-w-10 shrink-0 items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold text-white"
                  style={{ backgroundColor: scoreBand(row.overall).hex }}
                >
                  {row.overall}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function CustomJudgments({ judgments, setJudgments, update }: { judgments: Judgment[]; setJudgments: (items: Judgment[]) => void; update: (index: number, patch: Partial<Judgment>) => void }) {
  return (
    <div className="mt-5 rounded-xl border border-dashed p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Optional custom judgments</p>
          <p className="mt-1 text-xs text-muted-foreground">Add up to three Boolean, Choice, or Score questions.</p>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={() => judgments.length < MAX_JUDGMENTS && setJudgments([...judgments, { name: `custom_${judgments.length + 1}`, type: "boolean", instructions: "", criteria: "" }])} disabled={judgments.length >= MAX_JUDGMENTS}>
          <Plus /> Add
        </Button>
      </div>
      {judgments.map((judgment, index) => (
        <div key={index} className="mt-4 grid gap-2 rounded-lg bg-muted/50 p-3 md:grid-cols-[1fr_120px_2fr_2fr_auto]">
          <Input aria-label="Judgment name" value={judgment.name} onChange={(event) => update(index, { name: event.target.value })} placeholder="name" />
          <select aria-label="Judgment type" className="h-9 rounded-md border bg-background px-2 text-sm" value={judgment.type} onChange={(event) => update(index, { type: event.target.value as Judgment["type"] })}>
            <option value="boolean">Boolean</option>
            <option value="choice">Choice</option>
            <option value="score">Score</option>
          </select>
          <Input aria-label="Judgment instructions" value={judgment.instructions} onChange={(event) => update(index, { instructions: event.target.value })} placeholder="What should Jev judge?" />
          <Input aria-label="Judgment criteria" value={judgment.criteria} onChange={(event) => update(index, { criteria: event.target.value })} placeholder={judgment.type === "choice" ? "key: description, one per line" : judgment.type === "score" ? "one level per line" : "criteria optional"} />
          <Button type="button" variant="ghost" size="icon" aria-label="Remove judgment" onClick={() => setJudgments(judgments.filter((_, i) => i !== index))}>
            <Trash2 />
          </Button>
        </div>
      ))}
    </div>
  );
}
