export function safeError(error: unknown) {
  const code = error instanceof Error ? error.message : "ANALYSIS_FAILED";
  if (["INVALID_URL", "BLOCKED_URL", "RESPONSE_TOO_LARGE"].includes(code)) return { status: 400, code, message: "That URL cannot be analyzed." };
  if (code === "RATE_LIMITED") return { status: 429, code, message: "Too many requests. Please try again shortly." };
  if (code === "FETCH_TIMEOUT") return { status: 504, code, message: "The website took too long to respond and could not be analyzed. Please try again." };
  if (code === "PROVIDER_RATE_LIMITED") return { status: 503, code, message: "The web content service is receiving too many requests right now. Please try again shortly." };
  if (code === "PROVIDER_UNAVAILABLE") return { status: 503, code, message: "The web content service is temporarily unavailable. Please try again." };
  if (code === "PROVIDER_UNAUTHORIZED") return { status: 503, code, message: "Analysis is temporarily unavailable." };
  if (code === "SITE_UNREACHABLE") return { status: 502, code, message: "This website could not be retrieved for analysis. It may block automated access, require a login, or be unavailable. Try a different URL." };
  return { status: 502, code: "UPSTREAM_FAILED", message: "The analysis could not be completed. Please try again." };
}
