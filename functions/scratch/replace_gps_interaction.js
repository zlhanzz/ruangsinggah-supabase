const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Declare kmOriginalLocationRef and confirmLocationChange helper
const targetRefDecl = `    const kmMapRef = useRef<HTMLDivElement>(null);
    const kmMapInstance = useRef<any>(null);
    const kmMarkerInstance = useRef<any>(null);`;

const replacementRefDecl = `    const kmMapRef = useRef<HTMLDivElement>(null);
    const kmMapInstance = useRef<any>(null);
    const kmMarkerInstance = useRef<any>(null);
    const kmOriginalLocationRef = useRef<any>(null);

    const confirmLocationChange = () => {
        if (kmOriginalLocationRef.current && kmOriginalLocationRef.current.lat) {
            return window.confirm("Apakah Anda yakin ingin mengubah titik lokasi GPS kost yang sudah terdaftar sebelumnya?");
        }
        return true;
    };`;

if (content.includes(targetRefDecl)) {
  content = content.replace(targetRefDecl, replacementRefDecl);
  console.log("Decl and Helper added.");
} else {
  console.error("Target ref decl not found!");
}

// 2. Add click handler on Leaflet map initialization
const mapInitTarget = `            const marker = L.marker([initialLat, initialLng]).addTo(map);

            kmMapInstance.current = map;
            kmMarkerInstance.current = marker;`;

const mapInitReplacement = `            const marker = L.marker([initialLat, initialLng]).addTo(map);

            map.on('click', (e: any) => {
                if (confirmLocationChange()) {
                    setKmListingForm(prev => ({
                        ...prev,
                        location: { lat: e.latlng.lat, lng: e.latlng.lng }
                    }));
                }
            });

            kmMapInstance.current = map;
            kmMarkerInstance.current = marker;`;

if (content.includes(mapInitTarget)) {
  content = content.replace(mapInitTarget, mapInitReplacement);
  console.log("Map click handler bound.");
} else {
  console.error("Map init target not found!");
}

// 3. Update openKostManagerListing to set original location ref
const openKMTarget = `            if (existingProp) {
                console.log("openKostManagerListing: found existing property to load:", existingProp.id);
                setKmListingForm({`;

const openKMReplacement = `            if (existingProp) {
                console.log("openKostManagerListing: found existing property to load:", existingProp.id);
                kmOriginalLocationRef.current = existingProp.location || null;
                setKmListingForm({`;

if (content.includes(openKMTarget)) {
  content = content.replace(openKMTarget, openKMReplacement);
  console.log("openKostManagerListing existing branch updated.");
} else {
  console.error("openKMTarget not found!");
}

const openKMFallbackTarget = `        // Fallback initialization
        setKmListingForm({`;

const openKMFallbackReplacement = `        // Fallback initialization
        kmOriginalLocationRef.current = null;
        setKmListingForm({`;

if (content.includes(openKMFallbackTarget)) {
  content = content.replace(openKMFallbackTarget, openKMFallbackReplacement);
  console.log("openKostManagerListing fallback branch updated.");
} else {
  console.error("openKMFallbackTarget not found!");
}

// 4. Update the geolocation button click handler in JSX to check confirmLocationChange
const geoButtonTarget = `                                                     <button
                                                         type="button"
                                                         onClick={() => {
                                                             if (navigator.geolocation) {
                                                                 navigator.geolocation.getCurrentPosition((pos) => {`;

const geoButtonReplacement = `                                                     <button
                                                         type="button"
                                                         onClick={() => {
                                                             if (confirmLocationChange()) {
                                                                 if (navigator.geolocation) {
                                                                     navigator.geolocation.getCurrentPosition((pos) => {`;

const geoButtonEndTarget = `                                                                 }, err => alert('Gagal membaca GPS: ' + err.message));
                                                             }
                                                         }}`;

const geoButtonEndReplacement = `                                                                 }, err => alert('Gagal membaca GPS: ' + err.message));
                                                                 }
                                                             }
                                                         }}`;

if (content.includes(geoButtonTarget) && content.includes(geoButtonEndTarget)) {
  content = content.replace(geoButtonTarget, geoButtonReplacement);
  content = content.replace(geoButtonEndTarget, geoButtonEndReplacement);
  console.log("Geolocation button confirm updated.");
} else {
  // Let's try to search with regex/partial matching if exact fails, but let's check first.
  console.error("Geolocation button patterns not found exactly.");
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log("Finished.");
