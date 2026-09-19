# ReplyNodes · Jev Web Analyzer

**Unofficial community project, not affiliated with TypeSafe AI.**

A focused adaptation of the Vercel Labs AI SDK Gateway Demo: enter a public URL, let ReplyNodes fetch clean Markdown, then send that state to Jev through the Vercel AI Gateway for typed page classification. It is a developer demo, not a ReplyNodes marketing site.

## Architecture

The browser sends only a URL and at most three bounded custom judgment definitions to `POST /api/analyze`. The Next.js server validates the URL, resolves DNS, calls `GET https://api.replynodes.com/v1/webcontext/scrape?url=...` with `Authorization: Bearer ${REPLYNODES_API_KEY}`, and expects the successful `{ data, meta }` envelope with `meta.request_id`. The clean Markdown in `data` becomes Jev state. Jev receives default page questions plus optional Boolean, Choice, or Score questions in one evaluation through Vercel AI Gateway using `typesafe/jev-latest` and `AI_GATEWAY_API_KEY`. The route returns a stable, sanitized JSON contract; provider errors never cross the boundary.

The server measures scrape, extraction, Jev, and total latency. Successful responses use a bounded five-minute in-memory cache keyed by a SHA-256 digest of the normalized URL and judgment definitions. No database, queue, Redis, or worker service is required.

## Security decisions

- Credentials are server-only environment variables and are never included in client code, HTML, logs, or responses.
- URLs are HTTP(S)-only and reject credentials, fragments, localhost, private/link-local/reserved IPv4 and IPv6, and DNS names resolving to blocked addresses. The request is bounded by timeout, response-size, and redirect limits; ReplyNodes remains the fetch boundary for the target page.
- Request JSON, URL length, question count, names, instructions, labels, options, and rubric sizes are bounded with Zod. Page text is untrusted state, not application instructions.
- A bounded in-memory per-IP token bucket provides basic abuse protection for a single-instance demo. The cache contains only sanitized successful responses and expires automatically.
- Model resolution is displayed only when the installed AI SDK result exposes a safe model identifier. The app does not guess a Jev version.

## Environment

Set these names locally or in deployment; do not commit values:

```text
REPLYNODES_API_KEY
AI_GATEWAY_API_KEY
```

## Local development

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`. There is no mock provider path, so analysis requires both credentials. Run the gates with:

```bash
pnpm test
pnpm type-check
pnpm lint
pnpm build
git diff --check
```

For a real smoke, use a developer's own credentials without committing values:

```bash
REPLYNODES_API_KEY="$REPLYNODES_API_KEY" AI_GATEWAY_API_KEY="$AI_GATEWAY_API_KEY" pnpm dev
curl -sS -X POST http://localhost:3000/api/analyze \
  -H 'content-type: application/json' \
  --data '{"url":"https://example.com","judgments":[]}'
```

Do not call the smoke successful unless it returns HTTP 200 with a real ReplyNodes request ID, measured timeline, Jev answers, and the requested alias. No live smoke is claimed without credentials and HTTP evidence.

## Live demo and deployment

The intended live demo URL is `https://jev.replynodes.com` when deployed by the project owner. Deploy the verified Next.js build with existing Vercel Labs/Vercel conventions and configure only `REPLYNODES_API_KEY` and `AI_GATEWAY_API_KEY` as server environment variables. Verify the page, assets, API errors, and an authorized safe public analysis before sharing. This repository does not create a GitHub repository, push branches, or deploy infrastructure.

## Made with Jev

This is a small Made with Jev submission context: Jev evaluates web context that ReplyNodes has actually fetched, preserving native probabilities and confidence where returned. It is unofficial and does not represent TypeSafe AI. The Vercel Labs AI SDK Gateway Demo license and credit remain in [LICENSE](./LICENSE).

## Non-goals / ADR

No auth, login, credits, pricing, user quotas, client credentials, guessed Jev version, mock runtime, second database, queue, Kafka, or broad refactor. A single Next.js server with bounded in-process cache/rate limiting keeps the public demo inspectable and deployable; a multi-instance production service would need shared controls.
