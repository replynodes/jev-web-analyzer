# Jev Web Analyzer

**Learn Jev with real web data.**

Jev Web Analyzer is a small, inspectable example of using **Jev** to make typed probabilistic judgments over live website content.

Paste a URL. **ReplyNodes** fetches the page and turns it into clean Markdown. **Jev**, through **Vercel AI Gateway**, evaluates that state with structured questions and returns decisions with probabilities.

**[Try the live demo →](https://replynodes.com/jev-web-analyzer/)**

<a href="https://replynodes.com/jev-web-analyzer/">
  <img src="./docs/images/jev-web-analyzer-hero.svg" alt="Jev Web Analyzer — paste a SaaS website and see what Jev thinks" width="100%">
</a>

> **Unofficial community project, not affiliated with TypeSafe AI.**

## What this demo teaches

The SaaS website teardown is only an example workload. The main purpose of this repo is to make Jev's evaluation pattern easy to see, run, modify, and reuse.

| Jev capability | How this project demonstrates it |
| --- | --- |
| **Choice judgments** | Infer audience, clarity, differentiation, CTA, trust, and product motion |
| **Boolean judgments** | Add your own yes/no evaluation |
| **Score judgments** | Add your own ordered rubric |
| **Probabilities** | Inspect the distribution behind a decision |
| **Multiple judgments** | Evaluate the same state against many questions in one call |
| **Custom questions** | Add Boolean, Choice, or Score judgments from the UI |
| **Real-world state** | Evaluate live Markdown instead of a synthetic prompt |

The useful output is not a long generated review. It is a set of **explicit decisions over shared state**, with probabilities that software can inspect.

## How it works

```text
Public URL
   ↓
ReplyNodes
fetch + extract clean Markdown
   ↓
Jev via Vercel AI Gateway
typed questions over the same state
   ↓
structured decisions + probabilities
```

The UI also exposes the real execution pipeline:

```text
✓ Fetch website with ReplyNodes
✓ Extract clean Markdown
✓ Prepare context for Jev
✓ Run Jev judgments
✓ Build result
```

Timings are measured from real execution. The app does not simulate progress or invent model metadata.

## The Jev pattern

The core of the project is intentionally small. The server uses the AI SDK evaluation API like this:

```ts
import { experimental_evaluate as evaluate } from "ai";

const result = await evaluate({
  model: "typesafe-ai/jev",
  state: markdown,
  questions: {
    value_proposition: {
      type: "choice",
      instructions: "Is the value proposition clear and specific?",
      criteria: {
        clear: "The value proposition is clear and specific",
        partly_clear: "Some important parts are unclear",
        unclear: "The value proposition is unclear",
      },
    },
  },
});

console.log(result.answers);
```

In this repo, the same call evaluates ten default founder questions plus any custom questions added by the user.

See:

- [`app/api/analyze/route.ts`](./app/api/analyze/route.ts) — Jev evaluation and streaming pipeline
- [`lib/founder-questions.ts`](./lib/founder-questions.ts) — example typed questions
- [`lib/contracts.ts`](./lib/contracts.ts) — request and response contracts
- [`components/analyzer.tsx`](./components/analyzer.tsx) — interactive demo UI

## Example workload: SaaS website teardown

The included demo asks Jev what a first-time visitor is likely to understand from a SaaS website.

Examples:

- Can someone understand the product within 10 seconds?
- Who does the page appear to target?
- Is the value proposition clear?
- Does the product feel differentiated?
- Is the primary CTA clear?
- What trust signals are communicated?
- Does the motion appear self-serve or sales-led?
- Does the copy feel specific or generic?
- What should the founder change first?

These questions are deliberately easy to replace. The project is meant to show the pattern, not prescribe the use case.

## Try your own judgments

The UI supports up to three custom judgments.

### Boolean

```text
Is this page written for technical users?
→ yes / no + probabilities
```

### Choice

```text
What kind of page is this?
→ docs / landing page / blog / pricing + probabilities
```

### Score

```text
How technically detailed is this page?
→ ordered rubric + score distribution
```

This is the part to modify if you want to experiment with Jev for classification, filtering, routing, evaluation, moderation, ranking signals, or other structured decision tasks.

## Run it locally

### 1. Clone

```bash
git clone https://github.com/replynodes/jev-web-analyzer.git
cd jev-web-analyzer
pnpm install
```

### 2. Configure credentials

Create `.env.local`:

```bash
REPLYNODES_API_KEY=...
AI_GATEWAY_API_KEY=...
```

- ReplyNodes provides the live web context.
- Vercel AI Gateway provides access to Jev.

The app has no mock provider path, so real analysis requires both credentials.

### 3. Start

```bash
pnpm dev
```

Open:

```text
http://localhost:3000/jev-web-analyzer/
```

### 4. Run the checks

```bash
pnpm test
pnpm type-check
pnpm lint
pnpm build
```

## Make it your own

The easiest ways to experiment are:

1. Edit [`lib/founder-questions.ts`](./lib/founder-questions.ts) and replace the default judgments.
2. Keep ReplyNodes as the state source, or replace the state with your own text/data.
3. Change how the UI presents probabilities and decisions.
4. Add a new example workload that demonstrates a useful Jev capability.

A useful contribution does not need to make the project bigger. Small examples that make a Jev behavior easier to understand are especially welcome.

## Contributing

Contributions are welcome.

Good contribution ideas include:

- new Jev judgment examples
- better Boolean / Choice / Score demos
- clearer probability visualizations
- examples using different kinds of web pages
- improvements to execution tracing
- tests and edge-case handling
- documentation that makes Jev easier to learn
- accessibility and UI improvements

Suggested workflow:

```bash
# fork the repository first
git clone https://github.com/<your-username>/jev-web-analyzer.git
cd jev-web-analyzer

git checkout -b my-improvement
pnpm install

# make your changes
pnpm test
pnpm type-check
pnpm lint
pnpm build

git push origin my-improvement
# then open a pull request
```

Please keep pull requests focused and explain **what Jev capability the change helps demonstrate or understand**.

If you are unsure where to start, open an issue or propose a small example before building a large feature.

## Architecture

```text
Browser
  ↓
Next.js /api/analyze
  ├─ ReplyNodes Web Scrape API
  │    ↓
  │  clean Markdown
  │
  └─ Vercel AI Gateway
       ↓
      Jev
       ↓
structured answers
```

The server keeps credentials private, validates public URLs, treats webpage content as untrusted state, and supports NDJSON streaming so the UI can show real execution stages as they complete.

The requested Jev alias shown to users is `jev-latest`. The implementation routes through the Vercel AI Gateway model ID `typesafe-ai/jev`. A resolved model version is displayed only when provider metadata explicitly exposes one.

## Why ReplyNodes is here

Jev needs state to evaluate.

For this demo, ReplyNodes turns a live public webpage into clean Markdown so Jev can focus on the decision layer:

**ReplyNodes fetches the web. Jev judges what it means.**

You can keep that pipeline when cloning the project, or replace the input state with data from your own application.

## License

Apache-2.0. See [LICENSE](./LICENSE).

The UI was originally bootstrapped from the Vercel Labs AI SDK Gateway Demo; its original license and attribution remain in the repository.

## Built with

<table>
  <tr>
    <td align="center" width="220">
      <a href="https://replynodes.com/"><img src="./public/brand/replynodes.svg" alt="ReplyNodes" height="34"></a><br>
      <sub>Live web context</sub>
    </td>
    <td align="center" width="220">
      <a href="https://typesafe.ai/"><img src="./public/brand/typesafe-jev.svg" alt="Jev by TypeSafe AI" height="34"></a><br>
      <sub>Typed probabilistic judgments</sub>
    </td>
    <td align="center" width="220">
      <a href="https://vercel.com/ai-gateway"><img src="./public/brand/vercel.svg" alt="Vercel" height="28"></a><br>
      <sub>AI Gateway</sub>
    </td>
  </tr>
</table>

---

**Built to explore Jev, not to hide it behind another black box.**
