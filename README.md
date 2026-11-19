# Sub Value

**What each AI coding subscription is worth at public API rates.**

Live comparison of sticker price vs **API-equivalent** dollars for Claude, ChatGPT/Codex, MiniMax, GLM, SuperGrok / Grok Build, and related plans.

- Primary source for Anthropic, OpenAI, MiniMax and Z.ai: **[SemiAnalysis subscription study](https://newsletter.semianalysis.com/p/anthropic-subscriptions-offer-5x)** (Oct 5, 2026), which meters each plan token type by token type and prices the full limit at API list rates
- Grok, Gemini, Cursor, Copilot: estimates from July 2026 (not re-checked; lower confidence)

## Headline SemiAnalysis values (October 2026, $200 tier)

| Plan · model | You pay | API-equivalent (agentic) | Chat | Multiplier |
|--------------|--------:|-------------------------:|-----:|-----------:|
| Claude Ultra (was Max 20×) · Sonnet 5.5 | $200 | $12,529 | $7,009 | 62.6× |
| Claude Ultra · Opus 5.5 | $200 | $11,726 | $9,200 | 58.6× |
| Claude Ultra · Fable 5.1 (half the plan) | $200 | $2,485 | $2,480 | 12.4× |
| ChatGPT Pro 200 · GPT-6 Astra | $200 | $2,897 | — | 14.5× |
| ChatGPT Pro 200 · GPT-6.1 Sol | $200 | $2,084 | — | 10.4× |

Lower tiers (Claude Pro / Max, ChatGPT Plus / Pro 100 / Pro 500) and MiniMax / GLM plans are in [`data/plans.json`](data/plans.json).

**Pay-per-token APIs:** the Meta Model API rows (usable with Kilo Code or any bring-your-own-key tool) are not subscriptions. They show $100 of spend at Meta's standard list price: Standard is 1×, while the Contributor tier — where Meta may train on your prompts and outputs — works out to ~35× for agentic coding and ~20× for chat. A "Include pay-per-token APIs" toggle hides them.

These are **ceilings at full utilization** — not typical user spend. Values differ by model, so Claude and ChatGPT plans have one row per model.

The June 2026 SemiAnalysis numbers (Claude $400/$2k/$8k, ChatGPT $700/$3.5k/$14k) are superseded: OpenAI halved its $200 plan, both labs changed API prices, and Anthropic renamed Max 5× → Max and Max 20× → Ultra on Oct 30, 2026.

## Run locally

```bash
# any static server
python3 -m http.server 8080
# open http://localhost:8080
```

Or open `index.html` via a local server (ES modules + `fetch` need a server, not `file://`).

## Data

All plan numbers live in [`data/plans.json`](data/plans.json). Edit that file to update the site — no build step.

## Disclaimer

Not affiliated with SemiAnalysis, Anthropic, OpenAI, xAI, or any provider listed. API list prices and plan limits change. “API-equivalent” is not the same as a lab’s marginal cost of serving subscription traffic.

## License

MIT
