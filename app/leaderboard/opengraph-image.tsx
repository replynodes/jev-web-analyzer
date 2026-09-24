import { ImageResponse } from "next/og";
import { loadLeaderboard } from "@/lib/leaderboard";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Jev homepage leaderboard";

export default async function Image() {
  let domainCount = 0;
  let rubricVersion = "v1";
  try {
    const dataset = loadLeaderboard();
    domainCount = dataset.rows.filter((row) => row.status === "ok").length;
    rubricVersion = dataset.rubric_version;
  } catch {
    // no dataset yet; render the image with zero-count copy below
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          backgroundColor: "#0b0b0b",
          color: "#fafafa",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", width: 28, height: 28, borderRadius: 8, backgroundColor: "#A2D98A" }} />
          <div style={{ display: "flex", fontSize: 28, fontWeight: 700, color: "#a1a1aa" }}>ReplyNodes</div>
        </div>
        <div style={{ display: "flex", fontSize: 84, fontWeight: 800, marginTop: 36, letterSpacing: -2 }}>
          Jev Leaderboard
        </div>
        <div style={{ display: "flex", fontSize: 34, marginTop: 20, color: "#d4d4d8", maxWidth: 900 }}>
          How clearly do homepages communicate to a first-time visitor?
        </div>
        <div style={{ display: "flex", gap: 40, marginTop: 56 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 56, fontWeight: 800 }}>{domainCount}</div>
            <div style={{ display: "flex", fontSize: 24, color: "#a1a1aa" }}>domains scored</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 56, fontWeight: 800 }}>{rubricVersion}</div>
            <div style={{ display: "flex", fontSize: 24, color: "#a1a1aa" }}>rubric version</div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
