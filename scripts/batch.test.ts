import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseArgs, readDomains } from "./batch";

describe("parseArgs", () => {
  it("applies defaults with no flags", () => {
    const opts = parseArgs([]);
    expect(opts.concurrency).toBe(4);
    expect(opts.maxRetries).toBe(3);
    expect(opts.timeoutMs).toBe(120_000);
    expect(opts.force).toBe(false);
  });
  it("parses numeric and string flags", () => {
    const opts = parseArgs(["--concurrency=8", "--retries=1", "--domains=foo.txt", "--force"]);
    expect(opts.concurrency).toBe(8);
    expect(opts.maxRetries).toBe(1);
    expect(opts.domainsFile).toBe("foo.txt");
    expect(opts.force).toBe(true);
  });
  it("throws a clear error instead of silently producing NaN for a non-numeric --concurrency", () => {
    expect(() => parseArgs(["--concurrency=abc"])).toThrow(/--concurrency expects a number/);
  });
  it("throws a clear error instead of silently producing NaN for a non-numeric --retries", () => {
    expect(() => parseArgs(["--retries=abc"])).toThrow(/--retries expects a number/);
  });
  it("clamps concurrency to a minimum of 1", () => {
    expect(parseArgs(["--concurrency=0"]).concurrency).toBe(1);
  });
});

describe("readDomains", () => {
  it("skips blank lines and comment lines", async () => {
    const dir = mkdtempSync(path.join(tmpdir(), "domains-test-"));
    const filePath = path.join(dir, "domains.txt");
    writeFileSync(filePath, "# comment\n\nexample.com\n  \nfoo.example\n#another comment\n");
    expect(await readDomains(filePath)).toEqual(["example.com", "foo.example"]);
  });
  it("throws a clear error when the file is missing", async () => {
    await expect(readDomains("/nonexistent/path/domains.txt")).rejects.toThrow(/Cannot read domains file/);
  });
});
