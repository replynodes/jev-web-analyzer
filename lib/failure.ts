export type FailureKind = "url" | "request" | "site" | "content" | "rate" | "service" | "unknown";

export type FailureCopy = {
  kind: FailureKind;
  title: string;
  detail: string;
};

const URL_CODES = new Set(["INVALID_URL", "BLOCKED_URL"]);
const REQUEST_CODES = new Set(["INVALID_JSON", "INVALID_INPUT", "REQUEST_TOO_LARGE"]);
const SITE_CODES = new Set(["DNS_LOOKUP_FAILED", "SITE_UNREACHABLE", "FETCH_TIMEOUT"]);
const CONTENT_CODES = new Set(["RESPONSE_TOO_LARGE", "PROVIDER_BAD_RESPONSE", "INVALID_PROVIDER_RESPONSE"]);
const RATE_CODES = new Set(["RATE_LIMITED"]);
const SERVICE_CODES = new Set([
  "NOT_CONFIGURED",
  "PROVIDER_UNAUTHORIZED",
  "PROVIDER_UNAVAILABLE",
  "PROVIDER_UNREACHABLE",
  "PROVIDER_RATE_LIMITED",
  "UPSTREAM_FAILED",
  "ANALYSIS_FAILED",
]);

/**
 * Classifies an analysis failure for the UI.
 *
 * The server collapses several causes into a status code, so the fetch status alone is not
 * enough: a missing credential or an upstream outage would otherwise be reported as
 * "Site unreachable", blaming the user's homepage. Prefer the explicit error code, and fall
 * back to the fetch status only when no code was returned.
 *
 * Request-shape codes (malformed or oversized request body) are a client-side condition and
 * must not be presented as a problem with the URL the user typed.
 */
export function classifyFailure(errorCode: string | undefined, fetched: boolean): FailureCopy {
  const code = (errorCode ?? "").trim().toUpperCase();

  if (URL_CODES.has(code)) {
    return {
      kind: "url",
      title: "That URL cannot be analyzed",
      detail: "Only public HTTP(S) pages without embedded credentials can be analyzed.",
    };
  }
  if (REQUEST_CODES.has(code)) {
    return {
      kind: "request",
      title: "The analysis request was rejected",
      detail: "The request was malformed or too large. Reload the page and try the same URL again.",
    };
  }
  if (SITE_CODES.has(code)) {
    return {
      kind: "site",
      title: "Site unreachable",
      detail: "The homepage could not be fetched. Check the URL and retry manually.",
    };
  }
  if (CONTENT_CODES.has(code)) {
    return {
      kind: "content",
      title: "No readable homepage content",
      detail:
        "ReplyNodes returned no usable clean Markdown for this page. It may be client-rendered, too large, or block automated access. Try a different URL.",
    };
  }
  if (RATE_CODES.has(code)) {
    return {
      kind: "rate",
      title: "Too many requests",
      detail: "You have run several analyses in a row. Wait a moment, then retry.",
    };
  }
  if (SERVICE_CODES.has(code)) {
    return {
      kind: "service",
      title: "Analysis service unavailable",
      detail:
        "The homepage was read, but Jev did not return a result. This is on our side and is retryable.",
    };
  }
  if (fetched) {
    return {
      kind: "unknown",
      title: "Jev didn't return a result",
      detail: "The homepage was fetched, but the classification step returned nothing. This is retryable.",
    };
  }
  return {
    kind: "unknown",
    title: "The analysis did not complete",
    detail: "Retry the analysis, or check the URL and try again.",
  };
}
