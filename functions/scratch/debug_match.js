const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let code = fs.readFileSync(targetFile, 'utf8').replace(/\r\n/g, '\n');

const cardMapFind = `                                        const meta = req.transaction?.metadata || {};
                                        const lat = meta.location?.lat || meta.latitude || (req as any).latitude;
                                        const lng = meta.location?.lng || meta.longitude || (req as any).longitude;
                                        const mapsUrl = meta.googleMapsLink || (req as any).google_maps_url || (lat && lng ? \`https://www.google.com/maps/search/?api=1&query=\${lat},\${lng}\` : null);`;

console.log("cardMapFind length:", cardMapFind.length);
console.log("Includes:", code.includes(cardMapFind));

// Let's find where "const meta = req.transaction?.metadata || {};" exists in code
const lines = code.split('\n');
lines.forEach((line, idx) => {
    if (line.includes("const meta = req.transaction?.metadata || {};")) {
        console.log(`Line ${idx + 1}:`);
        console.log("  Line contents: ", JSON.stringify(line));
        console.log("  Target line:   ", JSON.stringify(cardMapFind.split('\n')[0]));
        console.log("  Next lines in file:");
        for (let i = 1; i < 4; i++) {
            console.log(`    File line ${idx + 1 + i}:`, JSON.stringify(lines[idx + i]));
            console.log(`    Target line ${i}:     `, JSON.stringify(cardMapFind.split('\n')[i]));
        }
    }
});
