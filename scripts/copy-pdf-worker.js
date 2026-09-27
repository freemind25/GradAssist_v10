/**
 * copy-pdf-worker.js
 * Copie le worker de pdf.js (pdf.worker.min.mjs) depuis node_modules vers
 * public/ afin qu'il soit servi depuis la même origine que l'application.
 *
 * Contexte : la CSP de production (`script-src 'self' ...`) bloque le
 * chargement du worker depuis unpkg.com, ce qui cassait l'aperçu PDF du
 * module Canevas ("Impossible de lire le PDF. Fichier corrompu ou non
 * supporté."). Le worker est désormais servi localement.
 */
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs');
const dest = path.join(__dirname, '..', 'public', 'pdf.worker.min.mjs');

try {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log(`✅ pdf.worker.min.mjs copié vers public/ (${(fs.statSync(dest).size / 1024).toFixed(0)} Ko)`);
} catch (err) {
  // Ne bloque pas l'installation si pdfjs-dist est absent
  console.warn('⚠️  Impossible de copier le worker pdf.js:', err.message);
}
