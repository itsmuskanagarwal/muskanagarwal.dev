# muskanagarwal — personal site

Static multi-page site. No build step, no framework, no secrets anywhere in the repo.

## Structure
| Route | Purpose |
|---|---|
| `/` | 3D animated landing (Three.js golden particle wave) + section directory |
| `/portfolio/` | Full interactive résumé (Replit portfolio replica: road timeline, badges, notebook skills, sticky notes) |
| `/projects/` | Every project with honest stage labels (what / for whom / next) + live GitHub repos via API |
| `/systems/` | ClauseLens RAG replay demo — real recorded pipeline runs, zero API keys — + 5 blueprint portfolio |
| `/articles/` | Blog index (SEO-ready; one article live) |
| `/plans/` | Public build queue |
| `404.html`, `robots.txt`, `sitemap.xml`, `_headers` | Infra: SEO + security headers (CSP, HSTS, frame-deny) |

## Domain swap (one command)
Every canonical URL, OG tag, and sitemap entry uses the placeholder `muskanagarwal.dev`.
When the domain is purchased, from the repo root:

```bash
grep -rl 'muskanagarwal.dev' . | xargs sed -i '' 's/muskanagarwal.dev/yourdomain.com/g'   # macOS
```

## Deploy (Cloudflare Pages, free)
1. Push this folder to a GitHub repo.
2. Cloudflare → Workers & Pages → Create → Pages → Connect to Git.
3. Framework: None. Build command: empty. Output dir: `/`.
4. Custom domains → add the domain → apply the two DNS records shown.
5. `_headers` is picked up automatically (security headers). Verify at securityheaders.com.

## Post-launch SEO checklist
- Google Search Console: add property, submit `sitemap.xml`.
- Bing Webmaster Tools: same.
- Add `assets/profile.jpg` + `assets/about.jpg` (portfolio page picks them up automatically; also add `og:image` then).
- Each new article: folder under `/articles/<slug>/index.html`, add to sitemap + articles index.

## Security notes
- No API keys anywhere; the only external calls are GitHub's public API and Google Fonts/cdnjs (pinned in CSP).
- CSP blocks all other origins; frames denied; HSTS on.
- RAG demo is fully static replay — no inference endpoint to abuse.
