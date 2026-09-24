import { ImageResponse } from "next/og";
import { labelForQuestionId, loadLeaderboardData, scoreBand } from "@/lib/leaderboard";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Jev leaderboard score";

export default async function Image({ params }: { params: { domain: string } }) {
  const { domain } = params;
  const data = loadLeaderboardData();
  const row = data?.dataset.rows.find((candidate) => candidate.domain === domain);

  if (!data || !row || row.status !== "ok" || row.overall === undefined) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%", height: "100%", display: "flex", flexDirection: "column",
            justifyContent: "center", padding: "80px", backgroundColor: "#0b0b0b", color: "#fafafa", fontFamily: "sans-serif",
          }}
        >
          <div style={{ display: "flex", fontSize: 56, fontWeight: 800 }}>{domain}</div>
          <div style={{ display: "flex", fontSize: 30, marginTop: 20, color: "#a1a1aa" }}>Not yet analyzed by Jev</div>
        </div>
      ),
      { ...size },
    );
  }

  const { rubric } = data;
  const band = scoreBand(row.overall);
  const bars = rubric.score_question_ids
    .filter((id) => row.answers[id]?.type === "score")
    .map((id) => ({ id, label: labelForQuestionId(id), value: row.answers[id].value as number }));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column",
          padding: "72px", backgroundColor: "#0b0b0b", color: "#fafafa", fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", fontSize: 42, fontWeight: 700 }}>{domain}</div>
          <div style={{ display: "flex", fontSize: 24, color: "#a1a1aa" }}>Jev Leaderboard</div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", gap: 24, marginTop: 28 }}>
          <div style={{ display: "flex", fontSize: 220, fontWeight: 800, lineHeight: 1, color: band.hex }}>
            {row.overall}
          </div>
          <div style={{ display: "flex", fontSize: 40, color: "#a1a1aa", marginBottom: 24 }}>/ 100</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 20 }}>
          {bars.map((bar) => (
            <div key={bar.id} style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ display: "flex", width: 220, fontSize: 22, color: "#d4d4d8" }}>{bar.label}</div>
              <div style={{ display: "flex", flex: 1, height: 18, backgroundColor: "#27272a", borderRadius: 9 }}>
                <div style={{ display: "flex", width: `${(bar.value / 4) * 100}%`, height: "100%", backgroundColor: band.hex, borderRadius: 9 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
