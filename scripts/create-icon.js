/**
 * create-icon.js
 * Generates a minimal icon.ico file for Electron packaging.
 * Run with: node scripts/create-icon.js
 */

const fs = require('fs');
const path = require('path');

// Minimal 16x16 ICO file (amber color for GradeAssist theme)
// This is a valid .ico file with a 16x16 32-bit RGBA bitmap
const icoHeader = Buffer.alloc(6);
// Reserved (2 bytes)
icoHeader.writeUInt16LE(0, 0);
// Type: 1 = ICO (2 bytes)
icoHeader.writeUInt16LE(1, 2);
// Count: 1 image (2 bytes)
icoHeader.writeUInt16LE(1, 4);

// ICO Directory Entry (16 bytes)
const icoDirEntry = Buffer.alloc(16);
icoDirEntry.writeUInt8(16, 0);    // Width: 16
icoDirEntry.writeUInt8(16, 1);    // Height: 16
icoDirEntry.writeUInt8(0, 2);     // Color palette: 0
icoDirEntry.writeUInt8(0, 3);     // Reserved: 0
icoDirEntry.writeUInt16LE(1, 4);  // Color planes: 1
icoDirEntry.writeUInt16LE(32, 6); // Bits per pixel: 32
icoDirEntry.writeUInt32LE(0, 8);  // Size of image data (will be updated)
icoDirEntry.writeUInt32LE(22, 12); // Offset to image data (6 + 16 = 22)

// Create 16x16 RGBA bitmap data
const width = 16;
const height = 16;
const bitmapData = Buffer.alloc(width * height * 4);

for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const offset = (y * width + x) * 4;
    // Amber/gold color (#d97706) with white background
    bitmapData[offset] = 6;      // Blue (0x06)
    bitmapData[offset + 1] = 119; // Green (0x77)
    bitmapData[offset + 2] = 217; // Red (0xd9)
    bitmapData[offset + 3] = 255; // Alpha
  }
}

// AND mask (1 bit per pixel, all zeros = fully opaque)
const andMask = Buffer.alloc(Math.ceil(width * height / 8));

const imageData = Buffer.concat([bitmapData, andMask]);
icoDirEntry.writeUInt32LE(imageData.length, 8);

const icoFile = Buffer.concat([icoHeader, icoDirEntry, imageData]);

const outputPath = path.join(__dirname, '..', 'electron', 'icon.ico');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, icoFile);

console.log(`✅ Created ${outputPath} (${icoFile.length} bytes)`);
