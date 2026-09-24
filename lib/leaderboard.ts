import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import type { LeaderboardRow } from "./csv";
import { loadRubric, type RubricFile } from "./rubric";

const DATA_DIR = path.join(process.cwd(), "data");
const LEADERBOARD_FILE_PATTERN = /^leaderboard-(\d{4}-\d{2})\.json$/;

export type LeaderboardDataset = {
  generated_at: string;
  rubric_version: string;
  /** Present and true only on hand-authored fixture data, never on real scripts/batch.ts output. */
  sample?: boolean;
  rows: LeaderboardRow[];
};

function latestLeaderboardFile(dir: string): { filePath: string; month: string } | null {
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

export type LeaderboardData = { dataset: LeaderboardDataset; rubric: RubricFile };

// The dataset and rubric are static per deployment (they only change via a
// redeploy after a new `pnpm run batch` run), so caching for the life of the
// server process is safe. Skipped in development so editing the fixture data
// locally is picked up without restarting the dev server.
let cached: LeaderboardData | null | undefined;

/**
 * Single safe entry point for every leaderboard page/route: loads the
 * dataset and rubric together, caches the result, and never throws — callers
 * get `null` for "no data yet" or "rubric invalid" instead of having to
 * individually try/catch loadLeaderboard()/loadRubric() at every call site.
 */
export function loadLeaderboardData(overrides?: { dataDir?: string; rubricPath?: string }): LeaderboardData | null {
  const usesDefaults = !overrides?.dataDir && !overrides?.rubricPath;
  if (usesDefaults && process.env.NODE_ENV === "production" && cached !== undefined) return cached;
  let result: LeaderboardData | null;
  try {
    const dataset = loadLeaderboard(overrides?.dataDir);
    const rubric = loadRubric(overrides?.rubricPath);
    result = { dataset, rubric };
  } catch {
    result = null;
  }
  if (usesDefaults) cached = result;
  return result;
}

export * from "./leaderboard-format";
