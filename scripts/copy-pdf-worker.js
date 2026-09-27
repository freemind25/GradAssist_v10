/**
 * copy-pdf-worker.js
 * Copie le worker de pdf.js (build legacy) depuis node_modules vers public/
 * afin qu'il soit servi depuis la même origine que l'application.
 *
 * Contexte :
 * - la CSP de production (`script-src 'self'`) bloque le chargement du
 *   worker depuis unpkg.com ;
 * - le build standard de pdf.js v6 utilise Uint8Array.toHex() (Chromium ≥ 140)
 *   absente de l'app Desktop Electron 33 (Chromium 130) → « n.toHex is not
 *   a function ». Le build legacy est compatible avec les navigateurs plus
 *   anciens.
 */
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.worker.min.mjs');
const dest = path.join(__dirname, '..', 'public', 'pdf.worker.legacy.min.mjs');

try {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log(`✅ pdf.worker (legacy) copié vers public/ (${(fs.statSync(dest).size / 1024).toFixed(0)} Ko)`);
} catch (err) {
  // Ne bloque pas l'installation si pdfjs-dist est absent
  console.warn('⚠️  Impossible de copier le worker pdf.js:', err.message);
}
