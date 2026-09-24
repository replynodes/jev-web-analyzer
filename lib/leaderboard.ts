import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import type { LeaderboardRow } from "./csv";

const DATA_DIR = path.join(process.cwd(), "data");
const LEADERBOARD_FILE_PATTERN = /^leaderboard-(\d{4}-\d{2})\.json$/;

export type LeaderboardDataset = {
  generated_at: string;
  rubric_version: string;
  /** Present and true only on hand-authored fixture data, never on real scripts/batch.ts output. */
  sample?: boolean;
  rows: LeaderboardRow[];
};

export function latestLeaderboardFile(dir: string = DATA_DIR): { filePath: string; month: string } | null {
  let entries: string[];
  try {
    entries = readdirSync(dir).filter((name) => LEADERBOARD_FILE_PATTERN.test(name));
  } catch {
    return null;
  }
  if (!entries.length) return null;
  entries.sort();
  const latest = entries[entries.length - 1];
  const month = latest.match(LEADERBOARD_FILE_PATTERN)![1];
  return { filePath: path.join(dir, latest), month };
}

export function loadLeaderboard(dir: string = DATA_DIR): LeaderboardDataset {
  const found = latestLeaderboardFile(dir);
  if (!found) throw new Error("No data/leaderboard-<YYYY-MM>.json found. Run `pnpm run batch` first.");
  return JSON.parse(readFileSync(found.filePath, "utf8")) as LeaderboardDataset;
}

export * from "./leaderboard-format";
