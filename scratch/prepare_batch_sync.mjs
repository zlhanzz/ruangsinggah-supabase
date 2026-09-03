import fs from 'fs';
import path from 'path';

// Baca curatedLandmarks.ts
const tsContent = fs.readFileSync('functions/public/constants/curatedLandmarks.ts', 'utf-8');

// Ekstrak objek-objek landmark dengan regex
// Format: { id: '...', name: '...', category: '...', city: '...', province: '...', lat: ..., lng: ..., aliases: [...] }
const itemRegex = /{\s*id:\s*['"]([^'"]+)['"],\s*name:\s*['"]([^'"]+)['"],\s*category:\s*['"]([^'"]+)['"],\s*city:\s*['"]([^'"]+)['"],\s*province:\s*['"]([^'"]+)['"],\s*lat:\s*(-?[\d\.]+),\s*lng:\s*(-?[\d\.]+)/g;

const landmarks = [];
let m;
while ((m = itemRegex.exec(tsContent)) !== null) {
    landmarks.push({
        id: m[1],
        name: m[2],
        category: m[3],
        city: m[4],
        province: m[5],
        oldLat: parseFloat(m[6]),
        oldLng: parseFloat(m[7])
    });
}

console.log(`Parsed ${landmarks.length} landmarks from curatedLandmarks.ts`);

// Buat HTML file yang memuat PlacesService untuk mengekstrak seluruh 271 landmarks
const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <title>National Landmarks Google Maps Synchronizer</title>
</head>
<body>
    <h2>Resolving 271 National Landmarks with Official Google Maps Places API...</h2>
    <div id="progress" style="font-weight: bold; margin: 10px 0;">Starting...</div>
    <div id="summary"></div>
    <pre id="output"></pre>

    <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyBAsdbPynnAWSRZ_1iQ3hmoCUAnq5VrV7c&libraries=places"></script>
    <script>
        const landmarks = ${JSON.stringify(landmarks, null, 2)};

        window.addEventListener('load', async () => {
            const progressEl = document.getElementById('progress');
            const outputEl = document.getElementById('output');
            const summaryEl = document.getElementById('summary');

            const placesService = new google.maps.places.PlacesService(document.createElement('div'));
            const geocoder = new google.maps.Geocoder();

            const resolvedResults = [];
            let successCount = 0;
            let fallbackCount = 0;

            for (let i = 0; i < landmarks.length; i++) {
                const item = landmarks[i];
                const cleanName = item.name.replace(/\\s*\\([^)]*\\)/g, '').trim();
                const searchQuery = cleanName + " " + item.city;
                progressEl.innerText = \`Processing [\${i + 1}/\${landmarks.length}]: \${item.name} (\${item.city})...\`;

                await new Promise((resolve) => {
                    placesService.findPlaceFromQuery({
                        query: searchQuery,
                        fields: ['name', 'geometry', 'formatted_address']
                    }, (res, status) => {
                        if (status === google.maps.places.PlacesServiceStatus.OK && res && res[0]) {
                            const p = res[0];
                            resolvedResults.push({
                                id: item.id,
                                name: item.name,
                                city: item.city,
                                gmapsName: p.name,
                                gmapsAddress: p.formatted_address,
                                lat: p.geometry.location.lat(),
                                lng: p.geometry.location.lng(),
                                method: 'findPlaceFromQuery'
                            });
                            successCount++;
                            resolve();
                        } else {
                            // Fallback Geocoder
                            geocoder.geocode({ address: item.name + ", " + item.city + ", Indonesia" }, (gRes, gStatus) => {
                                if (gStatus === 'OK' && gRes && gRes[0]) {
                                    resolvedResults.push({
                                        id: item.id,
                                        name: item.name,
                                        city: item.city,
                                        gmapsName: gRes[0].formatted_address,
                                        lat: gRes[0].geometry.location.lat(),
                                        lng: gRes[0].geometry.location.lng(),
                                        method: 'geocoder'
                                    });
                                    fallbackCount++;
                                } else {
                                    // Retain existing if both fail
                                    resolvedResults.push({
                                        id: item.id,
                                        name: item.name,
                                        city: item.city,
                                        lat: item.oldLat,
                                        lng: item.oldLng,
                                        method: 'retained_old'
                                    });
                                }
                                resolve();
                            });
                        }
                    });
                });

                // Google Places API rate limit debounce
                await new Promise(r => setTimeout(r, 220));
            }

            progressEl.innerText = "ALL 271 LANDMARKS RESOLVED COMPLETE!";
            summaryEl.innerHTML = \`<p>Total: \${resolvedResults.length}, PlacesService: \${successCount}, Geocoder: \${fallbackCount}</p>\`;
            outputEl.innerText = JSON.stringify(resolvedResults, null, 2);

            // POST to a temporary local collector or render into DOM for headless dump
            const metaResult = document.createElement('div');
            metaResult.id = "FINAL_GMAPS_PAYLOAD";
            metaResult.textContent = JSON.stringify(resolvedResults);
            document.body.appendChild(metaResult);
        });
    </script>
</body>
</html>`;

fs.writeFileSync('functions/public/public/sync_all_gmaps.html', htmlContent, 'utf-8');
console.log('Created functions/public/public/sync_all_gmaps.html successfully!');
