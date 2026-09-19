import { describe, expect, it } from "vitest";
import { ANALYZE_API_PATH } from "./analyze-path";

describe("analyze API path", () => {
  it("includes the deployment base path", () => {
    expect(ANALYZE_API_PATH).toBe("/jev-web-analyzer/api/analyze");
    expect(ANALYZE_API_PATH).not.toBe("/api/analyze");
  });
});
