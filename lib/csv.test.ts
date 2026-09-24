import { describe, expect, it } from "vitest";
import { rowsToLeaderboardCsv, type LeaderboardRow } from "./csv";

const questionIds = ["clarity_what_is_it", "pricing_visibility"];

describe("rowsToLeaderboardCsv", () => {
  it("writes the exact fixed header plus per-question value/probabilities columns", () => {
    const csv = rowsToLeaderboardCsv([], questionIds);
    expect(csv).toBe(
      "domain,final_url,status,error_code,fetched_at,request_id,markdown_sha256,markdown_length,scrape_ms,jev_ms,total_ms,rubric_version," +
      "clarity_what_is_it_value,clarity_what_is_it_probabilities,pricing_visibility_value,pricing_visibility_probabilities," +
      "overall,usage_input_tokens,usage_output_tokens,usage_total_tokens",
    );
  });

  it("flattens an ok row with answers, probabilities, and usage", () => {
    const row: LeaderboardRow = {
      domain: "example.com",
      final_url: "https://example.com/",
      rubric_version: "v1",
      status: "ok",
      fetched_at: "2026-09-01T00:00:00.000Z",
      request_id: "req-1",
      markdown_sha256: "abc123",
      markdown_length: 4200,
      scrape_ms: 120,
      jev_ms: 800,
      total_ms: 950,
      answers: {
        clarity_what_is_it: { type: "score", value: 3, probabilities: { "3": 0.6, "4": 0.4 } },
        pricing_visibility: { type: "choice", value: "visible_price" },
      },
      overall: 75,
      usage: { inputTokens: 1000, outputTokens: 200, totalTokens: 1200 },
    };
    const lines = rowsToLeaderboardCsv([row], questionIds).split("\n");
    expect(lines[1]).toBe(
      'example.com,https://example.com/,ok,,2026-09-01T00:00:00.000Z,req-1,abc123,4200,120,800,950,v1,' +
      '3,"{""3"":0.6,""4"":0.4}",visible_price,,' +
      '75,1000,200,1200',
    );
  });

  it("renders missing fields as empty cells, never the string undefined", () => {
    const row: LeaderboardRow = {
      domain: "broken.example",
      rubric_version: "v1",
      status: "scrape_failed",
      error_code: "BLOCKED_URL",
      fetched_at: "2026-09-01T00:00:00.000Z",
      answers: {},
    };
    const line = rowsToLeaderboardCsv([row], questionIds).split("\n")[1];
    expect(line).toBe(
      "broken.example,,scrape_failed,BLOCKED_URL,2026-09-01T00:00:00.000Z,,,,,,,v1,,,,,,,,",
    );
    expect(line).not.toContain("undefined");
  });

  it("escapes commas and quotes inside a field", () => {
    const row: LeaderboardRow = {
      domain: "quoted.example",
      rubric_version: "v1",
      status: "jev_failed",
      error_code: 'weird, "code"',
      fetched_at: "2026-09-01T00:00:00.000Z",
      answers: {},
    };
    const line = rowsToLeaderboardCsv([row], questionIds).split("\n")[1];
    expect(line).toContain('"weird, ""code"""');
  });
});
