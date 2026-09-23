import { describe, expect, it } from "vitest";
import { extractEvidence } from "./evidence";

const REPLYNODES = [
  "DATA APIs FOR AI AGENTS",
  "",
  "# The web context {API} for teams building AI products, agents, and workflows.",
  "",
  "Agents ask. Nodes reply.",
  "",
  "Search the web, read social platforms, access app data, and scrape pages through one API.",
  "",
  "      [Sign up \u2192](https://platform.replynodes.com/sign-up)",
  "      [View Docs](https://replynodes.com/skill.md)",
  "",
  "- Integrating every data",
].join("\n");

const EXAMPLE = "# Example Domain\n\n\nThis domain is for use in documentation examples without needing permission. Avoid use in operations.\n\n\n[Learn more](https://iana.org/domains/example)";

describe("extractEvidence", () => {
  it("returns only verbatim substrings of the input", () => {
    for (const markdown of [REPLYNODES, EXAMPLE, "plain text without any structure at all, just a sentence."]) {
      for (const evidence of extractEvidence(markdown)) {
        expect(markdown.includes(evidence.text), evidence.text).toBe(true);
        expect(evidence.text.length).toBeLessThanOrEqual(140);
      }
    }
  });

  it("labels evidence with the real position it occupies", () => {
    const evidence = extractEvidence(REPLYNODES);
    expect(evidence.find((entry) => entry.kind === "hero-heading")?.text).toBe(
      "The web context {API} for teams building AI products, agents, and workflows.",
    );
    expect(evidence.find((entry) => entry.kind === "first-paragraph")?.text).toBe("Agents ask. Nodes reply.");
    expect(evidence.find((entry) => entry.kind === "cta-line")?.text).toBe("Sign up \u2192");
    expect(evidence.find((entry) => entry.kind === "list-item")?.text).toBe("Integrating every data");
  });

  it("extracts from a thin page without inventing sections", () => {
    const kinds = extractEvidence(EXAMPLE).map((entry) => entry.kind);
    expect(kinds).toContain("hero-heading");
    expect(kinds).toContain("first-paragraph");
    expect(kinds).toContain("cta-line");
    expect(kinds).not.toContain("list-item");
  });

  it("returns an empty list when nothing qualifies", () => {
    expect(extractEvidence("")).toEqual([]);
  });
});
