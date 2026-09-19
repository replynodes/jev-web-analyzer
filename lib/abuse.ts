type Bucket = { tokens: number; updated: number };
const buckets = new Map<string, Bucket>();
const CAPACITY = 8;
const REFILL_PER_MS = 1 / 15_000;
export function allowRequest(key: string, now = Date.now()) {
  const old = buckets.get(key) ?? { tokens: CAPACITY, updated: now };
  const tokens = Math.min(CAPACITY, old.tokens + (now - old.updated) * REFILL_PER_MS);
  if (tokens < 1) { buckets.set(key, { tokens, updated: now }); return false; }
  buckets.set(key, { tokens: tokens - 1, updated: now });
  if (buckets.size > 1000) buckets.delete(buckets.keys().next().value as string);
  return true;
}
