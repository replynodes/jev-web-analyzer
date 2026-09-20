import { describe, expect, it } from "vitest";
import { recordDomain, sanitizeHostname } from "./domain-tracking";

function fakeStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => { map.set(key, value); },
    raw: map,
  };
}

describe("sanitizeHostname", () => {
  it("extracts only the hostname, dropping path, query, and protocol", () => {
    expect(sanitizeHostname("https://example.com/path?token=secret&q=1")).toBe("example.com");
  });

  it("returns an empty string for an unparseable url instead of throwing", () => {
    expect(sanitizeHostname("not a url")).toBe("");
  });
});

describe("recordDomain", () => {
  it("does not emit for the first unique hostname but still stores it", () => {
    const storage = fakeStorage();
    expect(recordDomain("example.com", storage)).toBeNull();
    expect(JSON.parse(storage.raw.get("jev_web_analyzer_domains_v1")!)).toEqual(["example.com"]);
  });

  it("emits with an incremented domain_count for a second unique hostname", () => {
    const storage = fakeStorage();
    recordDomain("example.com", storage);
    expect(recordDomain("other.com", storage)).toEqual({ hostname: "other.com", domainCount: 2 });
  });

  it("emits again for a third unique hostname", () => {
    const storage = fakeStorage();
    recordDomain("a.com", storage);
    recordDomain("b.com", storage);
    expect(recordDomain("c.com", storage)).toEqual({ hostname: "c.com", domainCount: 3 });
  });

  it("does not re-emit for a hostname already seen", () => {
    const storage = fakeStorage();
    recordDomain("example.com", storage);
    recordDomain("other.com", storage);
    expect(recordDomain("example.com", storage)).toBeNull();
  });

  it("bounds stored hostnames to the most recent 20", () => {
    const storage = fakeStorage();
    for (let i = 0; i < 25; i++) recordDomain(`site${i}.com`, storage);
    const stored = JSON.parse(storage.raw.get("jev_web_analyzer_domains_v1")!);
    expect(stored).toHaveLength(20);
    expect(stored).toEqual(["site5.com", "site6.com", "site7.com", "site8.com", "site9.com", "site10.com", "site11.com", "site12.com", "site13.com", "site14.com", "site15.com", "site16.com", "site17.com", "site18.com", "site19.com", "site20.com", "site21.com", "site22.com", "site23.com", "site24.com"]);
  });

  it("returns null when no storage is available (blocked localStorage)", () => {
    expect(recordDomain("example.com", null)).toBeNull();
  });

  it("returns null for an empty hostname", () => {
    const storage = fakeStorage();
    expect(recordDomain("", storage)).toBeNull();
  });
});
