const fs = require('fs');
const path = require('path');

// 1. Add Cloud Function to backend
const indexTsFile = path.join(__dirname, '../src/index.ts');
let indexContent = fs.readFileSync(indexTsFile, 'utf8');

const functionCode = `
// --- MAP SHORT LINK RESOLVER ENDPOINT ---
export const resolveMapShortLink = functions.https.onRequest({ cors: true }, async (req, res) => {
  try {
    const shortUrl = req.query.url as string;
    if (!shortUrl) {
      res.status(400).send({ error: 'URL parameter is required' });
      return;
    }

    console.log("resolveMapShortLink: resolving URL:", shortUrl);

    const response = await fetch(shortUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    const html = await response.text();
    console.log("resolveMapShortLink: fetched page length:", html.length);

    const centerRegex = /center(?:=|\\\\u003d|%3d)(-?\\d+\\.\\d+)(?:%2C|,|%2c)(-?\\d+\\.\\d+)/i;
    let match = html.match(centerRegex);
    
    if (!match) {
        const mapUrlRegex = /(?:@|%40)(-?\\d+\\.\\d+),(?:%2C|,|%2c)?(-?\\d+\\.\\d+)/i;
        match = html.match(mapUrlRegex);
    }
    
    if (!match) {
        const llRegex = /ll(?:=|\\\\u003d|%3d)(-?\\d+\\.\\d+)(?:%2C|,|%2c)(-?\\d+\\.\\d+)/i;
        match = html.match(llRegex);
    }
    
    if (!match) {
        const qRegex = /[?&]q(?:=|\\\\u003d|%3d)(-?\\d+\\.\\d+)(?:%2C|,|%2c)(-?\\d+\\.\\d+)/i;
        match = html.match(qRegex);
    }

    if (match && match[1] && match[2]) {
        const lat = parseFloat(match[1]);
        const lng = parseFloat(match[2]);
        res.status(200).send({ success: true, lat, lng });
        return;
    }

    const makassarCoordsRegex = /(-5\\.\\d+)\\s*(?:,|%2C|%2c)\\s*(119\\.\\d+)/g;
    let m;
    while ((m = makassarCoordsRegex.exec(html)) !== null) {
        const lat = parseFloat(m[1]);
        const lng = parseFloat(m[2]);
        if (lat >= -5.3 && lat <= -4.9 && lng >= 119.3 && lng <= 119.6) {
            res.status(200).send({ success: true, lat, lng });
            return;
        }
    }

    res.status(404).send({ error: 'Coordinates not found in page content' });
  } catch (err: any) {
    console.error("resolveMapShortLink error:", err);
    res.status(500).send({ error: err.message });
  }
});
`;

if (!indexContent.includes('export const resolveMapShortLink')) {
  indexContent += functionCode;
  fs.writeFileSync(indexTsFile, indexContent, 'utf8');
  console.log("resolveMapShortLink Cloud Function added to functions/src/index.ts.");
} else {
  console.log("Cloud Function already exists in functions/src/index.ts.");
}

// 2. Update frontend parser in AgentDashboard.tsx to call our endpoint first
const dashboardFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let dashContent = fs.readFileSync(dashboardFile, 'utf8');

const targetStr = `    const parseShortLinkCoordinates = async (shortUrl: string) => {
        let html = '';
        
        // 1. Try AllOrigins Proxy
        try {
            const proxyUrl = \`https://api.allorigins.win/get?url=\${encodeURIComponent(shortUrl)}\`;
            const res = await fetch(proxyUrl);
            if (res.ok) {
                const data = await res.json();
                html = data.contents || '';
            }
        } catch (e) {
            console.error("AllOrigins proxy failed, trying fallback...", e);
        }`;

const replacementStr = `    const parseShortLinkCoordinates = async (shortUrl: string) => {
        // First try to resolve using our own Firebase Cloud Function
        try {
            const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const functionUrl = isLocal
                ? \`http://localhost:5001/ruangsinggahid-3afb2/us-central1/resolveMapShortLink?url=\${encodeURIComponent(shortUrl)}\`
                : \`https://resolvemapshortlink-hzxlewhsuq-uc.a.run.app?url=\${encodeURIComponent(shortUrl)}\`;

            const res = await fetch(functionUrl);
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.lat && data.lng) {
                    console.log("parseShortLinkCoordinates: resolved via Cloud Function:", data.lat, data.lng);
                    return { lat: data.lat, lng: data.lng };
                }
            }
        } catch (e) {
            console.error("Firebase Cloud Function resolver failed or emulator not running. Falling back to CORS proxies...", e);
        }

        let html = '';
        
        // 1. Try AllOrigins Proxy
        try {
            const proxyUrl = \`https://api.allorigins.win/get?url=\${encodeURIComponent(shortUrl)}\`;
            const res = await fetch(proxyUrl);
            if (res.ok) {
                const data = await res.json();
                html = data.contents || '';
            }
        } catch (e) {
            console.error("AllOrigins proxy failed, trying fallback...", e);
        }`;

if (dashContent.includes(targetStr)) {
  dashContent = dashContent.replace(targetStr, replacementStr);
  fs.writeFileSync(dashboardFile, dashContent, 'utf8');
  console.log("AgentDashboard.tsx parseShortLinkCoordinates updated with Cloud Function resolver.");
} else {
  console.error("Target parseShortLinkCoordinates code block not found in AgentDashboard.tsx!");
}

console.log("Done.");
