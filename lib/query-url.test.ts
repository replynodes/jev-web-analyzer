import { describe, expect, it } from "vitest";
import { inputPath, resultPath, safeInitialUrl, withAnalyzedUrl } from "./query-url";

describe("query URL helpers", () => {
  it("only accepts safe initial HTTP(S) prefill values", () => {
    expect(safeInitialUrl("https://example.com/a?x=1")).toBe("https://example.com/a?x=1");
    expect(safeInitialUrl("javascript:alert(1)")).toBe("");
    expect(safeInitialUrl("not a URL")).toBe("");
  });
  it("encodes the analyzed URL without changing the current input while typing", () => {
    expect(withAnalyzedUrl("https://app.test/analyze", "https://example.com/a?x=hello world")).toContain("url=https%3A%2F%2Fexample.com%2Fa%3Fx%3Dhello+world");
  });
  it("builds a root-relative result route path carrying only the url param", () => {
    expect(resultPath("https://example.com/a?x=hello world")).toBe("/result?url=https%3A%2F%2Fexample.com%2Fa%3Fx%3Dhello%20world");
  });
  it("builds a root-relative input path, prefilling only when a url is given", () => {
    expect(inputPath("https://example.com")).toBe("/?url=https%3A%2F%2Fexample.com");
    expect(inputPath()).toBe("/");
  });
  it("keeps safeInitialUrl idempotent so a value saved before navigation matches the value read back from the ?url= query param after navigation", () => {
    // Bare-domain example chips (e.g. https://stripe.com) gain a trailing slash from URL normalization.
    // Anything persisted before navigating (e.g. sessionStorage judgments) must be keyed off the
    // *normalized* value, or it will never match what the result page parses back out of the query string.
    const normalized = safeInitialUrl("https://stripe.com");
    expect(normalized).toBe("https://stripe.com/");
    const path = resultPath(normalized);
    const parsedBack = new URLSearchParams(path.split("?")[1]).get("url");
    expect(safeInitialUrl(parsedBack)).toBe(normalized);
  });
});
