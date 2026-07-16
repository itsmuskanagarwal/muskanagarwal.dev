/* PRP-01 shared helpers for Cloudflare Pages Functions under /functions/api/.
 * Phase-0 deviation from 00-MASTER-ROADMAP.md §5: implemented as Cloudflare Pages
 * Functions (same repo/deploy as the static site) instead of a standalone Worker
 * project. Endpoint contracts, CORS posture, and rate limits are unchanged from
 * PRP-01 — only the hosting mechanism differs. Reason: the site is already a
 * Cloudflare Pages project (README.md); Pages Functions give same-origin /api/*
 * routes with zero extra DNS/zone-route configuration, avoiding a Worker-route-
 * vs-Pages conflict on the same zone.
 */

export const ALLOWED_ORIGIN = "https://muskanagarwal.dev";

export function corsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";
  const isLocalDev = env.DEV === "1" && /^https?:\/\/localhost(:\d+)?$/.test(origin);
  const allow = origin === ALLOWED_ORIGIN || isLocalDev ? origin : "";
  const h = { "Vary": "Origin" };
  if (allow) {
    h["Access-Control-Allow-Origin"] = allow;
    h["Access-Control-Allow-Methods"] = "POST, OPTIONS";
    h["Access-Control-Allow-Headers"] = "Content-Type";
  }
  return h;
}

export function json(data, status, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  });
}

export function preflight(request, env) {
  return new Response(null, { status: 204, headers: corsHeaders(request, env) });
}

/* ---------------- Rate limiting ----------------
 * KV binding: RATE_KV (configured in wrangler.toml / Pages dashboard).
 * Per-IP: 10 req/min, 100 req/day. Global: 2000 Gemini generation calls/day.
 * If RATE_KV is not bound (e.g. missing local dev setup), rate limiting is
 * skipped with a console.warn rather than hard-failing every request — a
 * missing KV binding should degrade, not brick the endpoint.
 */
export async function checkRateLimit(request, env) {
  if (!env.RATE_KV) {
    console.warn("RATE_KV not bound — rate limiting disabled");
    return { ok: true };
  }
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const now = new Date();
  const minuteKey = `rl:min:${ip}:${Math.floor(now.getTime() / 60000)}`;
  const dayKey = `rl:day:${ip}:${now.toISOString().slice(0, 10)}`;

  const [minuteCount, dayCount] = await Promise.all([
    env.RATE_KV.get(minuteKey),
    env.RATE_KV.get(dayKey),
  ]);

  if (Number(minuteCount) >= 10) return { ok: false, retryAfterSec: 60 };
  if (Number(dayCount) >= 100) return { ok: false, retryAfterSec: 86400 };

  await Promise.all([
    env.RATE_KV.put(minuteKey, String(Number(minuteCount || 0) + 1), { expirationTtl: 90 }),
    env.RATE_KV.put(dayKey, String(Number(dayCount || 0) + 1), { expirationTtl: 172800 }),
  ]);
  return { ok: true };
}

export async function checkGlobalBudget(env) {
  if (!env.RATE_KV) return { ok: true };
  const today = new Date().toISOString().slice(0, 10);
  const key = `budget:${today}`;
  const count = Number((await env.RATE_KV.get(key)) || 0);
  if (count >= 2000) return { ok: false };
  await env.RATE_KV.put(key, String(count + 1), { expirationTtl: 172800 });
  return { ok: true };
}

/* ---------------- Retrieval: BM25 over the portfolio corpus ----------------
 * No embedding step, no build step, no cost until generation. Corpus is tiny
 * (~20 chunks) so classic BM25 over title+text is plenty discriminative and
 * fully deterministic/testable without any API key.
 */
const STOPWORDS = new Set(["the","a","an","is","are","was","were","be","been","of","to","in","on","for","and","or","with","at","her","she","has","have","had","do","does","did","what","who","how","why","when"]);

export function tokenize(text) {
  const raw = text.toLowerCase().match(/[a-z0-9.+#]+/g)?.filter(t => t.length > 1 && !STOPWORDS.has(t)) || [];
  // Lightweight destemming so "masters"/"master", "pipelines"/"pipeline" etc match.
  // Deliberately conservative: only strips a trailing "s" on plain-alpha tokens
  // length >= 5 that don't already end in "ss" (avoids "class", "ai-900", "c#", etc).
  return raw.map(t => (/^[a-z]{5,}$/.test(t) && t.endsWith("s") && !t.endsWith("ss")) ? t.slice(0, -1) : t);
}

let _bm25Index = null;
export function buildBm25Index(chunks) {
  if (_bm25Index) return _bm25Index;
  const docs = chunks.map(c => {
    const tokens = tokenize(c.title + " " + c.title + " " + c.text); // title counted twice = boost
    const tf = {};
    for (const t of tokens) tf[t] = (tf[t] || 0) + 1;
    return { chunk: c, tokens, tf, len: tokens.length };
  });
  const df = {};
  for (const d of docs) for (const t of Object.keys(d.tf)) df[t] = (df[t] || 0) + 1;
  const avgdl = docs.reduce((s, d) => s + d.len, 0) / docs.length;
  _bm25Index = { docs, df, avgdl, N: docs.length };
  return _bm25Index;
}

export function bm25Search(chunks, query, k = 8) {
  const { docs, df, avgdl, N } = buildBm25Index(chunks);
  const qTerms = tokenize(query);
  const k1 = 1.5, b = 0.75;
  const scored = docs.map(d => {
    let score = 0;
    for (const t of qTerms) {
      const f = d.tf[t] || 0;
      if (!f) continue;
      const n = df[t] || 0;
      const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
      score += idf * (f * (k1 + 1)) / (f + k1 * (1 - b + b * (d.len / avgdl)));
    }
    return { chunk: d.chunk, score };
  });
  scored.sort((a, b2) => b2.score - a.score);
  return scored.slice(0, k).filter(s => s.score > 0);
}

/* ---------------- Gemini wrappers ---------------- */
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/";
// NOTE (deviation from original PRP-01 spec, verified live 2026-07-16):
// The originally-specified pinned models "gemini-2.5-flash-lite" /
// "gemini-2.5-flash" return 404 "no longer available to new users" for this
// API key. Using Google's "latest" alias models instead, confirmed working
// (200) against this key via direct API test. Dated 2.0-series models hit
// 429 quota-exceeded on this key's tier, so they are not viable fallbacks.
const GEN_MODEL_PRIMARY = "gemini-flash-lite-latest";
const GEN_MODEL_FALLBACK = "gemini-flash-latest";

export async function geminiGenerate(env, systemPrompt, userPrompt, { temperature = 0.2, maxOutputTokens = 400 } = {}) {
  const body = {
    systemInstruction: { role: "system", parts: [{ text: systemPrompt }] },
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    generationConfig: { temperature, maxOutputTokens },
  };
  async function call(model) {
    const r = await fetch(`${GEMINI_BASE}models/${model}:generateContent?key=${env.GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(`gemini ${model} ${r.status}`);
    const data = await r.json();
    const text = data.candidates?.[0]?.content?.parts?.map(p => p.text).join("") || "";
    return text;
  }
  try {
    return await call(GEN_MODEL_PRIMARY);
  } catch (e) {
    console.warn("primary model failed, trying fallback:", e.message);
    return await call(GEN_MODEL_FALLBACK);
  }
}
