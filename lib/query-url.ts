export function withAnalyzedUrl(currentHref: string, analyzedUrl: string) {
  const next = new URL(currentHref);
  next.searchParams.set("url", analyzedUrl);
  return next.toString();
}

export function safeInitialUrl(value: string | null) {
  if (!value) return "";
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : "";
  } catch { return ""; }
}
