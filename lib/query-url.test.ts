import { describe, expect, it } from "vitest";
import { safeInitialUrl, withAnalyzedUrl } from "./query-url";

describe("query URL helpers", () => {
  it("only accepts safe initial HTTP(S) prefill values", () => {
    expect(safeInitialUrl("https://example.com/a?x=1")).toBe("https://example.com/a?x=1");
    expect(safeInitialUrl("javascript:alert(1)")).toBe("");
    expect(safeInitialUrl("not a URL")).toBe("");
  });
  it("encodes the analyzed URL without changing the current input while typing", () => {
    expect(withAnalyzedUrl("https://app.test/analyze", "https://example.com/a?x=hello world")).toContain("url=https%3A%2F%2Fexample.com%2Fa%3Fx%3Dhello+world");
  });
});
