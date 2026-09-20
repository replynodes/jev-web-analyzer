import { describe, expect, it } from "vitest";
import { clearSessionJudgments, readSessionJudgments, saveSessionJudgments } from "./session-judgments";
import type { Judgment } from "./judgment";

function fakeStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => { map.set(key, value); },
    removeItem: (key: string) => { map.delete(key); },
    raw: map,
  };
}

const judgment: Judgment = { name: "custom_1", type: "boolean", instructions: "Is it obvious?", criteria: "" };

describe("session judgments", () => {
  it("round-trips bounded judgments keyed to the submitted url", () => {
    const storage = fakeStorage();
    saveSessionJudgments("https://example.com", [judgment], storage);
    expect(readSessionJudgments("https://example.com", storage)).toEqual([judgment]);
  });

  it("ignores stored judgments when the url does not match (new analysis, different site)", () => {
    const storage = fakeStorage();
    saveSessionJudgments("https://example.com", [judgment], storage);
    expect(readSessionJudgments("https://other.com", storage)).toEqual([]);
  });

  it("returns no judgments and clears storage when nothing was saved (shared link, fresh tab)", () => {
    const storage = fakeStorage();
    expect(readSessionJudgments("https://example.com", storage)).toEqual([]);
  });

  it("clears and ignores malformed JSON instead of throwing", () => {
    const storage = fakeStorage();
    storage.setItem("jev-web-analyzer:pending-judgments:v1", "{not json");
    expect(readSessionJudgments("https://example.com", storage)).toEqual([]);
    expect(storage.raw.size).toBe(0);
  });

  it("clears and ignores a payload with an out-of-bounds judgment", () => {
    const storage = fakeStorage();
    storage.setItem("jev-web-analyzer:pending-judgments:v1", JSON.stringify({
      url: "https://example.com",
      judgments: [{ name: "custom_1", type: "boolean", instructions: "x".repeat(300), criteria: "" }],
    }));
    expect(readSessionJudgments("https://example.com", storage)).toEqual([]);
    expect(storage.raw.size).toBe(0);
  });

  it("bounds saved judgments to at most three even if given more", () => {
    const storage = fakeStorage();
    const many = [1, 2, 3, 4].map((i) => ({ ...judgment, name: `custom_${i}` }));
    saveSessionJudgments("https://example.com", many, storage);
    expect(readSessionJudgments("https://example.com", storage)).toHaveLength(3);
  });

  it("removes the stored entry when saving an empty judgments list", () => {
    const storage = fakeStorage();
    saveSessionJudgments("https://example.com", [judgment], storage);
    saveSessionJudgments("https://example.com", [], storage);
    expect(readSessionJudgments("https://example.com", storage)).toEqual([]);
  });

  it("clearSessionJudgments removes any pending entry", () => {
    const storage = fakeStorage();
    saveSessionJudgments("https://example.com", [judgment], storage);
    clearSessionJudgments(storage);
    expect(readSessionJudgments("https://example.com", storage)).toEqual([]);
  });
});
