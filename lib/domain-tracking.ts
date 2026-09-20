const STORAGE_KEY = "jev_web_analyzer_domains_v1";
const MAX_DOMAINS = 20;

type DomainStorage = Pick<Storage, "getItem" | "setItem">;

function defaultStorage(): DomainStorage | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function sanitizeHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

function readDomains(storage: DomainStorage): string[] {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

/**
 * Records a hostname the browser has analyzed, bounded to the most recent MAX_DOMAINS.
 * Returns the new domain count only when this hostname is new AND it is not the
 * first unique hostname recorded (i.e. this is the signal for cross-domain usage).
 */
export function recordDomain(hostname: string, storage = defaultStorage()): { hostname: string; domainCount: number } | null {
  if (!hostname || !storage) return null;
  const domains = readDomains(storage);
  if (domains.includes(hostname)) return null;
  const next = [...domains, hostname].slice(-MAX_DOMAINS);
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    return null;
  }
  return next.length > 1 ? { hostname, domainCount: next.length } : null;
}
