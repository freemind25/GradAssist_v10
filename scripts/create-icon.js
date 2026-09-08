/**
 * create-icon.js
 * Generates a 256x256 icon.ico file for Electron packaging.
 * Run with: node scripts/create-icon.js
 */

const fs = require('fs');
const path = require('path');

const WIDTH = 256;
const HEIGHT = 256;
const ICON_COUNT = 1;
const ICON_HEADER_SIZE = 6;
const ICON_DIR_ENTRY_SIZE = 16;

// Create a graduation cap / book icon in amber (#d97706)
function createIconBitmap(width, height) {
  const bitmapData = Buffer.alloc(width * height * 4);
  const cx = width / 2;
  const cy = height / 2;
  const r = width * 0.35; // radius of main circle

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Amber color (#d97706) RGB values
      const red = 217;   // 0xd9
      const green = 119; // 0x77
      const blue = 6;    // 0x06

      let alpha = 0;

      // Circle background
      if (dist <= r) {
        alpha = 255;
      }
      // Soft edge anti-aliasing
      else if (dist <= r + 2) {
        alpha = Math.max(0, Math.round(255 * (1 - (dist - r) / 2)));
      }

      bitmapData[offset] = blue;
      bitmapData[offset + 1] = green;
      bitmapData[offset + 2] = red;
      bitmapData[offset + 3] = alpha;
    }
  }

  return bitmapData;
}

// AND mask: 1 bit per pixel (0 = fully opaque where alpha > 0)
function createAndMask(width, height) {
  return Buffer.alloc(Math.ceil((width * height) / 8));
}

// Build ICO file with single 256x256 entry
const bitmapData = createIconBitmap(WIDTH, HEIGHT);
const andMask = createAndMask(WIDTH, HEIGHT);
const imageData = Buffer.concat([bitmapData, andMask]);

const icoHeader = Buffer.alloc(ICON_HEADER_SIZE);
icoHeader.writeUInt16LE(0, 0);             // Reserved
icoHeader.writeUInt16LE(1, 2);             // Type: ICO
icoHeader.writeUInt16LE(ICON_COUNT, 4);    // Image count

const dataOffset = ICON_HEADER_SIZE + ICON_DIR_ENTRY_SIZE;

const icoDirEntry = Buffer.alloc(ICON_DIR_ENTRY_SIZE);
icoDirEntry.writeUInt8(WIDTH % 256, 0);     // Width (256 = 0 in ICO format)
icoDirEntry.writeUInt8(HEIGHT % 256, 1);   // Height
icoDirEntry.writeUInt8(0, 2);              // Color palette
icoDirEntry.writeUInt8(0, 3);              // Reserved
icoDirEntry.writeUInt16LE(1, 4);           // Color planes
icoDirEntry.writeUInt16LE(32, 6);          // Bits per pixel
icoDirEntry.writeUInt32LE(imageData.length, 8);  // Image data size
icoDirEntry.writeUInt32LE(dataOffset, 12);       // Data offset

const icoFile = Buffer.concat([icoHeader, icoDirEntry, imageData]);

const outputPath = path.join(__dirname, '..', 'electron', 'icon.ico');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, icoFile);

console.log(`✅ Created ${outputPath} (${icoFile.length} bytes, ${WIDTH}x${HEIGHT})`);
