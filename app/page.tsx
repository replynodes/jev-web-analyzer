import { Analyzer } from "@/components/analyzer";
import { loadLeaderboardData } from "@/lib/leaderboard";
import { SITE_URL } from "@/lib/leaderboard-format";
import type { Metadata } from "next";

const PREVIEW_COUNT = 5;

export const metadata: Metadata = {
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    url: SITE_URL,
  },
};

const softwareApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Jev Web Analyzer",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: SITE_URL,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  publisher: {
    "@type": "Organization",
    name: "ReplyNodes",
    url: "https://replynodes.com",
  },
};

export default function Page() {
  const data = loadLeaderboardData();
  const preview = data
    ? [...data.dataset.rows]
        .filter((row) => row.status === "ok" && row.overall !== undefined)
        .sort((a, b) => (b.overall ?? 0) - (a.overall ?? 0))
        .slice(0, PREVIEW_COUNT)
    : [];
  return (
    <>
      <Analyzer leaderboardPreview={preview} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationJsonLd) }}
      />
    </>
  );
}
