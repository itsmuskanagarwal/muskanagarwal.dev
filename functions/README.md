# functions/ — Cloudflare Pages Functions (PRP-01, PRP-02)

Phase-0 decision (recorded in IMPLEMENTATION-REPORT.md): implemented as Pages
Functions, not a standalone Worker, because this repo is already a Cloudflare
Pages project. `/api/*` routes are same-origin automatically — no DNS, no zone
route config, and no CSP change needed (the site's existing CSP already allows
`connect-src 'self'`).

## One-time production setup (manual — cannot be done from CI/a coding agent)

1. Cloudflare dashboard → Workers & Pages → this Pages project → Settings → Functions:
   - **KV namespace binding:** variable name `RATE_KV`, bind to a new or existing KV namespace.
   - **Secret:** `GEMINI_API_KEY` → paste the Gemini API key. Never commit this key anywhere.
   - Optional: environment variable `DEV` = `1` on the *preview* environment only (enables localhost CORS for local testing against a deployed preview); leave unset on production.
2. Redeploy (push to the branch, or trigger a retry) so the binding takes effect.
3. Verify: `curl -s https://muskanagarwal.dev/api/health` → `{"ok":true,"version":"prp-01"}`.

## Local dev

```
npx wrangler pages dev . --kv RATE_KV
# then set GEMINI_API_KEY in .dev.vars (gitignored) for local generation calls:
echo 'GEMINI_API_KEY=your-key-here' > .dev.vars
echo 'DEV=1' >> .dev.vars
```

## Endpoints

- `GET  /api/health` → `{ok:true,version}`
- `POST /api/ask` → PRP-01, see PRP-01-ask-my-portfolio-agent.md §6
