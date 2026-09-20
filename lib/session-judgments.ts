import { MAX_JUDGMENTS, type Judgment } from "./judgment";

const STORAGE_KEY = "jev-web-analyzer:pending-judgments:v1";
const MAX_NAME = 32;
const MAX_INSTRUCTIONS = 240;
const MAX_CRITERIA = 2000;

type JudgmentStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function defaultStorage(): JudgmentStorage | null {
  try {
    return typeof window !== "undefined" ? window.sessionStorage : null;
  } catch {
    return null;
  }
}

function isJudgment(value: unknown): value is Judgment {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.name === "string" && item.name.length > 0 && item.name.length <= MAX_NAME &&
    (item.type === "boolean" || item.type === "choice" || item.type === "score") &&
    typeof item.instructions === "string" && item.instructions.length <= MAX_INSTRUCTIONS &&
    typeof item.criteria === "string" && item.criteria.length <= MAX_CRITERIA
  );
}

export function saveSessionJudgments(url: string, judgments: Judgment[], storage = defaultStorage()) {
  if (!storage) return;
  try {
    if (judgments.length === 0) { storage.removeItem(STORAGE_KEY); return; }
    storage.setItem(STORAGE_KEY, JSON.stringify({ url, judgments: judgments.slice(0, MAX_JUDGMENTS) }));
  } catch { /* sessionStorage unavailable or full; nothing to persist */ }
}

export function readSessionJudgments(url: string, storage = defaultStorage()): Judgment[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") { storage.removeItem(STORAGE_KEY); return []; }
    const payload = parsed as Record<string, unknown>;
    if (payload.url !== url || !Array.isArray(payload.judgments)) { storage.removeItem(STORAGE_KEY); return []; }
    const judgments = payload.judgments.filter(isJudgment);
    if (judgments.length !== payload.judgments.length) { storage.removeItem(STORAGE_KEY); return []; }
    return judgments.slice(0, MAX_JUDGMENTS);
  } catch {
    try { storage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    return [];
  }
}

export function clearSessionJudgments(storage = defaultStorage()) {
  if (!storage) return;
  try { storage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}
