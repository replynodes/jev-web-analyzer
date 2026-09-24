import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadLeaderboardData, matchedLevelDescription, scoreBand } from "./leaderboard";
import type { RubricQuestion } from "./rubric";

describe("scoreBand", () => {
  it.each([
    [100, "brightgreen"],
    [85, "brightgreen"],
    [84, "green"],
    [70, "green"],
    [69, "yellowgreen"],
    [55, "yellowgreen"],
    [54, "yellow"],
    [40, "yellow"],
    [39, "orange"],
    [25, "orange"],
    [24, "red"],
    [0, "red"],
  ])("maps overall=%i to shields color %s", (overall, expected) => {
    expect(scoreBand(overall).shieldsColor).toBe(expected);
  });
});

describe("matchedLevelDescription", () => {
  const scoreQuestion: RubricQuestion = { type: "score", instructions: "x", criteria: ["l0", "l1", "l2", "l3", "l4"] };
  const choiceQuestion: RubricQuestion = { type: "choice", instructions: "x", criteria: { yes: "Yes text", no: "No text" } };

  it("rounds a fractional score to the nearest level", () => {
    expect(matchedLevelDescription(scoreQuestion, { type: "score", value: 2.6 })).toBe("l3");
    expect(matchedLevelDescription(scoreQuestion, { type: "score", value: 2.4 })).toBe("l2");
  });
  it("clamps to the criteria bounds", () => {
    expect(matchedLevelDescription(scoreQuestion, { type: "score", value: 0 })).toBe("l0");
    expect(matchedLevelDescription(scoreQuestion, { type: "score", value: 4 })).toBe("l4");
  });
  it("looks up a choice answer's description directly", () => {
    expect(matchedLevelDescription(choiceQuestion, { type: "choice", value: "yes" })).toBe("Yes text");
  });
});

describe("loadLeaderboardData", () => {
  it("returns null instead of throwing when no dataset file exists", () => {
    const emptyDir = mkdtempSync(path.join(tmpdir(), "leaderboard-empty-"));
    expect(loadLeaderboardData({ dataDir: emptyDir })).toBeNull();
  });

  it("returns null instead of throwing when the rubric fails validation", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "leaderboard-data-"));
    writeFileSync(
      path.join(dir, "leaderboard-2026-01.json"),
      JSON.stringify({ generated_at: "2026-01-01T00:00:00.000Z", rubric_version: "v1", rows: [] }),
    );
    const rubricPath = path.join(dir, "bad-rubric.json");
    writeFileSync(
      rubricPath,
      JSON.stringify({
        rubric_version: "v1", rationale: "x",
        score_scale: { levels: 5, raw_min: 0, raw_max: 4, direction: "x" },
        score_question_ids: ["q1"], category_question_ids: [], overall_formula: "x",
        questions: { q1: { type: "score", instructions: "x", criteria: ["a", "b", "c"] } },
      }),
    );
    expect(loadLeaderboardData({ dataDir: dir, rubricPath })).toBeNull();
  });

  it("returns the dataset and rubric together when both load successfully", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "leaderboard-data-ok-"));
    writeFileSync(
      path.join(dir, "leaderboard-2026-01.json"),
      JSON.stringify({ generated_at: "2026-01-01T00:00:00.000Z", rubric_version: "v1", rows: [] }),
    );
    const result = loadLeaderboardData({ dataDir: dir });
    expect(result?.dataset.rubric_version).toBe("v1");
    expect(result?.rubric.rubric_version).toBe("v1");
  });
});
