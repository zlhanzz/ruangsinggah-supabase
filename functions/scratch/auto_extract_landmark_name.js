const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

// 1. Modify parseShortLinkCoordinates to parse og:title or <title>
const searchParseShortLink = `    const parseShortLinkCoordinates = async (shortUrl: string) => {
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

        let html = '';`;

const replacementParseShortLink = `    const parseShortLinkCoordinates = async (shortUrl: string) => {
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
                    return { lat: data.lat, lng: data.lng, name: data.name || '' };
                }
            }
        } catch (e) {
            console.error("Firebase Cloud Function resolver failed or emulator not running. Falling back to CORS proxies...", e);
        }

        let html = '';`;

if (content.includes(searchParseShortLink)) {
  content = content.replace(searchParseShortLink, replacementParseShortLink);
} else {
  console.error("CRITICAL: parseShortLinkCoordinates start not found!");
}

// 2. Modify parseShortLinkCoordinates return statement for CORS proxies
const searchCorsReturn1 = `            if (match && match[1] && match[2]) {
                return {
                    lat: parseFloat(match[1]),
                    lng: parseFloat(match[2])
                };
            }`;

const replacementCorsReturn1 = `            let name = '';
            const ogTitleRegex = /<meta\\s+property="og:title"\\s+content="([^"]+)"/i;
            let ogMatch = html.match(ogTitleRegex);
            if (ogMatch && ogMatch[1]) {
                name = ogMatch[1];
            } else {
                const titleRegex = /<title>([^<]+)<\\/title>/i;
                let titleMatch = html.match(titleRegex);
                if (titleMatch && titleMatch[1]) {
                    name = titleMatch[1];
                }
            }
            if (name) {
                name = name.replace(/\\s*-\\s*Google Maps/i, '').trim();
                if (/^-?\\d+\\.\\d+,\\s*-?\\d+\\.\\d+$/.test(name)) {
                    name = '';
                }
            }

            if (match && match[1] && match[2]) {
                return {
                    lat: parseFloat(match[1]),
                    lng: parseFloat(match[2]),
                    name
                };
            }`;

if (content.includes(searchCorsReturn1)) {
  content = content.replace(searchCorsReturn1, replacementCorsReturn1);
} else {
  console.error("CRITICAL: searchCorsReturn1 not found!");
}

// 3. Modify global scan fallback in parseShortLinkCoordinates
const searchCorsReturn2 = `                if (lat >= -5.3 && lat <= -4.9 && lng >= 119.3 && lng <= 119.6) {
                    console.log("parseShortLinkCoordinates: extracted Makassar region coordinates via global scan:", lat, lng);
                    return { lat, lng };
                }`;

const replacementCorsReturn2 = `                if (lat >= -5.3 && lat <= -4.9 && lng >= 119.3 && lng <= 119.6) {
                    console.log("parseShortLinkCoordinates: extracted Makassar region coordinates via global scan:", lat, lng);
                    let name = '';
                    const ogTitleRegex = /<meta\\s+property="og:title"\\s+content="([^"]+)"/i;
                    let ogMatch = html.match(ogTitleRegex);
                    if (ogMatch && ogMatch[1]) {
                        name = ogMatch[1];
                    } else {
                        const titleRegex = /<title>([^<]+)<\\/title>/i;
                        let titleMatch = html.match(titleRegex);
                        if (titleMatch && titleMatch[1]) {
                            name = titleMatch[1];
                        }
                    }
                    if (name) {
                        name = name.replace(/\\s*-\\s*Google Maps/i, '').trim();
                        if (/^-?\\d+\\.\\d+,\\s*-?\\d+\\.\\d+$/.test(name)) {
                            name = '';
                        }
                    }
                    return { lat, lng, name };
                }`;

if (content.includes(searchCorsReturn2)) {
  content = content.replace(searchCorsReturn2, replacementCorsReturn2);
} else {
  console.error("CRITICAL: searchCorsReturn2 not found!");
}

// 4. Modify parseGoogleMapsUrl to extract place name
const searchParseUrl = `    const parseGoogleMapsUrl = (url: string) => {
        if (!url) return null;
        // Priority 1: Exact Place Pin coordinates (!3d[lat]!4d[lng])
        const pinRegex = /!3d(-?\\d+\\.\\d+)!4d(-?\\d+\\.\\d+)/i;
        let match = url.match(pinRegex);
        if (match && match[1] && match[2]) {
            return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
        }`;

const replacementParseUrl = `    const parseGoogleMapsUrl = (url: string) => {
        if (!url) return null;
        
        let name = '';
        const placeNameRegex = /\\/place\\/([^/]+)\\//;
        const placeMatch = url.match(placeNameRegex);
        if (placeMatch && placeMatch[1]) {
            try {
                name = decodeURIComponent(placeMatch[1].replace(/\\+/g, ' '));
                if (/^-?\\d+\\.\\d+,\\s*-?\\d+\\.\\d+$/.test(name)) {
                    name = '';
                }
            } catch (e) {}
        }

        // Priority 1: Exact Place Pin coordinates (!3d[lat]!4d[lng])
        const pinRegex = /!3d(-?\\d+\\.\\d+)!4d(-?\\d+\\.\\d+)/i;
        let match = url.match(pinRegex);
        if (match && match[1] && match[2]) {
            return { lat: parseFloat(match[1]), lng: parseFloat(match[2]), name };
        }`;

