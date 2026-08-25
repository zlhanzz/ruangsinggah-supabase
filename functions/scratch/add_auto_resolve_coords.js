const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let code = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
code = code.replace(/\r\n/g, '\n');

// 1. Declare state and useEffect after state declarations
const stateTarget = `    const [uploadingPublicAreas, setUploadingPublicAreas] = useState<Record<number, boolean>>({});`;
const stateInjection = `    const [uploadingPublicAreas, setUploadingPublicAreas] = useState<Record<number, boolean>>({});
    const [requestsCoords, setRequestsCoords] = useState<Record<string, { lat: number; lng: number }>>({});

    useEffect(() => {
        if (!surveyRequests || surveyRequests.length === 0) return;
        
        const fetchCoords = async () => {
            const newCoords: Record<string, { lat: number; lng: number }> = {};

            // 1. Sync from localStorage drafts first (Instant prefill if agent has opened the listing form)
            surveyRequests.forEach(req => {
                if (requestsCoords[req.id]) return;
                try {
                    // Try KostManager draft
                    const kmDraftKey = 'km_draft_' + req.id;
                    const kmDraft = localStorage.getItem(kmDraftKey);
                    if (kmDraft) {
                        const parsed = JSON.parse(kmDraft);
                        const loc = parsed?.kmListingForm?.location;
                        if (loc?.lat && loc?.lng) {
                            newCoords[req.id] = { lat: Number(loc.lat), lng: Number(loc.lng) };
                            return;
                        }
                    }
                    
                    // Try regular survey draft
                    const surveyDraftKey = 'survey_draft_' + req.id;
                    const surveyDraft = localStorage.getItem(surveyDraftKey);
                    if (surveyDraft) {
                        const parsed = JSON.parse(surveyDraft);
                        if (parsed?.latitude && parsed?.longitude) {
                            newCoords[req.id] = { lat: Number(parsed.latitude), lng: Number(parsed.longitude) };
                            return;
                        }
                    }
                } catch (e) {
                    console.warn("Failed to parse draft from localStorage:", e);
                }
            });

            // 2. Identify remaining requests that need database query lookup
            const missingReqs = surveyRequests.filter(req => {
                const isKostManager = checkIsKostManager(req);
                if (!isKostManager) return false;
                if (requestsCoords[req.id] || newCoords[req.id]) return false;
                
                const meta = req.transaction?.metadata || {};
                const lat = meta.location?.lat || meta.latitude || (req as any).latitude;
                const lng = meta.location?.lng || meta.longitude || (req as any).longitude;
                if (!lat || !lng) return true;
                
                const isDefaultMakassar = Math.abs(lat - (-5.147665)) < 0.0001 && Math.abs(lng - 119.432731) < 0.0001;
                return isDefaultMakassar;
            });
            
            if (missingReqs.length === 0) {
                if (Object.keys(newCoords).length > 0) {
                    setRequestsCoords(prev => ({ ...prev, ...newCoords }));
                }
                return;
            }
            
            try {
                await Promise.all(missingReqs.map(async (req) => {
                    if (!req.user_id) return;
                    
                    // A. Try mitra_kostmanager table query
                    try {
                        const { data: kmProps } = await supabase
                            .from('mitra_kostmanager')
                            .select('location')
                            .eq('owner_uid', req.user_id)
                            .limit(1);
                            
                        if (kmProps && kmProps.length > 0 && kmProps[0].location) {
                            let loc = kmProps[0].location;
                            if (typeof loc === 'string') {
                                try { loc = JSON.parse(loc); } catch (e) {}
                            }
                            if (loc && loc.lat && loc.lng) {
                                newCoords[req.id] = { lat: Number(loc.lat), lng: Number(loc.lng) };
                                return; // Found, skip properties query
                            }
                        }
                    } catch (e) {
                        console.warn("mitra_kostmanager query error:", e);
                    }

                    // B. Try properties table query fallback
                    try {
                        const { data: props } = await supabase
                            .from('properties')
                            .select('location')
                            .eq('owner_uid', req.user_id);
                            
                        if (props && props.length > 0) {
                            const prop = props[0]; // fallback to the first property
                            if (prop.location) {
                                let loc = prop.location;
                                if (typeof loc === 'string') {
                                    try { loc = JSON.parse(loc); } catch (e) {}
                                }
                                if (loc && loc.lat && loc.lng) {
                                    newCoords[req.id] = { lat: Number(loc.lat), lng: Number(loc.lng) };
                                }
                            }
                        }
                    } catch (e) {
                        console.warn("properties query error:", e);
                    }
                }));
                
                if (Object.keys(newCoords).length > 0) {
                    setRequestsCoords(prev => ({ ...prev, ...newCoords }));
                }
            } catch (err) {
                console.error("Error fetching coordinates from tables:", err);
            }
        };
        
        fetchCoords();
    }, [surveyRequests, requestsCoords]);`;

if (code.includes(stateTarget)) {
    code = code.replace(stateTarget, stateInjection);
    console.log("1. requestsCoords state and auto-resolve hook successfully injected.");
} else {
    console.error("ERROR 1: stateTarget not found!");
}

// Convert back to CRLF
code = code.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, code, 'utf8');
console.log("add_auto_resolve_coords logic completed.");
