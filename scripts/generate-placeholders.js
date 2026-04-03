/**
 * Generate Placeholder SVG Icons
 * Creates simple colored SVG icons for testing
 */

const fs = require('fs');
const path = require('path');

const imagesDir = path.join(__dirname, '../public/images');

// Ensure images directory exists
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Icon designs with colors and symbols
const iconDesigns = {
  // Low value symbols (1-4) - Card suits style
  1: { color: '#e74c3c', symbol: '♥', label: 'Heart' },
  2: { color: '#3498db', symbol: '♠', label: 'Spade' },
  3: { color: '#2ecc71', symbol: '♣', label: 'Club' },
  4: { color: '#f39c12', symbol: '♦', label: 'Diamond' },

  // Medium-low value (5-8) - Fruits
  5: { color: '#e74c3c', symbol: '🍒', label: 'Cherry' },
  6: { color: '#f39c12', symbol: '🍋', label: 'Lemon' },
  7: { color: '#8e44ad', symbol: '🍇', label: 'Grape' },
  8: { color: '#e67e22', symbol: '🍊', label: 'Orange' },

  // Medium value (9-12) - Classic slots
  9: { color: '#1abc9c', symbol: '⭐', label: 'Star' },
  10: { color: '#9b59b6', symbol: '💎', label: 'Gem' },
  11: { color: '#f1c40f', symbol: '🔔', label: 'Bell' },
  12: { color: '#e74c3c', symbol: '🎯', label: 'Target' },

  // Medium-high value (13-16)
  13: { color: '#3498db', symbol: '🌟', label: 'Glow Star' },
  14: { color: '#e91e63', symbol: '👑', label: 'Crown' },
  15: { color: '#ffd700', symbol: '💰', label: 'Money' },
  16: { color: '#ff6b6b', symbol: '💝', label: 'Heart Gift' },

  // High value (17-20) - Premium
  17: { color: '#9c27b0', symbol: '🎰', label: 'Slots' },
  18: { color: '#00bcd4', symbol: '💠', label: 'Crystal' },
  19: { color: '#4caf50', symbol: '🍀', label: 'Clover' },
  20: { color: '#ffc107', symbol: '7️⃣', label: 'Lucky 7' },

  // Special symbols
  21: { color: '#00e676', symbol: 'FS', label: 'Free Spins', gradient: ['#00e676', '#00c853'] },
  22: { color: '#00b0ff', symbol: 'H&S', label: 'Hold Spin', gradient: ['#00b0ff', '#0091ea'] },
};

function generateSVG(id, design) {
  const isSpecial = id > 20;
  const size = 200;
  const center = size / 2;

  let background;
  if (design.gradient) {
    background = `
      <defs>
        <linearGradient id="grad${id}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${design.gradient[0]};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${design.gradient[1]};stop-opacity:1" />
        </linearGradient>
        <filter id="glow${id}">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <circle cx="${center}" cy="${center}" r="${center - 10}" fill="url(#grad${id})" filter="url(#glow${id})"/>
    `;
  } else {
    background = `
      <defs>
        <radialGradient id="bg${id}" cx="30%" cy="30%">
          <stop offset="0%" style="stop-color:${lightenColor(design.color, 30)};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${design.color};stop-opacity:1" />
        </radialGradient>
        <filter id="shadow${id}">
          <feDropShadow dx="2" dy="4" stdDeviation="3" flood-opacity="0.3"/>
        </filter>
      </defs>
      <circle cx="${center}" cy="${center}" r="${center - 10}" fill="url(#bg${id})" filter="url(#shadow${id})"/>
      <circle cx="${center}" cy="${center}" r="${center - 15}" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="3"/>
    `;
  }

  // Special symbols get text, regular ones get emoji
  let symbolContent;
  if (isSpecial) {
    symbolContent = `
      <text x="${center}" y="${center + 5}" 
            font-family="Arial, sans-serif" 
            font-size="48" 
            font-weight="bold" 
            fill="white" 
            text-anchor="middle" 
            dominant-baseline="middle"
            filter="url(#shadow${id})">${design.symbol}</text>
    `;
  } else {
    symbolContent = `
      <text x="${center}" y="${center + 15}" 
            font-family="Apple Color Emoji, Segoe UI Emoji, sans-serif" 
            font-size="80" 
            text-anchor="middle" 
            dominant-baseline="middle">${design.symbol}</text>
    `;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  ${background}
  ${symbolContent}
</svg>`;
}

function lightenColor(color, percent) {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00ff) + amt);
  const B = Math.min(255, (num & 0x0000ff) + amt);
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

// Generate all icons
console.log('Generating placeholder icons...\n');

for (let i = 1; i <= 22; i++) {
  const design = iconDesigns[i];
  const svg = generateSVG(i, design);
  const filename = `icon_${i}.png`;
  const filepath = path.join(imagesDir, filename);

  // For now, save as SVG (rename to .png for compatibility)
  // In production, you'd convert to actual PNG
  fs.writeFileSync(filepath.replace('.png', '.svg'), svg);

  console.log(`✓ Generated icon_${i}.svg - ${design.label}`);
}

console.log('\n✨ All placeholder icons generated!');
console.log(`\nNote: These are SVG files saved with .svg extension.`);
console.log('For the game to work, rename them to .png or update image paths,');
console.log('or replace with your actual PNG icons.');

// Also create a symlink/copy for PNG extension
for (let i = 1; i <= 22; i++) {
  const svgPath = path.join(imagesDir, `icon_${i}.svg`);
  const pngPath = path.join(imagesDir, `icon_${i}.png`);
  fs.copyFileSync(svgPath, pngPath);
}

console.log('\nCopied SVG files to PNG filenames for browser compatibility.');