if (content.includes(searchParseUrl)) {
  content = content.replace(searchParseUrl, replacementParseUrl);
} else {
  console.error("CRITICAL: parseGoogleMapsUrl start not found!");
}

// Modify parseGoogleMapsUrl center search return
const searchParseUrlReturn = `        if (match && match[1] && match[2]) {
            return {
                lat: parseFloat(match[1]),
                lng: parseFloat(match[2])
            };
        }`;

const replacementParseUrlReturn = `        if (match && match[1] && match[2]) {
            return {
                lat: parseFloat(match[1]),
                lng: parseFloat(match[2]),
                name
            };
        }`;

if (content.includes(searchParseUrlReturn)) {
  content = content.replace(searchParseUrlReturn, replacementParseUrlReturn);
} else {
  console.error("CRITICAL: parseGoogleMapsUrl center search return not found!");
}

// 5. Update googleMapsUrlInput input onChange event
const searchOnChange = `                                                                        onChange={e => {
                                                                            setGoogleMapsUrlInput(e.target.value);
                                                                            const parsed = parseGoogleMapsUrl(e.target.value);
                                                                            if (parsed) {
                                                                                setLandmarkLocation(parsed);
                                                                            }
                                                                        }}`;

const replacementOnChange = `                                                                        onChange={e => {
                                                                            setGoogleMapsUrlInput(e.target.value);
                                                                            const parsed = parseGoogleMapsUrl(e.target.value);
                                                                            if (parsed) {
                                                                                setLandmarkLocation(parsed);
                                                                                if (parsed.name) {
                                                                                    setNewLandmarkName(parsed.name);
                                                                                }
                                                                            }
                                                                        }}`;

if (content.includes(searchOnChange)) {
  content = content.replace(searchOnChange, replacementOnChange);
} else {
  console.error("CRITICAL: searchOnChange not found!");
}

// 6. Update Konversi click handler
const searchKonversi = `                                                                        onClick={async () => {
                                                                            const parsed = parseGoogleMapsUrl(googleMapsUrlInput);
                                                                            if (parsed) {
                                                                                setLandmarkLocation(parsed);
                                                                                alert('Berhasil mengonversi koordinat dari input!');
                                                                            } else if (googleMapsUrlInput.includes('maps.app.goo.gl') || googleMapsUrlInput.includes('goo.gl')) {
                                                                                alert('Mengonversi short link Google Maps... Silakan tunggu sebentar.');
                                                                                const shortParsed = await parseShortLinkCoordinates(googleMapsUrlInput);
                                                                                if (shortParsed) {
                                                                                    setLandmarkLocation(shortParsed);
                                                                                    alert('Berhasil mengonversi koordinat dari short link maps!');
                                                                                } else {
                                                                                    alert('Gagal mengonversi short link. Pastikan link maps valid dan aktif.');
                                                                                }
                                                                            } else {
                                                                                alert('Format tidak dikenali atau koordinat tidak ditemukan.');
                                                                            }
                                                                        }}`;

const replacementKonversi = `                                                                        onClick={async () => {
                                                                            const parsed = parseGoogleMapsUrl(googleMapsUrlInput);
                                                                            if (parsed) {
                                                                                setLandmarkLocation(parsed);
                                                                                if (parsed.name) {
                                                                                    setNewLandmarkName(parsed.name);
                                                                                }
                                                                                alert('Berhasil mengonversi koordinat dari input!');
                                                                            } else if (googleMapsUrlInput.includes('maps.app.goo.gl') || googleMapsUrlInput.includes('goo.gl')) {
                                                                                alert('Mengonversi short link Google Maps... Silakan tunggu sebentar.');
                                                                                const shortParsed = await parseShortLinkCoordinates(googleMapsUrlInput);
                                                                                if (shortParsed) {
                                                                                    setLandmarkLocation(shortParsed);
                                                                                    if (shortParsed.name) {
                                                                                        setNewLandmarkName(shortParsed.name);
                                                                                    }
                                                                                    alert('Berhasil mengonversi koordinat dari short link maps!');
                                                                                } else {
                                                                                    alert('Gagal mengonversi short link. Pastikan link maps valid dan aktif.');
                                                                                }
                                                                            } else {
                                                                                alert('Format tidak dikenali atau koordinat tidak ditemukan.');
                                                                            }
                                                                        }}`;

if (content.includes(searchKonversi)) {
  content = content.replace(searchKonversi, replacementKonversi);
} else {
  console.error("CRITICAL: searchKonversi not found!");
}

// Convert back to CRLF
content = content.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, content, 'utf8');
console.log("Auto extraction of landmark name successfully applied.");
