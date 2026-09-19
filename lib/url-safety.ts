import dns from "node:dns/promises";
import net from "node:net";

export const MAX_REDIRECTS = 3;
export const FETCH_TIMEOUT_MS = 15_000;
export const MAX_RESPONSE_BYTES = 1_500_000;

function privateIpv4(address: string) {
  const octets = address.split(".").map(Number);
  return octets.length === 4 && (octets[0] === 10 || octets[0] === 127 || octets[0] === 0 || (octets[0] === 169 && octets[1] === 254) || (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) || (octets[0] === 192 && octets[1] === 168));
}

function privateIpv6(address: string) {
  const normalized = address.toLowerCase();
  const mappedIpv4 = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1];
  return normalized === "::1" || normalized === "::" || normalized.startsWith("fe80:") || normalized.startsWith("fc") || normalized.startsWith("fd") || (mappedIpv4 !== undefined && privateIpv4(mappedIpv4));
}

export function isBlockedAddress(address: string) {
  return net.isIPv4(address) ? privateIpv4(address) : net.isIPv6(address) ? privateIpv6(address) : false;
}

export async function validatePublicUrl(input: string): Promise<URL> {
  let url: URL;
  try { url = new URL(input); } catch { throw new Error("INVALID_URL"); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.hash) throw new Error("INVALID_URL");
  if (url.hostname === "localhost" || url.hostname.endsWith(".localhost") || url.hostname.endsWith(".internal") || net.isIP(url.hostname) && isBlockedAddress(url.hostname)) throw new Error("BLOCKED_URL");
  const addresses = await dns.lookup(url.hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => !net.isIP(address) || isBlockedAddress(address))) throw new Error("BLOCKED_URL");
  return url;
}

export async function fetchPublicMarkdown(input: string, apiKey: string, fetcher = fetch) {
  let url = await validatePublicUrl(input);
  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect++) {
    const response = await fetcher(`https://api.replynodes.com/v1/webcontext/scrape?url=${encodeURIComponent(url.toString())}`, {
      headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location || redirect === MAX_REDIRECTS) throw new Error("FETCH_FAILED");
      url = await validatePublicUrl(new URL(location, url).toString());
      continue;
    }
    if (!response.ok) throw new Error("FETCH_FAILED");
    const contentLength = Number(response.headers.get("content-length") ?? 0);
    if (contentLength > MAX_RESPONSE_BYTES) throw new Error("RESPONSE_TOO_LARGE");
    const reader = response.body?.getReader();
    if (!reader) throw new Error("FETCH_FAILED");
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_RESPONSE_BYTES) { await reader.cancel(); throw new Error("RESPONSE_TOO_LARGE"); }
      chunks.push(value);
    }
    const body = JSON.parse(new TextDecoder().decode(Buffer.concat(chunks)));
    const data = body?.data;
    const markdown = typeof data === "string" ? data : data?.markdown ?? data?.content ?? data?.text;
    if (typeof markdown !== "string" || !markdown.trim() || typeof body?.meta?.request_id !== "string") throw new Error("INVALID_PROVIDER_RESPONSE");
    return { url: url.toString(), markdown: markdown.slice(0, MAX_RESPONSE_BYTES), requestId: body.meta.request_id };
  }
  throw new Error("FETCH_FAILED");
}
