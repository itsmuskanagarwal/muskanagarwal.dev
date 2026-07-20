#!/usr/bin/env node
// Generates a 1200x630 OG image per top-level page + per article (<=30 articles,
// so all of them) using an SVG template rendered to PNG via sharp. Dev-only
// tooling — run manually when page titles change, not at request time.
// Design tokens pulled straight from assets/site.css (dark ink bg, gold accent,
// Archivo Black-ish look faked with a bold sans since Archivo Black isn't
// available to a headless SVG renderer without embedding the font file).
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "assets", "og");

const INK = "#17171B";
const GOLD = "#E9B33B";
const CREAM = "#FAF7F0";
const MUTED = "#A9A49B";

const PAGES = [
  { slug: "home", title: "Muskan Agarwal", subtitle: "AI Engineer & Frontend Developer" },
  { slug: "portfolio", title: "Portfolio", subtitle: "Muskan Agarwal" },
  { slug: "projects", title: "Projects & Open Source", subtitle: "Muskan Agarwal" },
  { slug: "systems", title: "RAG Systems", subtitle: "Live ClauseLens Demo · Muskan Agarwal" },
  { slug: "articles", title: "Articles", subtitle: "Muskan Agarwal" },
  { slug: "plans", title: "What's Next", subtitle: "Public roadmap · Muskan Agarwal" },
  { slug: "article-agent-loop-fundamentals", title: "The agent loop", subtitle: "The pattern under every AI agent" },
  { slug: "article-building-clauselens-rag", title: "Building ClauseLens", subtitle: "What 90.7% retrieval actually took" },
  { slug: "article-demos-are-not-products", title: "Demos are not products", subtitle: "Auditing my own GitHub" },
  { slug: "article-prompt-chaining-vs-monolith", title: "Prompt chaining vs one big prompt", subtitle: "When decomposition wins" },
  { slug: "article-rag-replay-demo-pattern", title: "The replay-demo pattern", subtitle: "Show your RAG working without an API key" },
];

function wrapText(text, maxCharsPerLine) {
  const words = text.split(" ");
  const lines = [];
  let current = "";
  for (const w of words) {
    const next = current ? current + " " + w : w;
    if (next.length > maxCharsPerLine && current) {
      lines.push(current);
      current = w;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 3);
}

function escapeXML(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function svgFor({ title, subtitle }) {
  const lines = wrapText(title, 22);
  const lineHeight = 78;
  const startY = 300 - ((lines.length - 1) * lineHeight) / 2;
  const titleTSpans = lines
    .map((l, i) => `<tspan x="80" y="${startY + i * lineHeight}">${escapeXML(l)}</tspan>`)
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${INK}"/>
  <rect x="0" y="0" width="1200" height="10" fill="${GOLD}"/>
  <circle cx="1080" cy="120" r="180" fill="${GOLD}" opacity="0.06"/>
  <circle cx="1150" cy="500" r="140" fill="${GOLD}" opacity="0.05"/>
  <text x="80" y="120" font-family="Arial, sans-serif" font-weight="800" font-size="26" fill="${GOLD}" letter-spacing="4">MUSKAN.A</text>
  <text font-family="Arial, sans-serif" font-weight="800" font-size="64" fill="${CREAM}">${titleTSpans}</text>
  <text x="80" y="${startY + lines.length * lineHeight + 20}" font-family="Arial, sans-serif" font-weight="600" font-size="28" fill="${MUTED}">${escapeXML(subtitle)}</text>
  <text x="80" y="580" font-family="Arial, sans-serif" font-weight="700" font-size="22" fill="${GOLD}">muskanagarwal.dev</text>
</svg>`;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  for (const page of PAGES) {
    const svg = svgFor(page);
    const outPath = path.join(OUT_DIR, `${page.slug}.png`);
    await sharp(Buffer.from(svg)).png().toFile(outPath);
    console.log(`Wrote ${path.relative(ROOT, outPath)}`);
  }
}

main().catch((err) => {
  console.error("generate-og-images.mjs failed:", err);
  process.exitCode = 1;
});
