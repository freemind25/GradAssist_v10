/**
 * copy-standalone.js
 *
 * Copies the Next.js standalone output, static assets, and public files
 * into electron/standalone/ so electron-builder can bundle them as
 * extraResources.
 *
 * Usage: node scripts/copy-standalone.js
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const STANDALONE_SRC = path.join(ROOT, ".next", "standalone");
const STATIC_SRC = path.join(ROOT, ".next", "static");
const PUBLIC_SRC = path.join(ROOT, "public");

const DEST = path.join(ROOT, "electron", "standalone");

// ── Helpers ───────────────────────────────────────────────────────────────────

function mkdirp(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyDirSync(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn(`  ⚠ Source not found, skipping: ${src}`);
    return;
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

console.log("📦 Copying Next.js standalone output for Electron packaging…");

// Clean previous output
if (fs.existsSync(DEST)) {
  fs.rmSync(DEST, { recursive: true, force: true });
  console.log("  🗑  Cleaned previous electron/standalone/");
}

// 1. Copy standalone directory (Next.js server + pages)
console.log("  📂 Copying .next/standalone/ → electron/standalone/");
copyDirSync(STANDALONE_SRC, DEST);

// 2. Copy static assets (_next/static → electron/standalone/.next/static)
console.log("  📂 Copying .next/static/ → electron/standalone/.next/static/");
copyDirSync(STATIC_SRC, path.join(DEST, ".next", "static"));

// 3. Copy public assets
console.log("  📂 Copying public/ → electron/standalone/public/");
copyDirSync(PUBLIC_SRC, path.join(DEST, "public"));

console.log("✅ Standalone output copied successfully.");
