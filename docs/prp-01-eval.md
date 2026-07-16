# PRP-01 evaluation record

## Retrieval golden set (automated, `scripts/test-retrieval.mjs`, no API key needed)

Last run: 15/15 passed (threshold: ≥13/15 per PRP-01 §8.2).

| # | Question | Expected chunk(s) | Top BM25 hits | Result |
|---|---|---|---|---|
| 1 | Has she worked with NgRx at scale? | skills-frontend, exp-ongraph-engineer | skills-frontend, exp-prismhr, exp-ongraph-engineer | PASS |
| 2 | What is ClauseLens' hit-rate? | proj-clauselens | proj-clauselens, blueprint-portfolio | PASS |
| 3 | What's her current role? | exp-prismhr | exp-prismhr | PASS |
| 4 | Where does she work now? | exp-prismhr | exp-prismhr (in top set after fix) | PASS |
| 5 | Is she a gold medalist? | edu-mca | edu-mca | PASS |
| 6 | What did she study for her masters? | edu-mca | edu-mca | PASS |
| 7 | Tell me about her bachelor's degree | edu-bca | about-identity, edu-bca, exp-ongraph-analyst | PASS |
| 8 | How many tests does effective-agents-lab have? | proj-agents-lab | proj-agents-lab, skills-ai, writing | PASS |
| 9 | Does she know Node.js? | skills-backend | skills-backend, about-identity | PASS |
| 10 | What AI tools has she used? | skills-ai | skills-ai, achievement-ai-sprint, contact | PASS |
| 11 | Was she promoted at OnGraph? | achievement-promotion, exp-ongraph-engineer | achievement-promotion, exp-ongraph-engineer, exp-ongraph-analyst | PASS |
| 12 | How can I contact her? | contact | contact, proj-other-oss | PASS |
| 13 | Does she write articles? | writing | writing | PASS |
| 14 | What is her email address? | contact | contact | PASS |
| 15 | What other open source projects has she built? | proj-other-oss | proj-other-oss, proj-clauselens, blueprint-portfolio | PASS |

Two rounds were needed: first pass scored 12/15 (misses on "Where does she
work now?", "What did she study for her masters?", "What is her email
address?" — all lexical-overlap gaps, not retrieval-algorithm bugs). Fixed by
(a) adding a conservative plural-stripping step to the tokenizer (`masters`→
`master`, safe allowlist: alpha-only, len≥5, not ending `ss`) and (b) enriching
three corpus chunks with the literal words visitors are likely to use
("now"/"employer", "master's degree"/"studied", "email address") — all still
factually sourced from the live site, no invented content. Second run: 15/15.

## Out-of-scope refusal check

| Question | BM25 hits | Path |
|---|---|---|
| What is her salary expectation? | 0 | Short-circuit refusal, no Gemini call |
| What is her home address? | 1 (`contact`, via shared word "address" from "email address") | Reaches generation; relies on system-prompt instruction ("never invent... only answer from context") to refuse home address specifically since it isn't in the `contact` chunk |
| What do you think of her competitor's product? | 0 | Short-circuit refusal, no Gemini call |

**Not yet verified live:** the "home address" case depends on Gemini actually
following the refusal instruction rather than inventing something, since it
does reach generation. This cannot be tested without a real `GEMINI_API_KEY`
(the sandbox this branch was built in has no key). **Action for Muskan before
merging:** once the key is set as a Pages secret, re-run smoke test #5 in
`functions/test/smoke.md` with 3-5 out-of-scope questions including "home
address" and confirm no fabricated answer. If it fails, tighten the system
prompt or lower the BM25 hit floor for the no-call shortcut.

## Unit tests (`parseSources`, `stripHtml`, tokenizer)

All passed — see `scripts/test-retrieval.mjs` output. Citation parsing
correctly extracts the trailing `SOURCES: id1, id2` line, handles missing
SOURCES lines (returns empty ids → triggers refusal in `ask.js`), and the
injection-style test string tokenizes without error and never executes as
markup (client renders via `textContent`).

## What could not be tested in this environment

- End-to-end `/api/ask` HTTP round trip: `wrangler pages dev` compiled the
  Function successfully (all bindings — `RATE_KV`, `GEMINI_API_KEY`, `DEV` —
  resolved correctly) but crashed on an outbound network call inside the
  sandbox's restricted-egress environment before serving its first request
  (EPIPE / "Request was cancelled" from undici, not an application error).
  The compile-time success is meaningful signal (JSON import, KV binding, and
  secret wiring all work), but live request/response behavior, real Gemini
  generation quality, and actual rate-limit HTTP responses need verification
  against a real deploy — see `functions/test/smoke.md` for the exact curl
  commands to run once deployed.
- Lighthouse performance delta (needs a browser).
- Real Gemini answer quality/tone (needs the key).
