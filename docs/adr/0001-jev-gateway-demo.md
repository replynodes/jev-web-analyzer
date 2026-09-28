# ADR 0001: Jev Gateway demo boundaries

## Decision

- Keep one Next.js app as the runtime and public API boundary.
- Treat the public [ReplyNodes Markdown API](https://replynodes.com/markdown-api/) as the source of truth for page Markdown; it requires no ReplyNodes key, account, or credits.
- Run Jev evaluation through the Vercel AI Gateway using canonical model ID `typesafe-ai/jev`; expose the requested public alias `jev-latest`.
- Use a bounded in-process cache and abuse guard.
- Keep the AI Gateway credential server-only; ReplyNodes Markdown access is public and zero-auth.
- Do not add auth, credits, a second database, or a queue.

## Revisit conditions

Revisit these boundaries when multi-instance traffic requires shared controls or when the Gateway contract changes.
