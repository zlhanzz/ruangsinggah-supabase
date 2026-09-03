const API_KEY = "AIzaSyBAsdbPynnAWSRZ_1iQ3hmoCUAnq5VrV7c";

async function testPlace(name, city) {
    const query = `${name} ${city}`;
    const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=name,geometry,formatted_address&key=${API_KEY}`;
    const res = await fetch(url, {
        headers: {
            "Referer": "http://localhost:5173/",
            "Origin": "http://localhost:5173"
        }
    });
    const data = await res.json();
    console.log(`\n=== FIND PLACE: ${query} ===`);
    console.log("Status:", data.status);
    if (data.candidates && data.candidates.length > 0) {
        const c = data.candidates[0];
        console.log("Found:", c.name);
        console.log("Address:", c.formatted_address);
        console.log("Lat, Lng:", c.geometry.location.lat, c.geometry.location.lng);
    } else {
        console.log("Error / Result:", data.error_message || data);
    }
}

async function run() {
    await testPlace("Masjid 99 Kubah CPI", "Makassar");
    await testPlace("Politeknik Pariwisata Negeri Makassar", "Makassar");
}

run();
