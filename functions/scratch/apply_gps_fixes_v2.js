const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let code = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
code = code.replace(/\r\n/g, '\n');

// 1. Insert extractCoordinates helper function before AgentDashboard definition
const helperFunc = `const extractCoordinates = (mapsUrl: string | null | undefined) => {
    if (!mapsUrl || typeof mapsUrl !== 'string') return null;
    
    // 1. Try parsing coordinates directly in query string: ?q=lat,lng or ?query=lat,lng
    let match = mapsUrl.match(/[?&](?:q|query|daddr)=([-\\d.]+),([-\\d.]+)/);
    if (match) {
        return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
    }
    
    // 2. Try parsing coordinates in URL path: /@lat,lng or /place/lat,lng
    match = mapsUrl.match(/@([-\\d.]+),([-\\d.]+)/);
    if (match) {
        return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
    }

    // 3. Try parsing plain coordinates from the text e.g. "-5.1234, 119.5678"
    match = mapsUrl.match(/(-?\\d+\\.\\d+)\\s*,\\s*(-?\\d+\\.\\d+)/);
    if (match) {
        return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
    }

    return null;
};

const AgentDashboard: React.FC<AgentDashboardProps> = ({`;

if (code.includes('const AgentDashboard: React.FC<AgentDashboardProps> = ({')) {
    code = code.replace('const AgentDashboard: React.FC<AgentDashboardProps> = ({', helperFunc);
    console.log("1. extractCoordinates helper successfully added.");
} else if (code.includes('const extractCoordinates =')) {
    console.log("1. extractCoordinates helper already present.");
} else {
    console.error("ERROR 1: AgentDashboard signature not found!");
}

// 2. Insert initialTotalRooms and initialCoords variables calculation at the start of openKostManagerListing
// We locate the start of openKostManagerListing
const startTarget = `        setKmActiveTab('info');
        setKmStep(1);

        
        try {
            // Find propertyId from transaction metadata if exists
            let propertyIdToFetch = null;`;

const startReplacement = `        let initialTotalRooms = 0;
        let initialCoords = { lat: -5.147665, lng: 119.432731 };
        setKmActiveTab('info');
        setKmStep(1);

        
        try {
            // Find propertyId from transaction metadata if exists
            let propertyIdToFetch = null;
            let transactionMetadata = req.transaction?.metadata || {};`;

if (code.includes(startTarget)) {
    code = code.replace(startTarget, startReplacement);
    console.log("2. openKostManagerListing target variables initialized.");
} else if (code.includes('let initialTotalRooms = 0;')) {
    console.log("2. openKostManagerListing target variables already initialized.");
} else {
    console.error("ERROR 2: openKostManagerListing startTarget not found!");
}

// 3. Fetch metadata and parse rooms/coordinates (placed inside try block of openKostManagerListing)
// Target matches the state after fix_onboarding_routing.js and load_from_mitra_kostmanager_first.js
const metadataTarget = `            if (req.transaction_id) {
                const { data: trxData } = await supabase
                    .from('transactions')
                    .select('metadata')
                    .eq('id', req.transaction_id)
                    .maybeSingle();
                const rawPropId = trxData?.metadata?.propertyId;
                const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                if (rawPropId && uuidPattern.test(rawPropId)) {
                    propertyIdToFetch = rawPropId;
                    console.log("openKostManagerListing: found valid propertyId in transaction metadata:", propertyIdToFetch);
                } else if (rawPropId) {
                    console.warn("openKostManagerListing: propertyId in metadata is not a valid UUID, ignoring:", rawPropId);
                }
            }`;

const metadataReplacement = `            if (req.transaction_id) {
                const { data: trxData } = await supabase
                    .from('transactions')
                    .select('metadata')
                    .eq('id', req.transaction_id)
                    .maybeSingle();
                if (trxData?.metadata) {
                    transactionMetadata = trxData.metadata;
                }
                const rawPropId = trxData?.metadata?.propertyId;
                const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                if (rawPropId && uuidPattern.test(rawPropId)) {
                    propertyIdToFetch = rawPropId;
                    console.log("openKostManagerListing: found valid propertyId in transaction metadata:", propertyIdToFetch);
                } else if (rawPropId) {
                    console.warn("openKostManagerListing: propertyId in metadata is not a valid UUID, ignoring:", rawPropId);
                }
            }

            // Calculate Mitra's initial input for total rooms and coordinates from transaction metadata or notes
            const parsedMetaRooms = transactionMetadata.total_rooms || transactionMetadata.totalRooms || transactionMetadata.jumlah_kamar;
            if (parsedMetaRooms) {
                initialTotalRooms = Number(parsedMetaRooms) || 0;
            }
            if (!initialTotalRooms && req.notes) {
                const m = req.notes.match(/Total Kamar:\\s*(\\d+)/i);
                if (m) {
                    initialTotalRooms = Number(m[1]) || 0;
                }
            }

            // Extract coordinates
            const possibleLocationUrls = [
                transactionMetadata.googleMapsLink,
                transactionMetadata.google_maps_url,
                req.kost_name,
                req.notes
            ];
            for (const url of possibleLocationUrls) {
                if (url) {
                    const parsed = extractCoordinates(url);
                    if (parsed) {
                        initialCoords = parsed;
                        break;
                    }
                }
            }
            if (initialCoords.lat === -5.147665 && initialCoords.lng === 119.432731) {
                const directLat = transactionMetadata.location?.lat || transactionMetadata.latitude || (req as any).latitude;
                const directLng = transactionMetadata.location?.lng || transactionMetadata.longitude || (req as any).longitude;
                if (directLat && directLng) {
                    initialCoords = { lat: Number(directLat), lng: Number(directLng) };
                }
            }`;

