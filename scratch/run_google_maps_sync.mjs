import http from 'http';
import fs from 'fs';
import { spawn } from 'child_process';

const PORT = 4999;

// 1. Buat local receiver server
const server = http.createServer((req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.method === 'POST' && req.url === '/save') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                console.log(`\n[SUCCESS] Received ${data.length} resolved landmarks from Google Maps!`);

                // Simpan payload mentah
                fs.writeFileSync('scratch/google_maps_resolved_270.json', JSON.stringify(data, null, 2), 'utf-8');

                // Update curatedLandmarks.ts
                updateCuratedLandmarks(data);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'ok', count: data.length }));

                console.log("[DONE] All landmarks successfully updated in curatedLandmarks.ts!");

                // Tutup server & proses setelah selesai
                setTimeout(() => {
                    process.exit(0);
                }, 2000);
            } catch (err) {
                console.error("Error processing payload:", err);
                res.writeHead(500);
                res.end(err.message);
            }
        });
    } else {
        res.writeHead(404);
        res.end();
    }
});

function updateCuratedLandmarks(resolvedList) {
    const filePath = 'functions/public/constants/curatedLandmarks.ts';
    let content = fs.readFileSync(filePath, 'utf-8');

    let updatedCount = 0;
    for (const item of resolvedList) {
        if (!item.lat || !item.lng) continue;

        // Cari baris dengan id tersebut
        // Format: { id: 'mks-unhas-tamalanrea', ... lat: ..., lng: ... }
        const itemRegex = new RegExp(`({\\s*id:\\s*['"]${item.id}['"][^}]+?lat:\\s*)([\\-\\d\\.]+)(\\s*,\\s*lng:\\s*)([\\-\\d\\.]+)`);
        if (itemRegex.test(content)) {
            content = content.replace(itemRegex, `$1${item.lat.toFixed(6)}$3${item.lng.toFixed(6)}`);
            updatedCount++;
        }
    }

    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated ${updatedCount} landmark coordinates in ${filePath}`);
}

server.listen(PORT, () => {
    console.log(`Local sync receiver listening on http://localhost:${PORT}`);

    // Update HTML di functions/public/public/sync_all_gmaps.html agar melakukan fetch ke localhost:4999/save
    let html = fs.readFileSync('functions/public/public/sync_all_gmaps.html', 'utf-8');
    if (!html.includes('http://localhost:4999/save')) {
        html = html.replace(
            'document.body.appendChild(metaResult);',
            `document.body.appendChild(metaResult);
            fetch('http://localhost:4999/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(resolvedResults)
            }).then(() => console.log('POSTED TO LOCAL RECEIVER!')).catch(e => console.error('POST ERROR:', e));`
        );
        fs.writeFileSync('functions/public/public/sync_all_gmaps.html', html, 'utf-8');
    }

    // Jalankan Chrome Headless
    const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    console.log(`Launching Chrome headless to http://localhost:5173/sync_all_gmaps.html...`);
    const chromeProc = spawn(chromePath, [
        '--headless',
        '--disable-gpu',
        'http://localhost:5173/sync_all_gmaps.html'
    ]);

    chromeProc.on('error', (err) => {
        console.error("Failed to start Chrome:", err);
    });
});
