import { NextResponse } from "next/server";
import { loadLeaderboardData, scoreBand } from "@/lib/leaderboard";

type ShieldsEndpoint = {
  schemaVersion: 1;
  label: string;
  message: string;
  color: string;
  isError?: boolean;
  cacheSeconds?: number;
};

export async function GET(_request: Request, { params }: { params: Promise<{ domain: string }> }) {
  const { domain } = await params;
  const row = loadLeaderboardData()?.dataset.rows.find((candidate) => candidate.domain === domain);

  if (!row || row.status !== "ok" || row.overall === undefined) {
    // shields.io's endpoint badge discards the response body for any non-200
    // status and renders its own generic error badge instead of reading
    // `isError`/`message` — so this must return 200 for the custom "not
    // analyzed" badge to actually render. isError:true is shields' own
    // documented mechanism for signaling an error state within a 200.
    const body: ShieldsEndpoint = {
      schemaVersion: 1,
      label: "jev score",
      message: "not analyzed",
      color: "lightgrey",
      isError: true,
    };
    return NextResponse.json(body);
  }

  const band = scoreBand(row.overall);
  const body: ShieldsEndpoint = {
    schemaVersion: 1,
    label: "jev score",
    message: `${row.overall}/100`,
    color: band.shieldsColor,
    cacheSeconds: 3600,
  };
  return NextResponse.json(body, { headers: { "cache-control": "public, max-age=3600" } });
}
