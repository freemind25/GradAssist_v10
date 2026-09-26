/**
 * copy-standalone.js
 * Prépare `electron/standalone/` pour le packaging Electron.
 *
 * Source : la sortie `next build` (output: 'standalone') dans `.next/standalone`,
 * qui contient server.js + l'app compilée + node_modules minimal.
 * C'est cette sortie que electron/main.js exécute en local (mode Node) —
 * ce qui permet à l'application de fonctionner hors ligne, y compris les
 * routes API (/api/mistral, /api/auth, /api/health).
 *
 * ⚠️ Ne jamais copier une export statique (out/) ici : le mode serveur est
 * désormais la seule configuration supportée par electron/main.js.
 *
 * Compléments copiés (requis par le runtime Next) :
 * - .next/static  → .next/standalone/.next/static  (assets client : chunks, CSS, fonts)
 * - public/       → .next/standalone/public        (favicon, manifest, icônes, sw.js…)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, '.next', 'standalone');
const DEST = path.join(ROOT, 'electron', 'standalone');

function copyDirSync(src, dest) {
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
  console.error(
    '❌ Error: `.next/standalone` not found. Run `next build` first (output: standalone).'
  );
  process.exit(1);
}

// Copy the standalone server bundle
console.log(`📦 Copying ${SRC} → ${DEST}`);
copyDirSync(SRC, DEST);

// Next.js does NOT include client assets nor public/ inside .next/standalone — copy them
const nextStaticSrc = path.join(ROOT, '.next', 'static');
const nextStaticDest = path.join(DEST, '.next', 'static');
if (fs.existsSync(nextStaticSrc)) {
  console.log(`📦 Copying ${nextStaticSrc} → ${nextStaticDest}`);
  copyDirSync(nextStaticSrc, nextStaticDest);
} else {
  console.error('⚠️  Warning: `.next/static` missing — the UI will not load (CSS/JS absent).');
}

const publicSrc = path.join(ROOT, 'public');
const publicDest = path.join(DEST, 'public');
if (fs.existsSync(publicSrc)) {
  console.log(`📦 Copying ${publicSrc} → ${publicDest}`);
  copyDirSync(publicSrc, publicDest);
}

console.log('✅ Standalone files copied successfully!');
