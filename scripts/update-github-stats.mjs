#!/usr/bin/env node
// Refreshes the "Public repos" stat on the homepage at build time (unauthenticated
// GitHub public API — no gh CLI / token needed). No client-side API calls for this
// stat, per the rate-limit constraint. Also adds a "total stars" stat if the sum
// reaches >= 10 across public repos; removes it again if it later drops below 10.
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const INDEX_PATH = path.join(ROOT, "index.html");
const GH_OWNER = "itsmuskanagarwal";
const STARS_STAT_MARKER = 'data-stat="total-stars"';

async function ghJSON(url) {
  const res = await fetch(url, { headers: { "User-Agent": "muskanagarwal.dev-stats-updater" } });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json();
}

async function main() {
  const user = await ghJSON(`https://api.github.com/users/${GH_OWNER}`);
  const publicRepos = user.public_repos;

  let totalStars = 0;
  let page = 1;
  for (;;) {
    const repos = await ghJSON(`https://api.github.com/users/${GH_OWNER}/repos?per_page=100&page=${page}`);
    if (!Array.isArray(repos) || repos.length === 0) break;
    totalStars += repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);
    if (repos.length < 100) break;
    page++;
  }

  let html = await readFile(INDEX_PATH, "utf8");

  html = html.replace(
    /(<div class="n" data-stat="public-repos">)[^<]*(<\/div>)/,
    `$1${publicRepos}$2`
  );

  const hasStarsStat = html.includes(STARS_STAT_MARKER);
  if (totalStars >= 10 && !hasStarsStat) {
    html = html.replace(
      /(<div class="stat"><div class="n" data-stat="public-repos">\d+<\/div><div class="l">Public repos<\/div><\/div>)/,
      `$1\n    <div class="stat"><div class="n" data-stat="total-stars">${totalStars}</div><div class="l">Stars across repos</div></div>`
    );
  } else if (totalStars >= 10 && hasStarsStat) {
    html = html.replace(
      /(<div class="n" data-stat="total-stars">)\d+(<\/div>)/,
      `$1${totalStars}$2`
    );
  } else if (totalStars < 10 && hasStarsStat) {
    html = html.replace(
      /\s*<div class="stat"><div class="n" data-stat="total-stars">\d+<\/div><div class="l">Stars across repos<\/div><\/div>/,
      ""
    );
  }

  await writeFile(INDEX_PATH, html);
  console.log(`Public repos: ${publicRepos}, total stars: ${totalStars} (stars stat ${totalStars >= 10 ? "shown" : "hidden, <10"})`);
}

main().catch((err) => {
  console.error("update-github-stats.mjs failed:", err);
  process.exitCode = 1;
});