if (code.includes(metadataTarget)) {
    code = code.replace(metadataTarget, metadataReplacement);
    console.log("3. Metadata extraction logic injected.");
} else if (code.includes('const parsedMetaRooms =')) {
    console.log("3. Metadata extraction logic already present.");
} else {
    console.error("ERROR 3: metadataTarget not found!");
}

// 4. Update KmListingForm values in setKmListingForm in openKostManagerListing
// We replace 'totalRooms: kmProp.total_rooms || 0,' and location values in all 3 blocks

code = code.replace(
    /totalRooms:\s*kmProp\.total_rooms\s*\|\|\s*0,/,
    "totalRooms: (kmProp.total_rooms && kmProp.total_rooms > 0) ? kmProp.total_rooms : (initialTotalRooms || 0),"
);
code = code.replace(
    /location:\s*kmProp\.location\s*\|\|\s*{\s*lat:\s*-5\.147665,\s*lng:\s*119\.432731\s*},/,
    "location: kmProp.location || initialCoords,"
);

code = code.replace(
    /totalRooms:\s*existingProp\.total_rooms\s*\|\|\s*0,/,
    "totalRooms: (existingProp.total_rooms && existingProp.total_rooms > 0) ? existingProp.total_rooms : (initialTotalRooms || 0),"
);
code = code.replace(
    /location:\s*existingProp\.location\s*\|\|\s*{\s*lat:\s*-5\.147665,\s*lng:\s*119\.432731\s*},/,
    "location: existingProp.location || initialCoords,"
);

code = code.replace(
    /totalRooms:\s*0,\s*\n\s*owner_uid:\s*req\.user_id,\s*\n\s*roomTypes:\s*\[\],\s*\n\s*publicBathroomFacilities:\s*\[\],\s*\n\s*publicKitchenFacilities:\s*\[\],\s*\n\s*facilities:\s*\[[^\]]+\]\s*,\s*\n\s*location:\s*{\s*lat:\s*-5\.147665,\s*lng:\s*119\.432731\s*}/,
    `totalRooms: initialTotalRooms || 0,
            owner_uid: req.user_id,
            roomTypes: [],
            publicBathroomFacilities: [],
            publicKitchenFacilities: [],
            facilities: ['WiFi', 'Parkir Motor', 'Dapur Bersama'],
            location: initialCoords`
);

console.log("4. Prefill logic updated inside setKmListingForm structures.");

// 5. Update Map Rendering in Task card to support extracted coords preview
const cardMapFind = `                                                 const meta = req.transaction?.metadata || {};
                                                 const lat = meta.location?.lat || meta.latitude;
                                                 const lng = meta.location?.lng || meta.longitude;
                                                 const mapsUrl = meta.googleMapsLink || (lat && lng ? \`https://www.google.com/maps/search/?api=1&query=\${lat},\${lng}\` : null);`;

const cardMapReplace = `                                                 const meta = req.transaction?.metadata || {};
                                                 let lat = meta.location?.lat || meta.latitude || (req as any).latitude;
                                                 let lng = meta.location?.lng || meta.longitude || (req as any).longitude;
                                                 const mapsUrl = meta.googleMapsLink || (req as any).google_maps_url || (lat && lng ? \`https://www.google.com/maps/search/?api=1&query=\${lat},\${lng}\` : null);
                                                 
                                                 // Try extracting coordinates from text notes/name if still missing
                                                 if (!lat || !lng) {
                                                     const extracted = extractCoordinates(meta.googleMapsLink || (req as any).google_maps_url || req.kost_name || req.notes);
                                                     if (extracted) {
                                                         lat = extracted.lat;
                                                         lng = extracted.lng;
                                                     }
                                                 }`;

if (code.includes(cardMapFind)) {
    code = code.replace(cardMapFind, cardMapReplace);
    console.log("5. Card maps coord preview successfully updated.");
} else if (code.includes('// Try extracting coordinates from text notes/name')) {
    console.log("5. Card maps coord preview already updated.");
} else {
    console.error("ERROR 5: cardMapFind target not found!");
}

// Convert back to CRLF
code = code.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, code, 'utf8');
console.log("apply_gps_fixes_v2 logic completed.");
