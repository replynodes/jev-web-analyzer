# ReplyNodes · Jev Web Analyzer

Unofficial community project, not affiliated with TypeSafe AI.

A focused adaptation of the Vercel Labs AI SDK Gateway Demo: enter a public URL, let ReplyNodes fetch clean Markdown, then send that state to Jev through the Vercel AI Gateway for typed page classification. It is a developer demo, not a ReplyNodes marketing site.

The public requested model alias is exactly `jev-latest`. Vercel AI Gateway's canonical evaluation model ID is `typesafe-ai/jev`, which routes the Jev latest model; this project does not claim an exact underlying version.

## Architecture

The browser sends only a URL and at most three bounded custom judgment definitions to `POST /jev-web-analyzer/api/analyze`. The Next.js server validates the URL, resolves DNS, calls `GET https://api.replynodes.com/v1/webcontext/scrape?url=...` with `Authorization: Bearer ${REPLYNODES_API_KEY}`, and expects the successful `{ data, meta }` envelope with `meta.request_id`. The clean Markdown in `data` becomes Jev state. Jev receives default page questions plus optional Boolean, Choice, or Score questions in one evaluation through Vercel AI Gateway using canonical model ID `typesafe-ai/jev` and `AI_GATEWAY_API_KEY`. The default response is a stable, sanitized JSON contract. With `Accept: application/x-ndjson`, the same operation emits flushed typed events in awaited order; failures emit a sanitized `error` event, and cache hits emit a compact trace using the recorded result without pretending to fetch again.

The server measures scrape, extraction, Jev, and total latency. Successful responses use a bounded five-minute in-memory cache keyed by a SHA-256 digest of the normalized URL and judgment definitions. No database, queue, Redis, or worker service is required.

Streaming responses use `application/x-ndjson; charset=utf-8`, `Cache-Control: no-cache`, and `X-Accel-Buffering: no`. If nginx fronts the service, disable proxy buffering for the analysis location so real stage events can arrive progressively. The UI displays only measured timings, returned token usage, returned probabilities, and explicit provider metadata.

## Security decisions

- Credentials are server-only environment variables and are never included in client code, HTML, logs, or responses.
- URLs are HTTP(S)-only and reject credentials, fragments, localhost, private/link-local/reserved IPv4 and IPv6, and DNS names resolving to blocked addresses. The request is bounded by timeout, response-size, and redirect limits; ReplyNodes remains the fetch boundary for the target page.
- Request JSON, URL length, question count, names, instructions, labels, options, and rubric sizes are bounded with Zod. Page text is untrusted state, not application instructions.
- A bounded in-memory per-IP token bucket provides basic abuse protection for a single-instance demo. The cache contains only sanitized successful responses and expires automatically.
- A resolved model/version is displayed only when explicit, allowlisted provider metadata supplies a sanitized value. The app never treats the SDK response model ID or the `jev-latest` alias as a resolved version.

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

Open `http://localhost:3000/jev-web-analyzer/`. There is no mock provider path, so analysis requires both credentials. Run the gates with:

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
curl -sS -X POST http://localhost:3000/jev-web-analyzer/api/analyze \
  -H 'content-type: application/json' \
  --data '{"url":"https://example.com","judgments":[]}'
```

Do not call the smoke successful unless it returns HTTP 200 with a real ReplyNodes request ID, measured timeline, Jev answers, and the requested alias. No live smoke is claimed without credentials and HTTP evidence.

## Live demo and deployment

The live demo is `https://replynodes.com/jev-web-analyzer/`. For deployment, run the verified Next.js service on loopback and configure only `REPLYNODES_API_KEY` and `AI_GATEWAY_API_KEY` as server environment variables. Configure nginx to proxy `/jev-web-analyzer/` to the loopback Next service while preserving the `/jev-web-analyzer/` prefix, including for `/jev-web-analyzer/api/analyze`; the Next.js `basePath` then resolves the existing `app/api/analyze/route.ts` route. Set `proxy_buffering off;` for the streaming API location. Verify the page, assets, API errors, and an authorized safe public analysis before sharing. This repository does not create a GitHub repository, push branches, or deploy infrastructure.

## Made with Jev

This is a small Made with Jev submission context: Jev evaluates web context that ReplyNodes has actually fetched, preserving native probabilities and explicit TypeSafe confidence where returned. It is unofficial and does not represent TypeSafe AI. The Vercel Labs AI SDK Gateway Demo license and credit remain in [LICENSE](./LICENSE).

## Non-goals / ADR

No auth, login, credits, pricing, user quotas, client credentials, guessed Jev version, mock runtime, second database, queue, Kafka, or broad refactor. A single Next.js server with bounded in-process cache/rate limiting keeps the public demo inspectable and deployable; revisit the design when multi-instance traffic requires shared controls or the Gateway contract changes.
