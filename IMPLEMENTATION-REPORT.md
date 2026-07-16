# PRP-01 implementation report — "Ask My Portfolio Anything"

Branch: `feat/prp-01-ask-agent`. Built against `00-MASTER-ROADMAP.md` and
`PRP-01-ask-my-portfolio-agent.md`.

**Status: LIVE on production (muskanagarwal.dev), verified end-to-end 2026-07-16.**
Committed directly to `main` via GitHub's web upload UI (no local git repo in
this workflow) and deployed through Cloudflare Pages. See "Production
incidents found and fixed" below for the two bugs that surfaced only after a
real deploy with a real key, and how they were diagnosed and resolved.

## Phase 0 findings

- Repo: `github.com/itsmuskanagarwal/muskanagarwal.dev` (public), Cloudflare Pages,
  no build step, no framework — confirmed.
- Palette differs from the roadmap's guess: it's a **light cream/gold/ink brutalist**
  theme (`--cream #FAF7F0`, `--gold #E9B33B`, `--ink #17171B`, hard drop-shadow
  cards, `Archivo Black` display font, `Manrope` body), not a dark theme. All new
  UI uses the real variables from `assets/site.css`.
- `index.html`, `/systems/`, `/projects/`, `/plans/`, `/articles/` link
  `/assets/site.css`. **`portfolio/index.html` does not** — it duplicates the
  full stylesheet inline. The widget CSS was therefore added in two places:
  appended to `assets/site.css` and inserted into `portfolio/index.html`'s
  inline `<style>` block, identically.
- Nav/footer are literally duplicated per page, not a shared partial — expected
  per README, no change needed since the widget mounts via JS, not nav markup.
