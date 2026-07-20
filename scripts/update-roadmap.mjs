#!/usr/bin/env node
// Refreshes plans/roadmap.json's lastActivity from GitHub's public REST API
// (unauthenticated — 60 req/hr limit, fine for 5 items run occasionally).
// No gh CLI / token required or used, per repo constraint: no secrets in this repo.
//
// For items with repo:null, lastActivity is left untouched (falls back to the
// last time this file / the plans page was hand-edited).
//
// Also appends a monthly snapshot to plans/snapshots/ the first time it's run
// in a given calendar month (used by the Phase 4 "rewind" slider).

import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const ROADMAP_PATH = path.join(ROOT, "plans", "roadmap.json");
const SNAPSHOT_DIR = path.join(ROOT, "plans", "snapshots");
const GH_OWNER = "itsmuskanagarwal";

async function fetchPushedAt(repo) {
  const url = `https://api.github.com/repos/${GH_OWNER}/${repo}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "muskanagarwal.dev-roadmap-updater" },
  });
  if (!res.ok) {
    console.warn(`  [warn] ${repo}: GitHub API returned ${res.status}, keeping existing lastActivity`);
    return null;
  }
  const json = await res.json();
  return json.pushed_at ?? null;
}

async function main() {
  const raw = await readFile(ROADMAP_PATH, "utf8");
  const items = JSON.parse(raw);

  for (const item of items) {
    if (!item.repo) {
      console.log(`- ${item.id}: repo:null, skipping API call (no confirmed repo match)`);
      continue;
    }
    console.log(`- ${item.id}: fetching pushedAt for ${GH_OWNER}/${item.repo}...`);
    const pushedAt = await fetchPushedAt(item.repo);
    if (pushedAt) {
      item.lastActivity = pushedAt;
      console.log(`  -> ${pushedAt}`);
    }
  }

  await writeFile(ROADMAP_PATH, JSON.stringify(items, null, 2) + "\n");
  console.log(`\nWrote ${ROADMAP_PATH}`);

  // Monthly snapshot
  await mkdir(SNAPSHOT_DIR, { recursive: true });
  const monthKey = new Date().toISOString().slice(0, 7); // YYYY-MM
  const snapshotPath = path.join(SNAPSHOT_DIR, `${monthKey}.json`);
  if (!existsSync(snapshotPath)) {
    await writeFile(snapshotPath, JSON.stringify(items, null, 2) + "\n");
    console.log(`Created new monthly snapshot: ${snapshotPath}`);
  } else {
    console.log(`Snapshot for ${monthKey} already exists, leaving it as-is.`);
  }

  // Rebuild the manifest the "rewind" slider reads (plain filenames, sorted oldest->newest)
  const files = (await readdir(SNAPSHOT_DIR))
    .filter((f) => /^\d{4}-\d{2}\.json$/.test(f))
    .sort();
  await writeFile(
    path.join(SNAPSHOT_DIR, "index.json"),
    JSON.stringify(files, null, 2) + "\n"
  );
  console.log(`Wrote snapshot manifest (${files.length} snapshot(s))`);
}

main().catch((err) => {
  console.error("update-roadmap.mjs failed:", err);
  process.exitCode = 1;
});
