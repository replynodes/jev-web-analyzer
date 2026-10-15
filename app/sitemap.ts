import type { MetadataRoute } from "next";
import { loadLeaderboardData } from "@/lib/leaderboard";
import { SITE_URL } from "@/lib/leaderboard-format";

export default function sitemap(): MetadataRoute.Sitemap {
  const domains = loadLeaderboardData()?.dataset.rows.map((row) => row.domain) ?? [];

  return [
    { url: SITE_URL },
    { url: `${SITE_URL}/leaderboard` },
    ...domains.map((domain) => ({ url: `${SITE_URL}/leaderboard/${domain}` })),
  ];
}
