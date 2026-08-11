const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

const targetStr = `    const parseShortLinkCoordinates = async (shortUrl: string) => {
        try {
            const proxyUrl = \`https://api.allorigins.win/get?url=\${encodeURIComponent(shortUrl)}\`;
            const res = await fetch(proxyUrl);
            const data = await res.json();
            const html = data.contents;
            
            // Search for coordinates in the HTML page content
            const centerRegex = /center(?:=|\\\\u003d)(-?\\d+\\.\\d+)(?:%2C|,)(-?\\d+\\.\\d+)/i;
            let match = html.match(centerRegex);
            
            if (!match) {
                const mapUrlRegex = /(?:@|%40)(-?\\d+\\.\\d+),(?:%2C|,)?(-?\\d+\\.\\d+)/i;
                match = html.match(mapUrlRegex);
            }
            
            if (!match) {
                const llRegex = /ll(?:=|\\\\u003d)(-?\\d+\\.\\d+)(?:%2C|,)(-?\\d+\\.\\d+)/i;
                match = html.match(llRegex);
            }
            
            if (!match) {
                const qRegex = /[?&]q(?:=|\\\\u003d)(-?\\d+\\.\\d+)(?:%2C|,)(-?\\d+\\.\\d+)/i;
                match = html.match(qRegex);
            }

            if (match && match[1] && match[2]) {
                return {
                    lat: parseFloat(match[1]),
                    lng: parseFloat(match[2])
                };
            }
        } catch (err) {
            console.error("Failed to parse short link:", err);
        }
        return null;
    };`;

const replacementStr = `    const parseShortLinkCoordinates = async (shortUrl: string) => {
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
        }

        // 2. Fallback to corsproxy.io
        if (!html) {
            try {
                const fallbackUrl = \`https://corsproxy.io/?\${encodeURIComponent(shortUrl)}\`;
                const res = await fetch(fallbackUrl);
                if (res.ok) {
                    html = await res.text();
                }
            } catch (e) {
                console.error("Fallback corsproxy failed:", e);
            }
        }

        if (!html) return null;

        try {
            // Search for coordinates in the HTML page content
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
                return {
                    lat: parseFloat(match[1]),
                    lng: parseFloat(match[2])
                };
            }

            // 3. Last resort: scan the HTML for any coordinates within Makassar range
            const makassarCoordsRegex = /(-5\\.\\d+)\\s*(?:,|%2C|%2c)\\s*(119\\.\\d+)/g;
            let m;
            while ((m = makassarCoordsRegex.exec(html)) !== null) {
                const lat = parseFloat(m[1]);
                const lng = parseFloat(m[2]);
                if (lat >= -5.3 && lat <= -4.9 && lng >= 119.3 && lng <= 119.6) {
                    console.log("parseShortLinkCoordinates: extracted Makassar region coordinates via global scan:", lat, lng);
                    return { lat, lng };
                }
            }
        } catch (err) {
            console.error("Failed to parse short link content:", err);
        }
        return null;
    };`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  console.log("Successfully replaced exact!");
} else {
  const cleanTarget = targetStr.replace(/\s+/g, ' ');
  const cleanContent = content.replace(/\s+/g, ' ');
  if (cleanContent.includes(cleanTarget)) {
    const escaped = targetStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
    content = content.replace(new RegExp(escaped), replacementStr);
    console.log("Successfully replaced via regex!");
  } else {
    console.error("Could not find the target parseShortLinkCoordinates helper in the file!");
  }
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log("Done.");
