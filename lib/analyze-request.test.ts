import { describe, expect, it } from "vitest";
import { buildAnalyzeRequestBody } from "./analyze-request";

describe("buildAnalyzeRequestBody", () => {
  it("sends only the url with an empty judgments array when there are no custom judgments", () => {
    expect(buildAnalyzeRequestBody("https://example.com", [])).toEqual({ url: "https://example.com", judgments: [] });
  });

  it("parses newline-delimited choice criteria into a key/description record", () => {
    const body = buildAnalyzeRequestBody("https://example.com", [
      { name: "custom_1", type: "choice", instructions: "Judge the thing", criteria: "yes: it is\nno: it is not" },
    ]);
    expect(body.judgments).toEqual([
      { name: "custom_1", question: { type: "choice", instructions: "Judge the thing", criteria: { yes: "it is", no: "it is not" } } },
    ]);
  });

  it("parses newline-delimited score criteria into a bounded ordered list, dropping blank lines", () => {
    const body = buildAnalyzeRequestBody("https://example.com", [
      { name: "custom_2", type: "score", instructions: "Rate it", criteria: "low\n\nmedium\nhigh" },
    ]);
    expect(body.judgments[0]!.question.criteria).toEqual(["low", "medium", "high"]);
  });

  it("omits criteria entirely for boolean judgments", () => {
    const body = buildAnalyzeRequestBody("https://example.com", [
      { name: "custom_3", type: "boolean", instructions: "Is it true?", criteria: "" },
    ]);
    expect(body.judgments[0]!.question).toEqual({ type: "boolean", instructions: "Is it true?" });
  });
});
