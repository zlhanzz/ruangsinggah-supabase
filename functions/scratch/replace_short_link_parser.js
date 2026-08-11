const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Declare parseShortLinkCoordinates helper function
const helperTarget = `    const parseGoogleMapsUrl = (url: string) => {`;
const helperReplacement = `    const parseShortLinkCoordinates = async (shortUrl: string) => {
        try {
            const proxyUrl = \`https://api.allorigins.win/get?url=\${encodeURIComponent(shortUrl)}\`;
            const res = await fetch(proxyUrl);
            const data = await res.json();
            const html = data.contents;
            
            // Search for coordinates in the HTML page content
            const centerRegex = /center=(-?\\d+\\.\\d+)%2C(-?\\d+\\.\\d+)/;
            let match = html.match(centerRegex);
            
            if (!match) {
                const llRegex = /ll=(-?\\d+\\.\\d+),(-?\\d+\\.\\d+)/;
                match = html.match(llRegex);
            }
            
            if (!match) {
                const mapUrlRegex = /@(-?\\d+\\.\\d+),(-?\\d+\\.\\d+)/;
                match = html.match(mapUrlRegex);
            }
            
            if (!match) {
                const qRegex = /[?&]q=(-?\\d+\\.\\d+),(-?\\d+\\.\\d+)/;
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
    };

    const parseGoogleMapsUrl = (url: string) => {`;

if (content.includes(helperTarget) && !content.includes('parseShortLinkCoordinates')) {
  content = content.replace(helperTarget, helperReplacement);
  console.log("parseShortLinkCoordinates helper added.");
}

// 2. Update the button onClick in JSX to handle short links
const buttonTarget = `                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const parsed = parseGoogleMapsUrl(googleMapsUrlInput);
                                                                    if (parsed) {
                                                                        setLandmarkLocation(parsed);
                                                                        alert('Berhasil mengonversi koordinat dari input!');
                                                                    } else {
                                                                        alert('Format tidak dikenali atau koordinat tidak ditemukan.');
                                                                    }
                                                                }}`;

const buttonReplacement = `                                                            <button
                                                                type="button"
                                                                onClick={async () => {
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

if (content.includes(buttonTarget)) {
  content = content.replace(buttonTarget, buttonReplacement);
  console.log("Button onClick updated successfully!");
} else {
  // Try normalized regex
  const escaped = buttonTarget.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
  content = content.replace(new RegExp(escaped), buttonReplacement);
  console.log("Button onClick updated via regex!");
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log("Done.");
