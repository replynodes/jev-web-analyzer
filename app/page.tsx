import { Analyzer } from "@/components/analyzer";
import { loadLeaderboardData } from "@/lib/leaderboard";

const PREVIEW_COUNT = 5;

export default function Page() {
  const data = loadLeaderboardData();
  const preview = data
    ? [...data.dataset.rows]
        .filter((row) => row.status === "ok" && row.overall !== undefined)
        .sort((a, b) => (b.overall ?? 0) - (a.overall ?? 0))
        .slice(0, PREVIEW_COUNT)
    : [];
  return <Analyzer leaderboardPreview={preview} />;
}
