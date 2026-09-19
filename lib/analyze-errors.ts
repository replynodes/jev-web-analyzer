export function safeError(error: unknown) {
  const code = error instanceof Error ? error.message : "ANALYSIS_FAILED";
  if (["INVALID_URL", "BLOCKED_URL", "RESPONSE_TOO_LARGE"].includes(code)) return { status: 400, code, message: "That URL cannot be analyzed." };
  if (code === "RATE_LIMITED") return { status: 429, code, message: "Too many requests. Please try again shortly." };
  if (code === "FETCH_TIMEOUT") return { status: 504, code, message: "The website took too long to respond and could not be analyzed. Please try again." };
  return { status: 502, code: "UPSTREAM_FAILED", message: "The analysis could not be completed. Please try again." };
}
