/**
 * Deploy script: regenerates data.ts, commits new episodes + updated
 * story bible to git, and pushes to GitHub (triggering Vercel redeploy).
 *
 * Usage: node scripts/deploy.js
 *
 * Run after generate-episode.js to publish locally AND to Vercel.
 */

import { execSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function run(cmd) {
  console.log(`> ${cmd}`);
  execSync(cmd, { cwd: ROOT, stdio: "inherit" });
}

// 1. Regenerate data.ts from episode JSONs
console.log("\n--- Rebuilding data.ts ---");
run("node scripts/build-data.js");

// 2. Stage episode files, story bible, and generated data.ts
console.log("\n--- Staging changes ---");
run("git add clients/pokemon-fables/episodes/ clients/pokemon-fables/story-bible.json src/lib/data.ts");

// 3. Check if there's anything to commit
try {
  execSync("git diff --cached --quiet", { cwd: ROOT });
  console.log("\nNo changes to commit.");
  process.exit(0);
} catch {
  // There are staged changes — continue
}

// 4. Commit
console.log("\n--- Committing ---");
run('git commit -m "feat: publish new episode"');

// 5. Push
console.log("\n--- Pushing to GitHub ---");
run("git push origin main");

console.log("\n--- Done! Vercel will auto-deploy. ---");
