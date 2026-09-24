import { NextResponse } from "next/server";
import { loadLeaderboard, scoreBand } from "@/lib/leaderboard";

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

  let row;
  try {
    row = loadLeaderboard().rows.find((candidate) => candidate.domain === domain);
  } catch {
    row = undefined;
  }

  if (!row || row.status !== "ok" || row.overall === undefined) {
    const body: ShieldsEndpoint = {
      schemaVersion: 1,
      label: "jev score",
      message: "not analyzed",
      color: "lightgrey",
      isError: true,
    };
    return NextResponse.json(body, { status: 404 });
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
