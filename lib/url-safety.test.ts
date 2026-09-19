import { describe, expect, it } from "vitest";
import { fetchPublicMarkdown, isBlockedAddress, validatePublicUrl } from "./url-safety";

function makeReader(chunks: string[]) {
  const queue = chunks.map((chunk) => new TextEncoder().encode(chunk));
  return {
    read: async () => (queue.length ? { done: false, value: queue.shift()! } : { done: true, value: undefined }),
    cancel: async () => undefined,
  };
}

describe("URL safety", () => {
  it("blocks private and non-web destinations", async () => {
    expect(isBlockedAddress("127.0.0.1")).toBe(true);
    expect(isBlockedAddress("10.0.0.4")).toBe(true);
    expect(isBlockedAddress("example.com")).toBe(false);
    await expect(validatePublicUrl("file:///etc/passwd")).rejects.toThrow("INVALID_URL");
    await expect(validatePublicUrl("ftp://example.com/file")).rejects.toThrow("INVALID_URL");
    await expect(validatePublicUrl("http://127.0.0.1")).rejects.toThrow("BLOCKED_URL");
  });
  it("blocks reserved and non-public IPv4 ranges", () => {
    for (const address of [
      "100.64.0.1", "100.127.255.254",
      "192.0.0.1", "192.0.0.254",
      "192.0.2.1", "192.0.2.254",
      "198.18.0.1", "198.19.255.254",
      "198.51.100.1", "198.51.100.254",
      "203.0.113.1", "203.0.113.254",
      "240.0.0.1", "254.255.255.254", "255.255.255.255",
    ]) expect(isBlockedAddress(address)).toBe(true);
    expect(isBlockedAddress("93.184.216.34")).toBe(false);
  });
  it("rejects credentials and fragments", async () => {
    await expect(validatePublicUrl("https://user:pass@example.com")).rejects.toThrow("INVALID_URL");
    await expect(validatePublicUrl("https://example.com/#fragment")).rejects.toThrow("INVALID_URL");
  });
  it("reports a distinct timeout error instead of an opaque provider failure", async () => {
    const timeoutError = Object.assign(new Error("The operation was aborted due to timeout"), { name: "TimeoutError" });
    const timedOutFetcher = () => Promise.reject(timeoutError);
    await expect(fetchPublicMarkdown("https://example.com", "test-key", timedOutFetcher)).rejects.toThrow("FETCH_TIMEOUT");
  });
  it("classifies non-timeout network failures reaching the scrape provider instead of leaking the raw error", async () => {
    const networkError = new Error("fetch failed");
    const failingFetcher = () => Promise.reject(networkError);
    await expect(fetchPublicMarkdown("https://example.com", "test-key", failingFetcher)).rejects.toThrow("PROVIDER_UNREACHABLE");
  });
  it("reports a DNS resolution failure for the target host as an explicit code, not an opaque failure", async () => {
    const failingLookup = () => Promise.reject(Object.assign(new Error("getaddrinfo ENOTFOUND example.com"), { code: "ENOTFOUND" }));
    await expect(validatePublicUrl("https://example.com", failingLookup)).rejects.toThrow("DNS_LOOKUP_FAILED");
  });
  it("classifies a malformed provider response body instead of leaking a raw JSON parse error", async () => {
    const malformedJsonFetcher = () => Promise.resolve({ ok: true, status: 200, headers: { get: () => null }, body: { getReader: () => makeReader(["not json"]) } } as unknown as Response);
    await expect(fetchPublicMarkdown("https://example.com", "test-key", malformedJsonFetcher)).rejects.toThrow("PROVIDER_BAD_RESPONSE");
  });
  it("classifies a provider response missing usable markdown instead of leaking a raw shape error", async () => {
    const emptyBodyFetcher = () => Promise.resolve({ ok: true, status: 200, headers: { get: () => null }, body: { getReader: () => makeReader([JSON.stringify({ data: {}, meta: {} })]) } } as unknown as Response);
    await expect(fetchPublicMarkdown("https://example.com", "test-key", emptyBodyFetcher)).rejects.toThrow("PROVIDER_BAD_RESPONSE");
  });
  it("classifies a redirect with no location header instead of leaking a generic fetch failure", async () => {
    const redirectFetcher = () => Promise.resolve({ ok: false, status: 302, headers: { get: () => null } } as unknown as Response);
    await expect(fetchPublicMarkdown("https://example.com", "test-key", redirectFetcher)).rejects.toThrow("PROVIDER_BAD_RESPONSE");
  });
  it("classifies a fast non-2xx provider response by status instead of collapsing every rejection into the same opaque failure", async () => {
    const fakeResponse = (status: number) => ({ ok: false, status, headers: { get: () => null } }) as unknown as Response;
    await expect(fetchPublicMarkdown("https://example.com", "test-key", () => Promise.resolve(fakeResponse(429)))).rejects.toThrow("PROVIDER_RATE_LIMITED");
    await expect(fetchPublicMarkdown("https://example.com", "test-key", () => Promise.resolve(fakeResponse(401)))).rejects.toThrow("PROVIDER_UNAUTHORIZED");
    await expect(fetchPublicMarkdown("https://example.com", "test-key", () => Promise.resolve(fakeResponse(403)))).rejects.toThrow("PROVIDER_UNAUTHORIZED");
    await expect(fetchPublicMarkdown("https://example.com", "test-key", () => Promise.resolve(fakeResponse(503)))).rejects.toThrow("PROVIDER_UNAVAILABLE");
    await expect(fetchPublicMarkdown("https://example.com", "test-key", () => Promise.resolve(fakeResponse(400)))).rejects.toThrow("SITE_UNREACHABLE");
  });
});
