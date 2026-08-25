const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let code = fs.readFileSync(targetFile, 'utf8');

// 1. Insert propertyCoordinates state and useEffect after searchParams definition
const stateAndEffect = `    const [propertyCoordinates, setPropertyCoordinates] = useState<Record<string, { lat: number; lng: number }>>({});

    useEffect(() => {
        const fetchPropertyCoordinates = async () => {
            const propertyIds = new Set();
            surveyRequests.forEach(req => {
                const propertyId = req.property_id || req.transaction?.metadata?.propertyId;
                if (propertyId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(propertyId)) {
                    propertyIds.add(propertyId);
                }
            });

            if (propertyIds.size === 0) return;

            try {
                const { data, error } = await supabase
                    .from('properties')
                    .select('id, location')
                    .in('id', Array.from(propertyIds));
                
                if (error) {
                    console.error("Error fetching properties coordinates:", error);
                    return;
                }

                const coordsMap = {};
                data?.forEach(prop => {
                    if (prop.location && prop.location.lat && prop.location.lng) {
                        coordsMap[prop.id] = {
                            lat: Number(prop.location.lat),
                            lng: Number(prop.location.lng)
                        };
                    }
                });
                setPropertyCoordinates(prev => ({ ...prev, ...coordsMap }));
            } catch (err) {
                console.error("Failed to load property coordinates:", err);
            }
        };

        fetchPropertyCoordinates();
    }, [surveyRequests]);

    const generateReferralCode = () => {`;

if (code.includes('const generateReferralCode = () => {')) {
    code = code.replace('const generateReferralCode = () => {', stateAndEffect);
    console.log("1. propertyCoordinates state and useEffect added.");
} else {
    console.error("ERROR: generateReferralCode signature not found!");
}

// 2. Update openKostManagerListing coordinates extraction block to prioritize propCoords
const openKostManagerTarget = `            // Extract initial coords from metadata maps link, notes, or kost_name
            let initialCoords = { lat: -5.147665, lng: 119.432731 };
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

const openKostManagerReplacement = `            // Extract initial coords from propertyCoordinates map, metadata maps link, notes, or kost_name
            const propertyId = req.property_id || transactionMetadata.propertyId;
            const propCoords = propertyId ? propertyCoordinates[propertyId] : null;

            let initialCoords = propCoords || { lat: -5.147665, lng: 119.432731 };
            if (!propCoords) {
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
                }
            }`;

if (code.includes(openKostManagerTarget)) {
    code = code.replace(openKostManagerTarget, openKostManagerReplacement);
    console.log("2. openKostManagerListing coordinates extraction updated.");
} else {
    // Try LF
    const openKostManagerTargetLF = openKostManagerTarget.replace(/\r\n/g, '\n');
    const codeLF = code.replace(/\r\n/g, '\n');
    if (codeLF.includes(openKostManagerTargetLF)) {
        code = codeLF.replace(openKostManagerTargetLF, openKostManagerReplacement);
        console.log("2. openKostManagerListing coordinates extraction (LF) updated.");
    } else {
        console.error("ERROR: openKostManagerTarget not found!");
    }
}

// 3. Update card location section block in AgentDashboard.tsx to prioritize propCoords and filter default coords
const cardMapTarget = `                                        // Parse coordinates from any potential URL fields first
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
                                        const lng = coords?.lng || meta.location?.lng || meta.longitude || (req as any).longitude;`;

const cardMapReplacement = `                                        // Parse coordinates from propertyCoordinates, potential URL fields, or meta
                                        const propertyId = req.property_id || meta.propertyId;
                                        const propCoords = propertyId ? propertyCoordinates[propertyId] : null;

                                        let coords = propCoords || null;
                                        if (!coords) {
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
                                        }
                                        
                                        // Use direct metadata coordinates only if they are not default
                                        if (!coords) {
                                            const metaLat = meta.location?.lat || meta.latitude || (req as any).latitude;
                                            const metaLng = meta.location?.lng || meta.longitude || (req as any).longitude;
                                            if (metaLat && metaLng && (Number(metaLat) !== -5.147665 || Number(metaLng) !== 119.432731)) {
                                                coords = { lat: Number(metaLat), lng: Number(metaLng) };
                                            }
                                        }
                                        
                                        const lat = coords?.lat || -5.147665;
                                        const lng = coords?.lng || 119.432731;`;

if (code.includes(cardMapTarget)) {
    code = code.replace(cardMapTarget, cardMapReplacement);
    console.log("3. Card location section logic successfully updated.");
} else {
    // Try with LF newlines
    const cardMapTargetLF = cardMapTarget.replace(/\r\n/g, '\n');
    const codeLF = code.replace(/\r\n/g, '\n');
    if (codeLF.includes(cardMapTargetLF)) {
        code = codeLF.replace(cardMapTargetLF, cardMapReplacement);
        console.log("3. Card location section (LF) successfully updated.");
    } else {
        console.error("ERROR: cardMapTarget not found!");
    }
}

fs.writeFileSync(targetFile, code, 'utf8');
console.log("AgentDashboard.tsx GPS v3 updated successfully.");
