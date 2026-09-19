import dns from "node:dns/promises";
import net from "node:net";

export const MAX_REDIRECTS = 3;
export const FETCH_TIMEOUT_MS = 25_000;
export const MAX_RESPONSE_BYTES = 1_500_000;

function privateIpv4(address: string) {
  const octets = address.split(".").map(Number);
  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) return false;
  const value = octets.reduce((total, octet) => total * 256 + octet, 0);
  const inRange = (start: number, end: number) => value >= start && value <= end;
  return inRange(0x0a000000, 0x0affffff) || // 10.0.0.0/8
    inRange(0x7f000000, 0x7fffffff) || // 127.0.0.0/8
    inRange(0xa9fe0000, 0xa9feffff) || // 169.254.0.0/16
    inRange(0xac100000, 0xac1fffff) || // 172.16.0.0/12
    inRange(0xc0a80000, 0xc0a8ffff) || // 192.168.0.0/16
    inRange(0x64400000, 0x647fffff) || // 100.64.0.0/10
    inRange(0xc0000000, 0xc00000ff) || // 192.0.0.0/24
    inRange(0xc0000200, 0xc00002ff) || // 192.0.2.0/24
    inRange(0xc6120000, 0xc613ffff) || // 198.18.0.0/15
    inRange(0xc6336400, 0xc63364ff) || // 198.51.100.0/24
    inRange(0xcb007100, 0xcb0071ff) || // 203.0.113.0/24
    inRange(0xf0000000, 0xffffffff) || // 240.0.0.0/4 and 255.255.255.255
    inRange(0, 0x00ffffff); // 0.0.0.0/8
}

function privateIpv6(address: string) {
  const normalized = address.toLowerCase();
  const mappedIpv4 = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1];
  return normalized === "::1" || normalized === "::" || normalized.startsWith("fe80:") || normalized.startsWith("fc") || normalized.startsWith("fd") || (mappedIpv4 !== undefined && privateIpv4(mappedIpv4));
}

export function isBlockedAddress(address: string) {
  return net.isIPv4(address) ? privateIpv4(address) : net.isIPv6(address) ? privateIpv6(address) : false;
}

type DnsLookup = (hostname: string, options: { all: true; verbatim: true }) => Promise<{ address: string }[]>;

export async function validatePublicUrl(input: string, lookup: DnsLookup = dns.lookup): Promise<URL> {
  let url: URL;
  try { url = new URL(input); } catch { throw new Error("INVALID_URL"); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.hash) throw new Error("INVALID_URL");
  if (url.hostname === "localhost" || url.hostname.endsWith(".localhost") || url.hostname.endsWith(".internal") || net.isIP(url.hostname) && isBlockedAddress(url.hostname)) throw new Error("BLOCKED_URL");
  let addresses: { address: string }[];
  try { addresses = await lookup(url.hostname, { all: true, verbatim: true }); } catch { throw new Error("DNS_LOOKUP_FAILED"); }
  if (!addresses.length || addresses.some(({ address }) => !net.isIP(address) || isBlockedAddress(address))) throw new Error("BLOCKED_URL");
  return url;
}

export async function fetchPublicMarkdown(input: string, apiKey: string, fetcher = fetch) {
  let url = await validatePublicUrl(input);
  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect++) {
    let response: Response;
    try {
      response = await fetcher(`https://api.replynodes.com/v1/webcontext/scrape?url=${encodeURIComponent(url.toString())}`, {
        headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
    } catch (error) {
      if (error instanceof Error && error.name === "TimeoutError") throw new Error("FETCH_TIMEOUT");
      throw new Error("PROVIDER_UNREACHABLE");
    }
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location || redirect === MAX_REDIRECTS) throw new Error("PROVIDER_BAD_RESPONSE");
      let redirectTarget: string;
      try { redirectTarget = new URL(location, url).toString(); } catch { throw new Error("PROVIDER_BAD_RESPONSE"); }
      url = await validatePublicUrl(redirectTarget);
      continue;
    }
    if (!response.ok) {
      if (response.status === 429) throw new Error("PROVIDER_RATE_LIMITED");
      if (response.status === 401 || response.status === 403) throw new Error("PROVIDER_UNAUTHORIZED");
      if (response.status >= 500) throw new Error("PROVIDER_UNAVAILABLE");
      throw new Error("SITE_UNREACHABLE");
    }
    const contentLength = Number(response.headers.get("content-length") ?? 0);
    if (contentLength > MAX_RESPONSE_BYTES) throw new Error("RESPONSE_TOO_LARGE");
    const reader = response.body?.getReader();
    if (!reader) throw new Error("PROVIDER_BAD_RESPONSE");
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > MAX_RESPONSE_BYTES) { await reader.cancel(); throw new Error("RESPONSE_TOO_LARGE"); }
        chunks.push(value);
      }
    } catch (error) {
      if (error instanceof Error && error.message === "RESPONSE_TOO_LARGE") throw error;
      throw new Error("PROVIDER_UNREACHABLE");
    }
    let body;
    try { body = JSON.parse(new TextDecoder().decode(Buffer.concat(chunks))); } catch { throw new Error("PROVIDER_BAD_RESPONSE"); }
    const data = body?.data;
    const markdown = typeof data === "string" ? data : data?.markdown ?? data?.content ?? data?.text;
    if (typeof markdown !== "string" || !markdown.trim() || typeof body?.meta?.request_id !== "string") throw new Error("PROVIDER_BAD_RESPONSE");
    const providerFinalUrl = [body.meta.final_url, body.meta.finalUrl, body.meta.url].find((value: unknown) => typeof value === "string");
    let finalUrl = url.toString();
    if (providerFinalUrl) {
      try { const candidate = new URL(providerFinalUrl); if (["http:", "https:"].includes(candidate.protocol)) finalUrl = candidate.toString(); } catch { /* use the validated requested URL */ }
    }
    const providerStatus = [body.meta.status, body.meta.status_code].find((value: unknown) => typeof value === "number" && Number.isInteger(value) && value >= 100 && value <= 599);
    return { url: finalUrl, markdown: markdown.slice(0, MAX_RESPONSE_BYTES), requestId: body.meta.request_id, status: providerStatus ?? response.status };
  }
  throw new Error("PROVIDER_BAD_RESPONSE");
}
