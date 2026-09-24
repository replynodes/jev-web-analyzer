import { describe, expect, it } from "vitest";
import { matchedLevelDescription, scoreBand } from "./leaderboard";
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
