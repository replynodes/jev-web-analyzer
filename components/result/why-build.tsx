import { trackGithubClicked, trackReplynodesCtaClicked } from "@/lib/analytics";
import { ProvenanceTag } from "./provenance-tag";

export function WhyBuild() {
  return (
    <section className="rounded-xl border border-dashed bg-card p-4 md:p-5">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-medium">Why did we build this?</h3>
        <ProvenanceTag kind="ui" />
      </div>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Founders struggle to see their site like first-time visitors. ReplyNodes retrieves and converts live website
        content to clean context, and Jev makes structured probabilistic judgments. This is not an SEO score, objective
        company or product rating, AI detector, replacement for customer research, or definitive SaaS score.
      </p>
      <p className="mt-4 overflow-x-auto whitespace-nowrap rounded-lg bg-muted px-3 py-3 font-mono text-xs">
        Your website → ReplyNodes (live web → clean context) → Jev (structured judgments) → Founder teardown
      </p>
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <a
          className="underline underline-offset-4"
          href="https://replynodes.com/"
          target="_blank"
          rel="noreferrer"
          onClick={() => trackReplynodesCtaClicked("result_footer")}
        >
          Build with ReplyNodes
        </a>
        <a
          className="underline underline-offset-4"
          href="https://github.com/replynodes/jev-web-analyzer"
          target="_blank"
          rel="noreferrer"
          onClick={() => trackGithubClicked()}
        >
          View source on GitHub
        </a>
        <span className="text-xs text-muted-foreground">Unofficial community project, not affiliated with TypeSafe AI.</span>
      </div>
    </section>
  );
}
