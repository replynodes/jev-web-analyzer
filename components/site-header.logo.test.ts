import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./site-header.tsx", import.meta.url), "utf8");

describe("header logo contract", () => {
  it("does not render the full 160x32 wordmark asset", () => {
    expect(source).not.toContain("/brand/replynodes.svg");
    expect(source).not.toContain("width={160}");
  });

  it("renders the compact 20x20 mark with the live-site geometry and colors", () => {
    expect(source).toContain('width="20" height="20" viewBox="0 0 40 40"');
    expect(source).toContain('fill="#A2D98A"');
    expect(source).toContain('stroke="#223835"');
  });

  it("renders the correctly cased ReplyNodes text wordmark", () => {
    expect(source).toMatch(/>ReplyNodes<\/span>/);
  });

  it("links the logo to the live site with an accessible label", () => {
    expect(source).toMatch(/href="https:\/\/replynodes\.com\/"[^>]*aria-label="ReplyNodes home"/);
  });

  it("renders the breadcrumb crumb passed by the calling page", () => {
    expect(source).toContain("{crumb}");
  });
});
