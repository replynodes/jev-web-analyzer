import crypto from "node:crypto";

type Entry<T> = { expires: number; value: T };
const entries = new Map<string, Entry<unknown>>();
export const ANALYSIS_TTL_MS = 5 * 60 * 1000;
const MAX_ENTRIES = 100;

export function cacheKey(url: string, judgments: unknown) {
  return crypto.createHash("sha256").update(JSON.stringify([url, judgments])).digest("hex");
}
export function getCached<T>(key: string, now = Date.now()): T | undefined {
  const entry = entries.get(key);
  if (!entry) return undefined;
  if (entry.expires <= now) { entries.delete(key); return undefined; }
  return entry.value as T;
}
export function setCached<T>(key: string, value: T, now = Date.now()) {
  if (entries.size >= MAX_ENTRIES) entries.delete(entries.keys().next().value as string);
  entries.set(key, { value, expires: now + ANALYSIS_TTL_MS });
}
export function clearCache() { entries.clear(); }
