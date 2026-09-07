/**
 * copy-standalone.js
 *
 * Copies the Next.js static export output (out/) into electron/standalone/
 * so electron-builder can bundle it as extraResources.
 *
 * With next.config.ts output: 'export', `next build` produces a fully static
 * site in out/ (index.html, _next/static/*, public assets at the root).
 * electron/main.js serves that directory over a local HTTP server, which is
 * what fixes the previous blank "Not Found" window.
 *
 * Usage: node scripts/copy-standalone.js
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const EXPORT_SRC = path.join(ROOT, "out");
const DEST = path.join(ROOT, "electron", "standalone");

// ── Helpers ───────────────────────────────────────────────────────────────────

function mkdirp(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyDirSync(src, dest) {
  if (!fs.existsSync(src)) {
    throw new Error(`Source not found: ${src} — run \`npx next build\` first.`);
  }
  mkdirp(dest);

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

console.log("📦 Copying Next.js static export (out/) for Electron packaging…");

// Clean previous output
if (fs.existsSync(DEST)) {
  fs.rmSync(DEST, { recursive: true, force: true });
  console.log("  🗑  Cleaned previous electron/standalone/");
}

// 1. Copy the static export (index.html, _next/static, public assets…)
console.log("  📂 Copying out/ → electron/standalone/");
copyDirSync(EXPORT_SRC, DEST);

// 2. Sanity check: the app entry point MUST exist, otherwise the packaged
//    window shows a blank "Not Found" page.
if (!fs.existsSync(path.join(DEST, "index.html"))) {
  throw new Error("index.html missing from out/ — static export failed.");
}
if (!fs.existsSync(path.join(DEST, "_next", "static"))) {
  throw new Error("_next/static missing from out/ — static export failed.");
}

console.log("✅ Static export copied successfully (index.html + _next/static present).");
