const fs = require('fs');
const html = fs.readFileSync('functions/scratch/short_link_page.html', 'utf8');

// Let's print any URLs in the HTML page containing @lat,lng or map APIs
const regexes = [
  /url\?q=[^&]+/g,
  /maps\/api\/staticmap[^"'\s]+/g,
  /maps\?q=[^"'\s]+/g,
  /google\.com\/maps[^"'\s]+/g
];

console.log("Searching patterns:");
regexes.forEach((r, idx) => {
  const matches = html.match(r);
  if (matches) {
    console.log(`\nRegex ${idx+1} matches (first 5):`);
    matches.slice(0, 5).forEach(m => console.log("->", m));
  } else {
    console.log(`\nRegex ${idx+1} no matches`);
  }
});

// Let's look for coordinates anywhere in the HTML
const coordRegex = /(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/g;
const allCoords = [];
let match;
while ((match = coordRegex.exec(html)) !== null) {
  const lat = parseFloat(match[1]);
  const lng = parseFloat(match[2]);
  if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
    // Filter coordinates around Makassar region (approx lat -5.1, lng 119.4)
    if (lat < -4.8 && lat > -5.3 && lng > 119.2 && lng < 119.8) {
      allCoords.push(`${lat}, ${lng}`);
    }
  }
}
console.log("\nFound coordinates in Makassar range:", Array.from(new Set(allCoords)));
