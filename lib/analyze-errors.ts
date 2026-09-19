export function safeError(error: unknown) {
  const code = error instanceof Error ? error.message : "ANALYSIS_FAILED";
  if (["INVALID_URL", "BLOCKED_URL", "RESPONSE_TOO_LARGE"].includes(code)) return { status: 400, code, message: "That URL cannot be analyzed." };
  if (code === "RATE_LIMITED") return { status: 429, code, message: "Too many requests. Please try again shortly." };
  if (code === "FETCH_TIMEOUT") return { status: 504, code, message: "The website took too long to respond and could not be analyzed. Please try again." };
  if (code === "DNS_LOOKUP_FAILED") return { status: 502, code, message: "This website's address could not be found. Check the URL and try again." };
  if (code === "SITE_UNREACHABLE") return { status: 502, code, message: "This website could not be retrieved for analysis. It may block automated access, require a login, or be unavailable. Try a different URL." };
  if (code === "PROVIDER_RATE_LIMITED") return { status: 503, code, message: "The web content service is receiving too many requests right now. Please try again shortly." };
  if (code === "PROVIDER_UNAVAILABLE" || code === "PROVIDER_UNREACHABLE") return { status: 503, code, message: "The web content service is temporarily unavailable. Please try again." };
  if (code === "PROVIDER_UNAUTHORIZED") return { status: 503, code, message: "Analysis is temporarily unavailable." };
  if (code === "PROVIDER_BAD_RESPONSE" || code === "INVALID_PROVIDER_RESPONSE") return { status: 502, code, message: "ReplyNodes returned no usable clean Markdown for this website. It may be a client-rendered page or block automated access. Try a different URL." };
  return { status: 502, code: "UPSTREAM_FAILED", message: "The analysis could not be completed. Please try again." };
}
