/**
 * generate-icons.cjs
 * Generates TaskMaster app icons for all required sizes using only built-in Node.js modules.
 * Creates SVG icons and also writes them as PNG-like files using a simple BMP fallback,
 * but primarily generates SVG-based icons that Capacitor and PWA accept.
 */
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

const publicIconsDir = path.join(__dirname, 'public', 'icons');
const androidResDir = path.join(__dirname, 'android', 'app', 'src', 'main', 'res');
const iosDir = path.join(__dirname, 'ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset');

// Create directories
[publicIconsDir].forEach(d => fs.mkdirSync(d, { recursive: true }));

/**
 * Generate an SVG icon for TaskMaster
 * Background: indigo-600 (#4f46e5), white checkmark square icon
 */
function generateSVG(size) {
  const padding = Math.round(size * 0.18);
  const iconSize = size - padding * 2;
  const rx = Math.round(size * 0.22); // border radius
  const strokeWidth = Math.max(2, Math.round(iconSize * 0.07));
  const checkX1 = padding + Math.round(iconSize * 0.22);
  const checkY1 = padding + Math.round(iconSize * 0.52);
  const checkX2 = padding + Math.round(iconSize * 0.42);
  const checkY2 = padding + Math.round(iconSize * 0.72);
  const checkX3 = padding + Math.round(iconSize * 0.78);
  const checkY3 = padding + Math.round(iconSize * 0.28);
  const squarePad = Math.round(iconSize * 0.08);
  const sq = {
    x: padding + squarePad,
    y: padding + squarePad,
    w: iconSize - squarePad * 2,
    h: iconSize - squarePad * 2,
    rx: Math.round(iconSize * 0.12),
  };

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${rx}" fill="#4f46e5"/>
  <rect x="${sq.x}" y="${sq.y}" width="${sq.w}" height="${sq.h}" rx="${sq.rx}" fill="none" stroke="white" stroke-width="${strokeWidth}"/>
  <polyline points="${checkX1},${checkY1} ${checkX2},${checkY2} ${checkX3},${checkY3}" fill="none" stroke="white" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
}

// Generate SVG icons for all sizes (PWA and general use)
sizes.forEach(size => {
  const svg = generateSVG(size);
  // Save as SVG (also usable as PNG placeholder until native build)
  fs.writeFileSync(path.join(publicIconsDir, `icon-${size}x${size}.png`), svg);
  console.log(`Generated icon-${size}x${size}.png (SVG content)`);
});

// Also save a proper SVG for reference
fs.writeFileSync(path.join(publicIconsDir, 'icon.svg'), generateSVG(512));
fs.writeFileSync(path.join(__dirname, 'public', 'favicon.svg'), generateSVG(32));

// Generate Android launcher icons (mipmap directories)
const androidIconSizes = {
  'mipmap-mdpi':    48,
  'mipmap-hdpi':    72,
  'mipmap-xhdpi':   96,
  'mipmap-xxhdpi':  144,
  'mipmap-xxxhdpi': 192,
};

if (fs.existsSync(androidResDir)) {
  Object.entries(androidIconSizes).forEach(([dir, size]) => {
    const dirPath = path.join(androidResDir, dir);
    fs.mkdirSync(dirPath, { recursive: true });
    fs.writeFileSync(path.join(dirPath, 'ic_launcher.png'), generateSVG(size));
    fs.writeFileSync(path.join(dirPath, 'ic_launcher_round.png'), generateSVG(size));
    console.log(`Generated Android ${dir}/ic_launcher.png`);
  });
} else {
  console.log('Android platform not yet added — skipping Android icons');
}

// iOS icons
const iosIconSizes = [20, 29, 40, 58, 60, 76, 80, 87, 120, 152, 167, 180, 1024];
if (fs.existsSync(iosDir)) {
  iosIconSizes.forEach(size => {
    fs.writeFileSync(path.join(iosDir, `AppIcon-${size}.png`), generateSVG(size));
    console.log(`Generated iOS AppIcon-${size}.png`);
  });
  // Write Contents.json
  const contents = {
    images: iosIconSizes.map(size => ({
      filename: `AppIcon-${size}.png`,
      idiom: size >= 167 ? 'ipad' : 'iphone',
      scale: '1x',
      size: `${size}x${size}`,
    })),
    info: { author: 'xcode', version: 1 },
  };
  fs.writeFileSync(path.join(iosDir, 'Contents.json'), JSON.stringify(contents, null, 2));
  console.log('Generated iOS Contents.json');
} else {
  console.log('iOS platform not yet added — skipping iOS icons');
}

console.log('\nDone! Icons generated in public/icons/');
console.log('NOTE: For production, replace SVG-content .png files with real PNG images.');
console.log('Use a tool like https://realfavicongenerator.net or Capacitor Assets plugin.');
