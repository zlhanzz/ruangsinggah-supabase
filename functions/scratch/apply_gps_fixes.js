const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let code = fs.readFileSync(targetFile, 'utf8');

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
} else {
    console.error("ERROR: AgentDashboard signature not found!");
}

// 2. Update openKostManagerListing to compute initialTotalRooms and initialCoords
const openKostManagerTarget = `        setKmActiveTab('info');
        setKmStep(1);

        
        try {
            // Find propertyId from transaction metadata if exists
            let propertyIdToFetch = null;
            if (req.transaction_id) {
                const { data: trxData } = await supabase
                    .from('transactions')
                    .select('metadata')
                    .eq('id', req.transaction_id)
                    .maybeSingle();
                if (trxData?.metadata?.propertyId) {
                    propertyIdToFetch = trxData.metadata.propertyId;
                    console.log("openKostManagerListing: found propertyId in transaction metadata:", propertyIdToFetch);
                }
            }`;

const openKostManagerReplacement = `        let initialTotalRooms = 0;
        let initialCoords = { lat: -5.147665, lng: 119.432731 };
        setKmActiveTab('info');
        setKmStep(1);

        
        try {
            // Find propertyId from transaction metadata if exists
            let propertyIdToFetch = null;
            let transactionMetadata = req.transaction?.metadata || {};

            if (req.transaction_id) {
                const { data: trxData } = await supabase
                    .from('transactions')
                    .select('metadata')
                    .eq('id', req.transaction_id)
                    .maybeSingle();
                if (trxData?.metadata) {
                    transactionMetadata = trxData.metadata;
                }
                if (trxData?.metadata?.propertyId) {
                    propertyIdToFetch = trxData.metadata.propertyId;
                    console.log("openKostManagerListing: found propertyId in transaction metadata:", propertyIdToFetch);
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

if (code.includes(openKostManagerTarget)) {
    code = code.replace(openKostManagerTarget, openKostManagerReplacement);
    console.log("2. openKostManagerListing target variables successfully replaced.");
} else {
    console.error("ERROR: openKostManagerListing target not found!");
}

// 3. Update kmProp loader totalRooms and location setting
const kmPropTarget = `                setKmListingForm({
                    title: kmProp.title || req.kost_name,
                    description: kmProp.description || '',
                    address: kmProp.address || req.kost_address,
                    city: kmProp.city || 'Makassar',
                    area: kmProp.area || '',
                    type: kmProp.type || 'Campur',
                    price: kmProp.price || 0,
                    totalRooms: kmProp.total_rooms || 0,
                    owner_uid: req.user_id,
                    roomTypes: kmProp.room_types || [],
                    facilities: kmProp.facilities || ['WiFi', 'Parkir Motor'],
                    location: kmProp.location || { lat: -5.147665, lng: 119.432731 },`;

const kmPropReplacement = `                setKmListingForm({
                    title: kmProp.title || req.kost_name,
                    description: kmProp.description || '',
                    address: kmProp.address || req.kost_address,
                    city: kmProp.city || 'Makassar',
                    area: kmProp.area || '',
                    type: kmProp.type || 'Campur',
                    price: kmProp.price || 0,
                    totalRooms: (kmProp.total_rooms && kmProp.total_rooms > 0) ? kmProp.total_rooms : (initialTotalRooms || 0),
                    owner_uid: req.user_id,
                    roomTypes: kmProp.room_types || [],
                    facilities: kmProp.facilities || ['WiFi', 'Parkir Motor'],
                    location: kmProp.location || initialCoords,`;

if (code.includes(kmPropTarget)) {
    code = code.replace(kmPropTarget, kmPropReplacement);
    console.log("3. kmProp loader fields successfully updated.");
} else {
    console.error("ERROR: kmPropTarget not found!");
}

// 4. Update existingProp loader totalRooms and location setting
const existingPropTarget = `                setKmListingForm({
                    title: existingProp.title || req.kost_name,
                    description: existingProp.description || '',
                    address: existingProp.address || req.kost_address,
                    city: existingProp.city || 'Makassar',
                    area: existingProp.area || '',
                    type: existingProp.type || 'Campur',
                    price: existingProp.price || 0,
                    totalRooms: existingProp.total_rooms || 0,
                    owner_uid: req.user_id,
                    roomTypes: [],
                    facilities: existingProp.facilities || ['WiFi', 'Parkir Motor'],
                    location: existingProp.location || { lat: -5.147665, lng: 119.432731 },`;

const existingPropReplacement = `                setKmListingForm({
                    title: existingProp.title || req.kost_name,
                    description: existingProp.description || '',
                    address: existingProp.address || req.kost_address,
                    city: existingProp.city || 'Makassar',
                    area: existingProp.area || '',
                    type: existingProp.type || 'Campur',
                    price: existingProp.price || 0,
                    totalRooms: (existingProp.total_rooms && existingProp.total_rooms > 0) ? existingProp.total_rooms : (initialTotalRooms || 0),
                    owner_uid: req.user_id,
                    roomTypes: [],
                    facilities: existingProp.facilities || ['WiFi', 'Parkir Motor'],
                    location: existingProp.location || initialCoords,`;

if (code.includes(existingPropTarget)) {
    code = code.replace(existingPropTarget, existingPropReplacement);
    console.log("4. existingProp loader fields successfully updated.");
} else {
    console.error("ERROR: existingPropTarget not found!");
}

// 5. Update final fallback initialization
const fallbackTarget = `        setKmListingForm({
            title: req.kost_name,
            description: '',
            address: req.kost_address,
            city: 'Makassar',
            area: '',
            type: 'Campur',
            price: 0,
            totalRooms: 0,
            owner_uid: req.user_id,
            roomTypes: [],
            publicBathroomFacilities: [],
            publicKitchenFacilities: [],
            facilities: ['WiFi', 'Parkir Motor', 'Dapur Bersama'],
            location: { lat: -5.147665, lng: 119.432731 },`;

const fallbackReplacement = `        setKmListingForm({
            title: req.kost_name,
            description: '',
            address: req.kost_address,
            city: 'Makassar',
            area: '',
            type: 'Campur',
            price: 0,
            totalRooms: initialTotalRooms || 0,
            owner_uid: req.user_id,
            roomTypes: [],
            publicBathroomFacilities: [],
            publicKitchenFacilities: [],
            facilities: ['WiFi', 'Parkir Motor', 'Dapur Bersama'],
            location: initialCoords,`;

if (code.includes(fallbackTarget)) {
    code = code.replace(fallbackTarget, fallbackReplacement);
    console.log("5. Fallback initialization successfully updated.");
} else {
    console.error("ERROR: fallbackTarget not found!");
}

// 6. Update card locations preview section
const cardMapTarget = `                                    {/* Location Section */}
                                    {(() => {
                                        const meta = req.transaction?.metadata || {};
                                        const lat = meta.location?.lat || meta.latitude || (req as any).latitude;
                                        const lng = meta.location?.lng || meta.longitude || (req as any).longitude;
                                        const mapsUrl = meta.googleMapsLink || (req as any).google_maps_url || (lat && lng ? \`https://www.google.com/maps/search/?api=1&query=\${lat},\${lng}\` : null);
                                        const regexMatch = req.notes?.match(/📍(?: Link)? GPS:\\s*(https?:\\/\\/\\S+)/);
                                        const finalUrl = mapsUrl || (regexMatch ? regexMatch[1] : null);`;

const cardMapReplacement = `                                    {/* Location Section */}
                                    {(() => {
                                        const meta = req.transaction?.metadata || {};
                                        
                                        // Parse coordinates from any potential URL fields first
                                        let coords = null;
                                        const possibleUrls = [
                                            meta.googleMapsLink,
                                            meta.google_maps_url,
                                            req.kost_name,
                                            req.notes
                                        ];
                                        for (const url of possibleUrls) {
                                            if (url) {
                                                const parsed = extractCoordinates(url);
                                                if (parsed) {
                                                    coords = parsed;
                                                    break;
                                                }
                                            }
                                        }
                                        
                                        // Fallback to direct properties or metadata coordinates
                                        const lat = coords?.lat || meta.location?.lat || meta.latitude || (req as any).latitude;
                                        const lng = coords?.lng || meta.location?.lng || meta.longitude || (req as any).longitude;
                                        
                                        const mapsUrl = meta.googleMapsLink || (req as any).google_maps_url || (lat && lng ? \`https://www.google.com/maps/search/?api=1&query=\${lat},\${lng}\` : null);
                                        const regexMatch = req.notes?.match(/📍(?: Link)? GPS:\\s*(https?:\\/\\/\\S+)/);
                                        const finalUrl = mapsUrl || (regexMatch ? regexMatch[1] : null);`;

if (code.includes(cardMapTarget)) {
    code = code.replace(cardMapTarget, cardMapReplacement);
    console.log("6. Card location section successfully updated.");
} else {
    // Try without carriage returns (\r\n vs \n)
    const cardMapTargetLF = cardMapTarget.replace(/\r\n/g, '\n');
    const codeLF = code.replace(/\r\n/g, '\n');
    if (codeLF.includes(cardMapTargetLF)) {
        code = codeLF.replace(cardMapTargetLF, cardMapReplacement);
        console.log("6. Card location section (LF) successfully updated.");
    } else {
        console.error("ERROR: cardMapTarget not found!");
    }
}

fs.writeFileSync(targetFile, code, 'utf8');
console.log("AgentDashboard.tsx updated successfully.");
