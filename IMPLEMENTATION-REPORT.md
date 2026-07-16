# PRP-01 implementation report — "Ask My Portfolio Anything"

Branch: `feat/prp-01-ask-agent`. Built against `00-MASTER-ROADMAP.md` and
`PRP-01-ask-my-portfolio-agent.md`.

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

## Acceptance criteria — self-check

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | curl smoke suite passes against deployed Worker | **Not run live** | `wrangler pages dev` compiled successfully (all bindings resolved) but the sandbox's restricted network egress crashed the local server before it served HTTP (EPIPE from an outbound fetch, not an app bug). `functions/test/smoke.md` has the exact commands — run these against the real deploy. |
| 2 | Golden Q&A eval ≥13/15 | **PASS — 15/15** | `docs/prp-01-eval.md`, `node scripts/test-retrieval.mjs` |
| 3 | Widget keyboard walkthrough, no console errors, JS-disabled = no widget | **Code-complete, not browser-verified** | Focus trap, Escape handler, `aria-*` attributes all present in `ask-agent.js`; needs a real browser pass (no browser in this sandbox) — checklist added to `smoke.md` |
| 4 | No literal API key anywhere in committed files | **PASS** | `git grep`/`grep -rE "AIza[A-Za-z0-9_-]{20,}"` both clean; `.dev.vars` (holds a placeholder test string, not a real key) is gitignored |
| 5 | Lighthouse within 5 pts of baseline | **Not measured** | No browser available in this environment; widget is ~6.8KB JS (2.5KB gzipped), `defer`red, lazy-inits on click — should be negligible, but needs a real Lighthouse run |
| 6 | No HTML rendering of answers (XSS-safe) | **PASS** | `textContent` used throughout `ask-agent.js`; `stripHtml()` also strips tags server-side before the question ever reaches the model; unit-tested in `test-retrieval.mjs` |

## Honest gaps — what Muskan actually needs to do

This is the "won't babysit" accounting, kept as short as the roadmap promised:

1. **Provide the Gemini API key** and set it as a Pages secret (dashboard steps
   in `functions/README.md`) — cannot be done by an agent without the key.
2. **Bind the `RATE_KV` KV namespace** in the same dashboard screen — a
   Git-integrated Pages project doesn't read bindings from `wrangler.toml`.
3. **Merge the branch**, then run `functions/test/smoke.md`'s live curl checks
   once — specifically smoke test #5 (out-of-scope refusal) and the "home
   address" case flagged in `docs/prp-01-eval.md`, since that's the one path
   this environment could not fully verify without a real key.
4. Everything else (corpus content, retrieval, widget, CORS, rate limiting,
   CSP compatibility, styling) is done and self-tested to the limit of what a
   network-restricted sandbox without a browser or a real API key can verify.

## Files changed

**Created:** `data/portfolio-chunks.json`, `functions/api/_shared.js`,
`functions/api/ask.js`, `functions/api/health.js`, `functions/README.md`,
`functions/test/smoke.md`, `assets/js/ask-agent.js`, `wrangler.toml`,
`scripts/test-retrieval.mjs`, `docs/prp-01-eval.md`, `.gitignore` (new),
`IMPLEMENTATION-REPORT.md`.

**Modified:** `index.html` (+1 line, script tag), `portfolio/index.html`
(+CSS block, +1 script tag line), `assets/site.css` (+CSS block).

No other files touched.
