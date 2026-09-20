import posthog from "posthog-js";
import type { AnalysisResponse } from "@/lib/contracts";
import { recordDomain, sanitizeHostname } from "@/lib/domain-tracking";

const POSTHOG_KEY = "phc_p8GorYfAyVVdoUkn7mCKNThib9ceppn9BJeYC5APv3cF";
const POSTHOG_HOST = "https://us.i.posthog.com";

let initialized = false;

export function initAnalytics() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  try {
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      person_profiles: "identified_only",
      autocapture: false,
      capture_pageview: true,
    });
  } catch {
    /* analytics must never block the app */
  }
}

function safeCapture(event: string, properties?: Record<string, unknown>) {
  try {
    posthog.capture(event, properties);
  } catch {
    /* best-effort: never throw from analytics */
  }
}

export function trackAnalysisStarted(url: string, customJudgmentCount: number) {
  const hostname = sanitizeHostname(url);
  if (!hostname) return;
  safeCapture("analysis_started", {
    hostname,
    has_custom_judgments: customJudgmentCount > 0,
    custom_judgment_count: customJudgmentCount,
  });
}

export function trackAnalysisCompleted(result: AnalysisResponse) {
  const hostname = sanitizeHostname(result.url);
  if (!hostname) return;
  safeCapture("analysis_completed", {
    hostname,
    classification_count: result.classifications.length,
    scrape_ms: result.timeline.scrapeMs,
    jev_ms: result.timeline.jevMs,
    total_ms: result.timeline.totalMs,
    characters: result.usage.characters,
  });
}

export function trackDomainVisit(url: string) {
  const hostname = sanitizeHostname(url);
  if (!hostname) return;
  const record = recordDomain(hostname);
  if (record) safeCapture("second_domain_analyzed", { hostname: record.hostname, domain_count: record.domainCount });
}

export function trackResultShared(url: string) {
  const hostname = sanitizeHostname(url);
  if (!hostname) return;
  safeCapture("result_shared", { hostname });
}

export function trackReplynodesCtaClicked(location: "header" | "result_footer") {
  safeCapture("replynodes_cta_clicked", { location });
}

export function trackGithubClicked() {
  safeCapture("github_clicked", { location: "result_footer" });
}
