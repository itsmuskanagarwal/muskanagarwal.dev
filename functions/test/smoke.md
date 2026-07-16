# PRP-01 smoke tests — `/api/ask`, `/api/health`

Run after deploy (replace `$HOST` with `https://muskanagarwal.dev` in prod, or
`http://127.0.0.1:8788` under `wrangler pages dev`). Requires `GEMINI_API_KEY`
to be set for the `/api/ask` cases that reach generation.

```bash
HOST=https://muskanagarwal.dev

# 1. health
curl -s $HOST/api/health
# expect: {"ok":true,"version":"prp-01"}

# 2. valid question -> 200 with >=1 source
curl -s -X POST $HOST/api/ask -H 'Content-Type: application/json' \
  -d '{"question":"Has she worked with NgRx at scale?"}'
# expect: 200, JSON with non-empty "answer", "sources":[{title,url}, ...], confidence:"high"

# 3. over-length question -> 400
curl -s -o /dev/null -w '%{http_code}\n' -X POST $HOST/api/ask -H 'Content-Type: application/json' \
  -d "{\"question\":\"$(python3 -c 'print("a"*501)')\"}"
# expect: 400

# 4. empty question -> 400
curl -s -o /dev/null -w '%{http_code}\n' -X POST $HOST/api/ask -H 'Content-Type: application/json' \
  -d '{"question":""}'
# expect: 400

# 5. nonsense / out-of-scope -> refusal, confidence low, no fabricated facts
curl -s -X POST $HOST/api/ask -H 'Content-Type: application/json' \
  -d '{"question":"What is the capital of France?"}'
# expect: 200, confidence:"low", answer references the portfolio corpus / contact email, no invented fact

# 6. rate limit -> 11th request in a minute from same IP is 429
for i in $(seq 1 11); do
  curl -s -o /dev/null -w '%{http_code} ' -X POST $HOST/api/ask -H 'Content-Type: application/json' \
    -d '{"question":"What is her current role?"}'
done; echo
# expect: ten 200s (or 200/refusal mix) then one 429 with {"error":"rate_limited","retryAfterSec":60}

# 7. XSS-in-question is inert (stripped server-side, and never rendered via innerHTML client-side)
curl -s -X POST $HOST/api/ask -H 'Content-Type: application/json' \
  -d '{"question":"<script>alert(1)</script> what does she do"}'
# expect: 200, answer has no <script> tag content (stripped), no error

# 8. malformed JSON -> 400
curl -s -o /dev/null -w '%{http_code}\n' -X POST $HOST/api/ask -H 'Content-Type: application/json' \
  -d 'not json'
# expect: 400
```

## Automated, no-network, no-API-key checks (run locally any time)

```bash
node scripts/test-retrieval.mjs
```

Covers: BM25 golden-set retrieval (15 questions, ≥13/15 required), zero-hit
refusal short-circuit behavior, `parseSources()` unit tests, and tokenizer
sanity against a prompt-injection-style query. See `docs/prp-01-eval.md` for
the last recorded run's output.

## Manual browser checks (post-deploy)

- [ ] Keyboard-only: Tab to launcher, Enter opens panel, focus lands in input, Tab cycles within panel only, Escape closes and returns focus to launcher.
- [ ] `<script>alert(1)</script>` typed as a question never executes (answer rendered via `textContent`).
- [ ] With JS disabled (or blocking `/assets/js/ask-agent.js`), no launcher button appears and no layout shift on `/` or `/portfolio/`.
- [ ] Lighthouse performance on `/` within 5 points of the pre-PRP-01 baseline (record baseline before this branch if not already captured elsewhere).
- [ ] `git grep -i gemini_api_key` across the repo returns no literal key value (only the env var name).