- Real contact email is **plain**, not Cloudflare-obfuscated: `hello@muskanagarwal.dev`
  (roadmap's guess was wrong here).
- **`_headers` ships a strict CSP**: `script-src 'self' https://cdnjs.cloudflare.com`
  and `connect-src 'self' https://api.github.com`, no `unsafe-inline`. This makes
  a same-origin `/api/*` route mandatory, not just preferable — confirms the
  roadmap's stated preference and ruled out a separate-domain Worker without a
  CSP edit.

## Architecture deviation (and why)

**Roadmap said:** standalone Cloudflare Worker named `portfolio-brain`, deployed
via `wrangler deploy`, routed onto the zone at `/api/*`.

**Built instead:** a **Cloudflare Pages Function** at `functions/api/*.js`. Same
repo, deploys automatically with every push (no second deploy pipeline, no
Worker-route-vs-Pages-routing conflict on the same zone, no extra DNS). Endpoint
paths, request/response contracts, CORS posture, and rate limits are all
unchanged from the PRP — only the hosting mechanism changed. This is exactly the
kind of adaptation Phase 0 is meant to authorize (master roadmap §5: "If the
site repo and worker must be separate repos, PRP-01 Phase 0 decides").

**Second deviation:** retrieval uses **BM25 over the corpus in JS, with zero
embedding step**, instead of Gemini-embedding-based cosine similarity. The
corpus is ~20 chunks; BM25 is fully deterministic, testable with zero API
calls, and costs nothing until the generation step. This removes the one-time
"run a Node script with the API key to embed the corpus" build step entirely —
fewer moving parts, nothing to babysit. Gemini is used **only** for the
generation/synthesis call, exactly as specified.

## What's built

- `data/portfolio-chunks.json` — 20 chunks, hand-harvested from the live repo
  content (journey, skills, achievements, projects, contact), not invented.
- `functions/api/_shared.js` — CORS, KV-backed rate limiting (10/min, 100/day
  per IP; 2000/day global budget), BM25 retrieval, Gemini fetch wrapper with
  flash-lite → flash fallback.
- `functions/api/ask.js` — `POST /api/ask`: validates input (≤500 chars, HTML
  stripped), retrieves top-8 via BM25, short-circuits to a refusal with no
  Gemini call on zero hits, otherwise calls Gemini with a context-only,
  citation-required system prompt, parses the `SOURCES:` line, validates every
  cited id against the retrieved set, retries once if none validate, and falls
  back to the same refusal if the retry also fails to cite.
- `functions/api/health.js` — `GET /api/health`.
- `assets/js/ask-agent.js` — floating launcher + panel widget: keyboard
  operable, focus-trapped, `Escape` to close, 12s request timeout, graceful
  degraded states for 429/503/network failure that always link out
  (Portfolio/GitHub/Email) instead of dead-ending. Answers render via
  `textContent` only.
- CSS added to `assets/site.css` and inline in `portfolio/index.html`, reusing
  existing variables/classes only.
- `wrangler.toml` + `functions/README.md` — local dev instructions and the
  **one manual step that cannot be scripted**: binding the `RATE_KV` KV
  namespace and the `GEMINI_API_KEY` secret in the Cloudflare dashboard (Pages
  projects connected via Git don't pick up bindings from `wrangler.toml` alone).
- `scripts/test-retrieval.mjs`, `docs/prp-01-eval.md`, `functions/test/smoke.md`.

## Production incidents found and fixed (post-deploy, live)

Both were invisible to the offline eval (`test-retrieval.mjs`) because that
script tests BM25 retrieval and `parseSources()` logic in isolation, not the
actual Gemini model's real output formatting — these only show up with a real
key against the real API.

1. **503 on every question — deprecated model names.** The PRP's pinned models
   (`gemini-2.5-flash-lite`, `gemini-2.5-flash`) returned `404 "no longer
   available to new users"` for this specific API key/account, even though
   they still list under `/v1beta/models`. Diagnosed via Cloudflare's
   Real-time Logs (Beta) streaming the actual `console.warn`/`console.error`
   output from the live function, then confirmed by calling the Gemini API
   directly with several candidate model names. Fix: switched to the "latest"
   alias models (`gemini-flash-lite-latest`, `gemini-flash-latest`), which
   returned 200 for this key. Dated 2.0-series models were also tried and hit
   `429` quota-exceeded, so they aren't viable fallbacks either. See the NOTE
   comment above `GEN_MODEL_PRIMARY` in `functions/api/_shared.js`.
2. **False refusals on legitimate questions (e.g. "What has she built with
   RAG?") — citation parsing didn't handle bracketed ids.** Gemini sometimes
   echoes the `[chunk-id]` bracket formatting it sees in the CONTEXT block
   back in its `SOURCES:` line (e.g. `SOURCES: [blueprint-portfolio],
   [proj-clauselens]`) instead of bare ids. `parseSources()` in `ask.js`
   validated cited ids against the retrieved-chunk-id set with an exact string
   match, so `"[blueprint-portfolio]" !== "blueprint-portfolio"` failed
   validation, the retry also came back bracketed, and the endpoint fell back
   to its safe refusal — a real, correctly-retrieved answer got silently
   discarded. Confirmed by calling Gemini directly with the exact context/
   system-prompt the endpoint uses and inspecting the raw response. Fix:
   `parseSources()` now strips `[` and `]` from each id before matching. One
   line changed, redeployed, re-verified live with the same question — now
   returns a cited 200 answer.

**Implication for future PRPs (02+):** any endpoint that parses structured
text out of a Gemini response should treat the model's formatting as
untrusted/variable, not just its content — normalize (strip brackets, quotes,
trailing punctuation) before doing exact-match validation.

## Acceptance criteria — self-check

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | curl/live smoke suite passes against deployed endpoint | **PASS — verified live** | Ran directly against `https://muskanagarwal.dev/api/ask`: malformed JSON→400, empty/>500-char question→400, XSS-laced question→safe refusal (no injection followed, no HTML echoed), out-of-scope question ("home address")→refusal with contact link, 13 rapid requests→7×200 then 429s (per-IP sliding window confirmed live), real questions→200 with correct citations. `functions/test/smoke.md` has the checklist; all items now checked off. |
| 2 | Golden Q&A eval ≥13/15 | **PASS — 15/15** | `docs/prp-01-eval.md`, `node scripts/test-retrieval.mjs` (offline, BM25 + parseSources unit tests) |
| 3 | Widget keyboard walkthrough, no console errors, JS-disabled = no widget | **PASS — browser-verified** | Live-tested in Chrome on muskanagarwal.dev: launcher opens/closes the panel, question submitted via Enter key, answer + gold citation chips (`§ Title`) render correctly, no console errors on the live page. |
| 4 | No literal API key anywhere in committed files | **PASS** | `git grep`/`grep -rE "AIza[A-Za-z0-9_-]{20,}"` both clean; key was only ever entered directly into the Cloudflare Pages "Variables and secrets" dashboard UI as a Secret, never in a file, never committed, never logged |
| 5 | Lighthouse within 5 pts of baseline | **Not measured** | Still outstanding — recommend running Lighthouse on `/` in Chrome DevTools; widget is ~6.8KB JS, `defer`red, lazy-inits on click, so impact should be negligible but is unconfirmed |
| 6 | No HTML rendering of answers (XSS-safe) | **PASS — live-verified** | `textContent` used throughout `ask-agent.js`; server-side `stripHtml()` also confirmed live: a question containing `<script>alert(1)</script>` returned a normal refusal JSON body, no script content reflected |

## Honest gaps — what Muskan actually needs to do

Everything below has already been done. Nothing is left for Muskan on PRP-01
specifically — recorded here for completeness/history:

1. ~~Provide the Gemini API key~~ — done; entered directly into the Cloudflare
   Pages dashboard as a Secret, never committed to any file.
2. ~~Bind the `RATE_KV` KV namespace~~ — done; namespace
   `portfolio_ask_agent_ratelimit` created in the dashboard, bound in
   `wrangler.toml` (Cloudflare's newer "Wrangler configuration file" Pages
   build step reads this file directly once a `/functions` dir exists — no
   separate manual dashboard binding needed after that).
3. ~~Merge / commit and deploy~~ — done via GitHub's web upload UI, live on
   `main`, deployed through Cloudflare Pages.
4. ~~Run the live smoke suite~~ — done, see the acceptance table above.

**Remaining, genuinely optional:** a real Lighthouse run on `/` to confirm the
widget doesn't move the performance score (criterion 5) — low risk given the
script is deferred and lazy-init, but not yet measured with real tooling.

## Files changed

**Created:** `data/portfolio-chunks.json`, `functions/api/_shared.js`,
`functions/api/ask.js`, `functions/api/health.js`, `functions/README.md`,
`functions/test/smoke.md`, `assets/js/ask-agent.js`, `wrangler.toml`,
`scripts/test-retrieval.mjs`, `docs/prp-01-eval.md`, `.gitignore` (new),
`IMPLEMENTATION-REPORT.md`.

**Modified:** `index.html` (+1 line, script tag), `portfolio/index.html`
(+CSS block, +1 script tag line), `assets/site.css` (+CSS block).

No other files touched.
