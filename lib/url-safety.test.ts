import { describe, expect, it } from "vitest";
import { isBlockedAddress, validatePublicUrl } from "./url-safety";

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
});
