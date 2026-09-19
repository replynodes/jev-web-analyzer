# What Does Jev Think About Your SaaS?

See what a first-time visitor is likely to understand from your SaaS website.

**ReplyNodes fetches your live website. Jev evaluates what it communicates about your audience, positioning, differentiation, trust, and conversion.**

**[Try the live demo →](https://replynodes.com/jev-web-analyzer/)**

> **Unofficial community project, not affiliated with TypeSafe AI.**

---

## What Jev decides

Jev evaluates your SaaS website from the perspective of a first-time visitor and answers 10 founder-focused questions:

1. **Can someone understand what the product does within 10 seconds?**
2. **Who does the product appear to be for?**
3. **Is the value proposition clear and specific?**
4. **Does the product feel differentiated from similar SaaS products?**
5. **What appears to be the strongest reason to choose this product?**
6. **Is there a clear next action for the visitor?**
7. **Does the website communicate enough trust to try or buy?**
8. **Does the product appear self-serve or sales-led?**
9. **Does the copy feel specific or generic/templated?**
10. **What should the founder change first?**

The result is not an overall SaaS score. It is a set of structured, probabilistic judgments about what the public website appears to communicate.

---

## How it works

Paste any public SaaS URL.

```text
Your website
     ↓
ReplyNodes
fetches the live page and extracts clean Markdown
     ↓
Jev via Vercel AI Gateway
runs structured probabilistic judgments
     ↓
Founder teardown
```

The UI exposes the execution as it happens:

```text
✓ Fetch website with ReplyNodes            0.82s
✓ Extract clean Markdown                   18,421 chars
✓ Prepare context for Jev
✓ Run 10 founder judgments                 0.91s
✓ Build teardown

Total                                      1.76s
```

Timings shown in the app are measured from real execution. The demo does not simulate progress or invent model metadata.

---

## Example output

A teardown is designed to be understandable in seconds:

```text
What Jev thinks about example.com

Understood in 10 sec
Likely yes · 89%

Audience
Developer teams · 94%

Value proposition
Clear · 86%

Differentiation
Moderate

Primary CTA
Get API Key · Clear

Trust signals
Strong

Messaging
Mostly specific

What Jev would change first
Explain the customer outcome before describing the infrastructure.
```

Detailed probabilities and extracted source context remain available for technical inspection without dominating the default view.

---

## Why we built this

Founders spend a lot of time looking at their own websites, which makes it difficult to see them the way a first-time visitor does.

This experiment provides an outside-in view.

**ReplyNodes** retrieves the live website and converts it into clean context. **Jev** then makes structured probabilistic judgments about what that website appears to communicate.

The goal is not to create another SEO score or arbitrary website grade. It is to answer questions founders actually care about:

- Do people understand the product quickly?
- Who does the website appear to target?
- Is the value proposition clear?
- Does the product feel differentiated?
- Is there enough trust to take the next step?
- Is the path to conversion obvious?
- What is the highest-impact thing to improve first?

These are probabilistic interpretations of public website content, not objective ratings of the company or product.

---

## Live execution pipeline

The browser submits a URL to the Next.js server. The server keeps all provider credentials private and orchestrates the analysis.

```text
Browser
  ↓
POST /jev-web-analyzer/api/analyze
  ↓
ReplyNodes Web Scrape API
  ↓
clean Markdown
  ↓
Vercel AI Gateway
  ↓
Jev
  ↓
structured founder judgments
```

The public requested Jev alias is `jev-latest`. The application only displays a resolved model version when explicit provider metadata exposes one. It never guesses or hardcodes the underlying version.

---

## What ReplyNodes does

ReplyNodes is responsible for the live web context:

- fetch the public website
- extract the primary page content
- convert it to clean Markdown
- return request metadata for traceability

The target page itself is treated as untrusted input.

## What Jev does

Jev is responsible for the structured probabilistic judgments over that context.

The demo uses Jev through **Vercel AI Gateway** and preserves the returned probabilities/confidence where available.

---

## Run locally

### Requirements

- Node.js
- pnpm
- a ReplyNodes API key
- Vercel AI Gateway credentials

Set:

```bash
REPLYNODES_API_KEY=...
AI_GATEWAY_API_KEY=...
```

Then:

```bash
pnpm install
pnpm dev
```

Open:

```text
http://localhost:3000/jev-web-analyzer/
```

There is no mocked provider path. A real analysis requires both credentials.

### Quality gates

```bash
pnpm test
pnpm type-check
pnpm lint
pnpm build
git diff --check
```

---

## API behavior

The frontend calls:

```text
POST /jev-web-analyzer/api/analyze
```

The server:

1. validates the target URL
2. calls the production ReplyNodes Web Scrape API
3. extracts the returned clean Markdown
4. prepares the Jev state
5. sends the founder judgments through Vercel AI Gateway
6. returns a sanitized result contract
7. streams execution events when NDJSON is requested

Streaming responses use:

```text
application/x-ndjson; charset=utf-8
```

This lets the UI progressively mark each real execution stage as completed.

---

## Security

This is a public demo, so the server includes basic protections:

- API credentials remain server-side
- only HTTP(S) public URLs are accepted
- localhost, credentials-in-URL, and blocked/private network targets are rejected
- DNS results are checked against blocked address ranges
- request size, redirect count, response size, and execution time are bounded
- custom judgment inputs are schema-validated and bounded
- page content is treated as untrusted data, not application instructions
- successful results use a short-lived bounded in-memory cache
- basic in-memory per-IP abuse protection is applied
- provider/model metadata is allowlisted and sanitized before display

The current demo intentionally avoids a database, queue, Redis dependency, authentication system, or user credit system.

---

## Deployment

The production demo is available at:

**https://replynodes.com/jev-web-analyzer/**

The Next.js app runs as a standalone service behind the main ReplyNodes domain. When using nginx or another reverse proxy for the streaming endpoint, buffering should be disabled so execution events reach the browser progressively.

Example requirement:

```nginx
proxy_buffering off;
```

Configure only the required server-side environment variables:

```text
REPLYNODES_API_KEY
AI_GATEWAY_API_KEY
```

Never expose these values to the browser.

---

## Made with Jev

Jev is responsible for the structured probabilistic judgments in this experiment. ReplyNodes provides the live web context Jev evaluates.

A concise description for showcase listings:

> Jev evaluates what a first-time visitor is likely to understand from a SaaS website: who the product is for, whether the value proposition is clear, how differentiated it feels, whether the site communicates enough trust to convert, how specific the messaging is, and what the founder should improve first.

---

## Non-goals

This project is intentionally not:

- an SEO audit
- an overall SaaS grading system
- an AI-content detector
- a replacement for customer research
- a factual assessment of company quality or trustworthiness
- a database or leaderboard of SaaS companies

The current phase is focused on one experience:

**Paste your SaaS → watch ReplyNodes + Jev analyze it → get a founder-relevant teardown worth sharing.**

---

## Credits

Built with:

- [ReplyNodes](https://replynodes.com/) for live web context
- Jev by TypeSafe AI for structured probabilistic judgments
- Vercel AI Gateway
- Vercel AI SDK
- Next.js

The UI was originally bootstrapped from the Vercel Labs AI SDK Gateway Demo. Its original license and attribution remain in [LICENSE](./LICENSE).

---

**ReplyNodes fetches the web. Jev judges what it communicates.**
