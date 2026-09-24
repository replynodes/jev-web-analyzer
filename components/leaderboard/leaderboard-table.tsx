"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { pricingLabel, scoreBand, type RubricQuestionMeta } from "@/lib/leaderboard-format";
import type { LeaderboardRow } from "@/lib/csv";
import { cn } from "@/lib/utils";

type SortKey = "overall" | string;
type SortDir = "asc" | "desc";

const PRICING_OPTIONS = ["visible_price", "freemium_or_free_trial", "contact_sales_only", "no_pricing_info"] as const;

function scoreValue(row: LeaderboardRow, questionId: string): number | undefined {
  const answer = row.answers[questionId];
  return answer?.type === "score" ? (answer.value as number) : undefined;
}

export function LeaderboardTable({ rows, scoreQuestions }: { rows: LeaderboardRow[]; scoreQuestions: RubricQuestionMeta[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("overall");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [pricingFilter, setPricingFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    const scoped = pricingFilter === "all" ? rows : rows.filter((row) => row.answers.pricing_visibility?.value === pricingFilter);
    const sorted = [...scoped].sort((a, b) => {
      const av = sortKey === "overall" ? (a.overall ?? -1) : (scoreValue(a, sortKey) ?? -1);
      const bv = sortKey === "overall" ? (b.overall ?? -1) : (scoreValue(b, sortKey) ?? -1);
      return sortDir === "desc" ? bv - av : av - bv;
    });
    return sorted;
  }, [rows, sortKey, sortDir, pricingFilter]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((dir) => (dir === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function sortIndicator(key: SortKey) {
    if (key !== sortKey) return null;
    return <span aria-hidden="true">{sortDir === "desc" ? " ↓" : " ↑"}</span>;
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          Pricing visibility
          <select
            value={pricingFilter}
            onChange={(event) => setPricingFilter(event.target.value)}
            className="h-9 rounded-md border border-input bg-transparent px-2 text-sm text-foreground shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <option value="all">All</option>
            {PRICING_OPTIONS.map((option) => (
              <option key={option} value={option}>{pricingLabel(option)}</option>
            ))}
          </select>
        </label>
        <span className="text-sm text-muted-foreground">{filtered.length} of {rows.length} domains</span>
      </div>

      <div className="overflow-x-auto rounded-xl border shadow-sm">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-3 py-2 font-semibold">Domain</th>
              <th className="px-3 py-2 font-semibold">
                <button type="button" onClick={() => toggleSort("overall")} className="inline-flex items-center hover:underline">
                  Overall{sortIndicator("overall")}
                </button>
              </th>
              {scoreQuestions.map((question) => (
                <th key={question.id} className="px-3 py-2 font-semibold">
                  <button type="button" onClick={() => toggleSort(question.id)} className="inline-flex items-center hover:underline">
                    {question.label}{sortIndicator(question.id)}
                  </button>
                </th>
              ))}
              <th className="px-3 py-2 font-semibold">Pricing</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => {
              const band = row.overall === undefined ? undefined : scoreBand(row.overall);
              return (
                <tr key={row.domain} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-3 py-2 font-medium">
                    <Link href={`/leaderboard/${row.domain}`} className="hover:underline">{row.domain}</Link>
                  </td>
                  <td className="px-3 py-2">
                    {row.overall === undefined ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <span
                        className="inline-flex min-w-10 items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold text-white"
                        style={{ backgroundColor: band?.hex }}
                      >
                        {row.overall}
                      </span>
                    )}
                  </td>
                  {scoreQuestions.map((question) => {
                    const value = scoreValue(row, question.id);
                    return (
                      <td key={question.id} className={cn("px-3 py-2 tabular-nums", value === undefined && "text-muted-foreground")}>
                        {value === undefined ? "—" : value.toFixed(1)}
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-muted-foreground">
                    {row.answers.pricing_visibility ? pricingLabel(String(row.answers.pricing_visibility.value)) : "—"}
                  </td>
                </tr>
              );
            })}
            {!filtered.length ? (
              <tr>
                <td colSpan={3 + scoreQuestions.length} className="px-3 py-6 text-center text-muted-foreground">
                  No domains match this filter.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
