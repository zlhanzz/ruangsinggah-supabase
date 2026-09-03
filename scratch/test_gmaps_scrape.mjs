async function getGoogleMapsCoordinates(query) {
    try {
        const url = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
        const res = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7"
            }
        });
        const html = await res.text();

        // 1. Cek meta image static map atau URL redirect
        // Contoh: /@lat,lng,
        const urlMatch = html.match(/@(-?\d+\.\d+),(-?\d+\.\d+),/);
        if (urlMatch) {
            return { lat: parseFloat(urlMatch[1]), lng: parseFloat(urlMatch[2]), method: "url_match" };
        }

        // 2. Cek window.APP_INITIALIZATION_STATE
        // Pattern: [null,null,lat,lng]
        const stateMatch = html.match(/window\.APP_INITIALIZATION_STATE\s*=\s*\[\[\[(-?\d+\.\d+),(-?\d+\.\d+)\]/);
        if (stateMatch) {
            return { lat: parseFloat(stateMatch[1]), lng: parseFloat(stateMatch[2]), method: "state_match_1" };
        }

        // Cari pola coordinate pair di APP_INITIALIZATION_STATE
        // /\[null,null,(-?\d+\.\d{4,}),(-?\d+\.\d{4,})\]/
        const pairMatch = html.match(/\[null,null,(-?\d+\.\d{4,}),(-?\d+\.\d{4,})\]/);
        if (pairMatch) {
            return { lat: parseFloat(pairMatch[1]), lng: parseFloat(pairMatch[2]), method: "pair_match" };
        }

        // Cari pola meta tag
        // <meta content="...center=(-?\d+\.\d+)%2C(-?\d+\.\d+)..."
        const metaMatch = html.match(/center=(-?\d+\.\d+)%2C(-?\d+\.\d+)/);
        if (metaMatch) {
            return { lat: parseFloat(metaMatch[1]), lng: parseFloat(metaMatch[2]), method: "meta_match" };
        }

        // Cek pola itemprop="image" content="https://maps.google.com/maps/api/staticmap?center=-5.147285%2C119.398642
        const staticMatch = html.match(/staticmap\?center=(-?\d+\.\d+)%2C(-?\d+\.\d+)/);
        if (staticMatch) {
            return { lat: parseFloat(staticMatch[1]), lng: parseFloat(staticMatch[2]), method: "staticmap_match" };
        }

        return { error: "not_found", length: html.length };
    } catch (e) {
        return { error: e.message };
    }
}

async function run() {
    console.log("Testing Google Maps Direct Scraping...");
    const queries = [
        "Masjid 99 Kubah CPI Makassar",
        "Politeknik Pariwisata Negeri Makassar",
        "Center Point of Indonesia Makassar",
        "Universitas Hasanuddin Tamalanrea Makassar"
    ];

    for (const q of queries) {
        const res = await getGoogleMapsCoordinates(q);
        console.log(`\nQuery: "${q}"`);
        console.log("Result:", res);
        await new Promise(r => setTimeout(r, 1000));
    }
}

run();
