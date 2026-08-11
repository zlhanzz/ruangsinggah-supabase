const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

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

        if (!html) return null;`;

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

        // 2. Fallback to corsproxy.io (Fixed URL parameter syntax)
        if (!html) {
            try {
                const fallbackUrl = \`https://corsproxy.io/?url=\${encodeURIComponent(shortUrl)}\`;
                const res = await fetch(fallbackUrl);
                if (res.ok) {
                    html = await res.text();
                }
            } catch (e) {
                console.error("Fallback corsproxy failed:", e);
            }
        }

        // 3. Fallback to codetabs proxy
        if (!html) {
            try {
                const fallbackUrl = \`https://api.codetabs.com/v1/proxy?quest=\${encodeURIComponent(shortUrl)}\`;
                const res = await fetch(fallbackUrl);
                if (res.ok) {
                    html = await res.text();
                }
            } catch (e) {
                console.error("Fallback codetabs failed:", e);
            }
        }

        if (!html) {
            console.error("parseShortLinkCoordinates: all CORS proxies failed to retrieve HTML.");
            return null;
        }

        console.log("parseShortLinkCoordinates: successfully retrieved HTML content of length:", html.length);`;

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
    console.error("Could not find the target parseShortLinkCoordinates block in the file!");
  }
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log("Done.");
