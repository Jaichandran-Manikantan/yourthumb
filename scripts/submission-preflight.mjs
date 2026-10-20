#!/usr/bin/env node
/**
 * Static readiness gate for public hackathon submissions.
 * Uses only Node.js built-ins and intentionally fails while private backend
 * components remain redacted. A passing result is necessary, not sufficient,
 * for production readiness.
 */
import { readdir, readFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ignoredDirs = new Set([".git", "node_modules", ".next", ".vercel", "coverage", "dist", "build"]);
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".mjs", ".cjs", ".sql", ".yml", ".yaml"]);
const requiredFiles = ["README.md", "package.json", "package-lock.json", "next.config.ts"];
const privateImplementationFiles = [
  "lib/ideate/generate-concept.ts",
  "lib/prompts/ideate-system.ts",
  "lib/render-worker/client.ts",
  "lib/render-worker/types.ts",
  "lib/billing/create-razorpay-order.ts",
  "lib/billing/payment-fulfillment.ts",
  "lib/billing/paypal-fulfillment.ts",
  "lib/billing/paypal.ts",
  "lib/canva/oauth.ts",
  "lib/canva/export.ts",
  "lib/supabase/credits.ts",
  "lib/security/image-source.ts",
  "lib/security/sanitize-generation.ts",
  "supabase/schema.sql",
  "supabase/functions/qstash-worker/index.ts",
  "app/api/webhooks/paypal/route.ts",
  "app/api/webhooks/razorpay/route.ts",
  "app/api/cron/recover-stuck-jobs/route.ts",
];
const blockingPattern = /TRADE_SECRET|intentionally redacted|not included in this repository|not available in the public source package|private hosted backend|private rendering worker not included/i;

async function walk(dir) {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirs.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...await walk(fullPath));
    else found.push(fullPath);
  }
  return found;
}

async function exists(relativePath) {
  try {
    await access(path.join(root, relativePath));
    return true;
  } catch {
    return false;
  }
}

const blockers = [];
const warnings = [];
const files = await walk(root);
const relativeFiles = files.map((file) => path.relative(root, file).split(path.sep).join("/"));

for (const relative of requiredFiles) {
  if (!(await exists(relative))) blockers.push(`Required repository file is missing: ${relative}`);
}

const packageJson = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
for (const script of ["build", "lint", "typecheck", "preflight"]) {
  if (!packageJson.scripts?.[script]) blockers.push(`Missing package script: ${script}`);
}

const redacted = [];
for (const relative of privateImplementationFiles) {
  if (!(await exists(relative))) {
    blockers.push(`Critical implementation file is missing: ${relative}`);
    continue;
  }
  const source = await readFile(path.join(root, relative), "utf8");
  if (blockingPattern.test(source)) redacted.push(relative);
}
if (redacted.length) {
  blockers.push(`${redacted.length} critical backend/security/payment files contain redaction markers or rely on private hosted implementations.`);
  for (const relative of redacted) blockers.push(`  - ${relative}`);
}

const disabledRoutes = [];
for (const relative of relativeFiles.filter((file) => file.startsWith("app/api/") && file.endsWith("/route.ts"))) {
  const source = await readFile(path.join(root, relative), "utf8");
  if (/status:\s*(?:410|501)|status:\s*404/.test(source) && /disabled|not available|not included|only on the hosted/i.test(source)) {
    disabledRoutes.push(relative);
  }
}
if (disabledRoutes.length) {
  warnings.push(`${disabledRoutes.length} API route files are explicitly disabled in this public package:`);
  for (const relative of disabledRoutes) warnings.push(`  - ${relative}`);
}

if (!(await exists(".git"))) {
  warnings.push("No .git directory is present in this ZIP export. Use the real repository when publishing so existing history is not replaced by an export-only commit.");
}

// This source package intentionally proxies core workflows to the live YourThumb site.
if (await exists("lib/backend/live-proxy.ts")) {
  const source = await readFile(path.join(root, "lib/backend/live-proxy.ts"), "utf8");
  if (/DEFAULT_BACKEND_URL\s*=\s*["']https:\/\/yourthumb\.tech/.test(source)) {
    blockers.push("Core API requests are routed to https://yourthumb.tech; this package is not a self-contained backend and must not be presented as one.");
  }
}

console.log("YourThumb submission preflight");
console.log(`Scanned ${relativeFiles.length} files.`);
console.log("\nBLOCKERS");
if (!blockers.length) console.log("None found by this static check.");
else blockers.forEach((item, index) => console.log(`${index + 1}. ${item}`));
console.log("\nWARNINGS");
if (!warnings.length) console.log("None found by this static check.");
else warnings.forEach((item) => console.log(item));
console.log("\nNOTE: This static check cannot verify deployment health, runtime security, data isolation, payment correctness, or competition eligibility.");

if (blockers.length) process.exitCode = 1;
