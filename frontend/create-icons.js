const fs = require('fs');
const path = require('path');

// Simple function to create a PNG data URL
function createIconDataURL(size, text) {
  // This is a simple SVG that we'll save as PNG placeholder
  const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" fill="#000000"/>
    <text x="${size/2}" y="${size/2}" font-family="Arial, sans-serif" font-size="${size*0.4}" fill="#FFD700" text-anchor="middle" dominant-baseline="middle">🚕</text>
    <text x="${size/2}" y="${size*0.75}" font-family="Arial, sans-serif" font-size="${size*0.15}" fill="#FFFFFF" text-anchor="middle" font-weight="bold">${text}</text>
  </svg>`;
  return svg;
}

const publicDir = path.join(__dirname, 'public');

// Create 192x192 icon
const icon192 = createIconDataURL(192, 'TAXI');
fs.writeFileSync(path.join(publicDir, 'logo192.svg'), icon192);

// Create 512x512 icon
const icon512 = createIconDataURL(512, 'TAXI');
fs.writeFileSync(path.join(publicDir, 'logo512.svg'), icon512);

// Create favicon
const favicon = createIconDataURL(64, 'T');
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), favicon);

console.log('Icons created successfully!');
console.log('Note: These are SVG placeholders. For production, convert them to PNG using:');
console.log('1. Open generate-icons.html in a browser');
console.log('2. Download the generated PNG files');
console.log('3. Replace the SVG files with PNG files');
