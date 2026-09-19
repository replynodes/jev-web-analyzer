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
  it("rejects credentials and fragments", async () => {
    await expect(validatePublicUrl("https://user:pass@example.com")).rejects.toThrow("INVALID_URL");
    await expect(validatePublicUrl("https://example.com/#fragment")).rejects.toThrow("INVALID_URL");
  });
});
