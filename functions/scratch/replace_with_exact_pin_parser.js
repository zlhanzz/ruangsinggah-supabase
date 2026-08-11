const fs = require('fs');
const path = require('path');

// 1. Update functions/src/index.ts (Backend Resolver)
const indexFile = path.join(__dirname, '../src/index.ts');
let indexContent = fs.readFileSync(indexFile, 'utf8');

const oldIndexParser = `    const centerRegex = /center(?:=|\\\\u003d|%3d)(-?\\d+\\.\\d+)(?:%2C|,|%2c)(-?\\d+\\.\\d+)/i;
    let match = html.match(centerRegex);`;

const newIndexParser = `    // Priority 1: Exact Place Pin coordinates (!3d[lat]!4d[lng])
    const pinRegex = /!3d(-?\\d+\\.\\d+)!4d(-?\\d+\\.\\d+)/i;
    let match = html.match(pinRegex);

    if (!match) {
        const centerRegex = /center(?:=|\\\\u003d|%3d)(-?\\d+\\.\\d+)(?:%2C|,|%2c)(-?\\d+\\.\\d+)/i;
        match = html.match(centerRegex);
    }`;

if (indexContent.includes(oldIndexParser)) {
  indexContent = indexContent.replace(oldIndexParser, newIndexParser);
  fs.writeFileSync(indexFile, indexContent, 'utf8');
  console.log("Backend index.ts parser updated to prioritize exact place pin.");
} else {
  console.error("oldIndexParser not found in index.ts!");
}

// 2. Update functions/public/pages/AgentDashboard.tsx (Frontend Parser)
const dashFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let dashContent = fs.readFileSync(dashFile, 'utf8');

// Update parseGoogleMapsUrl
const oldParseGoogleMapsUrl = `    const parseGoogleMapsUrl = (url: string) => {
        if (!url) return null;
        // Format: @-5.1326,119.4886
        const regex1 = /@(-?\\d+\\.\\d+),(-?\\d+\\.\\d+)/;`;

const newParseGoogleMapsUrl = `    const parseGoogleMapsUrl = (url: string) => {
        if (!url) return null;
        // Priority 1: Exact Place Pin coordinates (!3d[lat]!4d[lng])
        const pinRegex = /!3d(-?\\d+\\.\\d+)!4d(-?\\d+\\.\\d+)/i;
        let match = url.match(pinRegex);
        if (match && match[1] && match[2]) {
            return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
        }
        // Format: @-5.1326,119.4886
        const regex1 = /@(-?\\d+\\.\\d+),(-?\\d+\\.\\d+)/;`;

if (dashContent.includes(oldParseGoogleMapsUrl)) {
  dashContent = dashContent.replace(oldParseGoogleMapsUrl, newParseGoogleMapsUrl);
  console.log("Frontend parseGoogleMapsUrl updated.");
} else {
  console.error("oldParseGoogleMapsUrl not found in AgentDashboard.tsx!");
}

// Update parseShortLinkCoordinates
const oldParseShortLinkCoordinates = `            // Search for coordinates in the HTML page content
            const centerRegex = /center(?:=|\\\\u003d|%3d)(-?\\d+\\.\\d+)(?:%2C|,|%2c)(-?\\d+\\.\\d+)/i;
            let match = html.match(centerRegex);`;

const newParseShortLinkCoordinates = `            // Search for coordinates in the HTML page content
            // Priority 1: Exact Place Pin coordinates (!3d[lat]!4d[lng])
            const pinRegex = /!3d(-?\\d+\\.\\d+)!4d(-?\\d+\\.\\d+)/i;
            let match = html.match(pinRegex);

            if (!match) {
                const centerRegex = /center(?:=|\\\\u003d|%3d)(-?\\d+\\.\\d+)(?:%2C|,|%2c)(-?\\d+\\.\\d+)/i;
                match = html.match(centerRegex);
            }`;

if (dashContent.includes(oldParseShortLinkCoordinates)) {
  dashContent = dashContent.replace(oldParseShortLinkCoordinates, newParseShortLinkCoordinates);
  fs.writeFileSync(dashFile, dashContent, 'utf8');
  console.log("Frontend parseShortLinkCoordinates updated.");
} else {
  console.error("oldParseShortLinkCoordinates not found in AgentDashboard.tsx!");
}

console.log("Done.");
