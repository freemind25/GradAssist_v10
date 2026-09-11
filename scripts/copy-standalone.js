/**
 * copy-standalone.js
 * Copies the Next.js static export from `out/` to `electron/standalone/`
 * for Electron packaging.
 */

const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', '.next', 'standalone');
const DEST = path.join(__dirname, '..', 'electron', 'standalone');

function copyDirSync(src, dest) {
  // Create destination directory if it doesn't exist
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

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

// Remove existing standalone directory
if (fs.existsSync(DEST)) {
  fs.rmSync(DEST, { recursive: true, force: true });
}

// Check if source exists
if (!fs.existsSync(SRC)) {
  console.error('❌ Error: `out/` directory not found. Run `next build` first.');
  process.exit(1);
}

// Copy
console.log(`📦 Copying ${SRC} → ${DEST}`);
copyDirSync(SRC, DEST);
console.log('✅ Standalone files copied successfully!');
