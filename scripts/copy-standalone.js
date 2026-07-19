const fs = require('fs');
const path = require('path');

const standaloneDir = path.join(__dirname, '..', '.next', 'standalone');

const copies = [
  { from: path.join(__dirname, '..', '.next', 'static'), to: path.join(standaloneDir, '.next', 'static') },
  { from: path.join(__dirname, '..', 'public'), to: path.join(standaloneDir, 'public') }
];

for (const { from, to } of copies) {
  if (fs.existsSync(from)) {
    if (fs.existsSync(to)) {
      fs.rmSync(to, { recursive: true });
    }
    fs.cpSync(from, to, { recursive: true });
    console.log(`[copy-standalone] Copied ${path.relative(__dirname, from)}`);
  } else {
    console.warn(`[copy-standalone] WARNING: ${from} not found, skipping`);
  }
}

console.log('[copy-standalone] Done.');