import fs from 'fs';

async function inspectHtml() {
    const url = `https://www.google.com/maps/search/Masjid+99+Kubah+Makassar`;
    const res = await fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept-Language": "id-ID,id;q=0.9"
        }
    });
    const html = await res.text();
    fs.writeFileSync("scratch/gmaps_sample.html", html, "utf-8");
    console.log("HTML length:", html.length);

    // Cari koordinat yang mendekati -5.14 dan 119.39
    const regex = /-5\.1[345]\d+/g;
    const matches = [...html.matchAll(regex)];
    console.log("Found matches around -5.14:", matches.map(m => m[0]));
}

inspectHtml();
