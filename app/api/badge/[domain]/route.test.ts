import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("GET /api/badge/[domain]", () => {
  it("returns HTTP 200 with a scored badge for a known domain, since shields.io discards the body on non-200 responses", async () => {
    const response = await GET(new Request("http://test/api/badge/shipfa.st"), { params: Promise.resolve({ domain: "shipfa.st" }) });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ schemaVersion: 1, label: "jev score", message: "47/100", color: "yellow" });
  });

  it("still returns HTTP 200 (not 404) with isError:true for an unknown domain, so shields.io renders the custom message instead of its own generic error badge", async () => {
    const response = await GET(new Request("http://test/api/badge/not-in-dataset.example"), { params: Promise.resolve({ domain: "not-in-dataset.example" }) });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ schemaVersion: 1, label: "jev score", message: "not analyzed", color: "lightgrey", isError: true });
  });
});
