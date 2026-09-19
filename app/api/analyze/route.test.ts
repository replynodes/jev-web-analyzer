import { describe, expect, it } from "vitest";
import { safeError } from "@/lib/analyze-errors";
import { GET, POST } from "@/app/api/analyze/route";

describe("analyze route GET", () => {
  it("returns a method guidance response without analyzing", async () => {
    const response = GET();

    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("POST");
    expect(await response.json()).toEqual({ message: "Use POST /jev-web-analyzer/api/analyze to analyze a URL." });
  });
});

describe("analyze route errors", () => {
  it("keeps stream preflight status and exact transport headers", async () => {
    const response = await POST(new Request("https://example.test", { method: "POST", headers: { accept: "text/html, application/x-ndjson; charset=utf-8", "content-type": "application/json" }, body: JSON.stringify({ url: "https://example.com" }) }));
    expect(response.status).toBe(503);
    expect(response.headers.get("content-type")).toBe("application/x-ndjson; charset=utf-8");
    expect(response.headers.get("cache-control")).toBe("no-cache");
    expect(response.headers.get("x-accel-buffering")).toBe("no");
    expect(await response.text()).toContain('"type":"error"');
  });
  it("maps internal provider failures to a generic public error", () => {
    expect(safeError(new Error("provider included a secret"))).toEqual({ status: 502, code: "UPSTREAM_FAILED", message: "The analysis could not be completed. Please try again." });
  });
  it("keeps validation failures actionable without leaking internals", () => {
    expect(safeError(new Error("BLOCKED_URL")).status).toBe(400);
  });
});
