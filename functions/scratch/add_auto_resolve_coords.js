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
            const missingReqs = surveyRequests.filter(req => {
                const isKostManager = req.notes?.includes('KostManager Onboarding') || req.task_type === 'kostmanager';
                if (!isKostManager) return false;
                if (requestsCoords[req.id]) return false;
                
                const meta = req.transaction?.metadata || {};
                const lat = meta.location?.lat || meta.latitude || (req as any).latitude;
                const lng = meta.location?.lng || meta.longitude || (req as any).longitude;
                if (!lat || !lng) return true;
                
                const isDefaultMakassar = Math.abs(lat - (-5.147665)) < 0.0001 && Math.abs(lng - 119.432731) < 0.0001;
                return isDefaultMakassar;
            });
            
            if (missingReqs.length === 0) return;
            
            try {
                const newCoords: Record<string, { lat: number; lng: number }> = {};
                await Promise.all(missingReqs.map(async (req) => {
                    if (!req.user_id) return;
                    const { data, error } = await supabase
                        .from('properties')
                        .select('location')
                        .eq('owner_uid', req.user_id)
                        .maybeSingle();
                        
                    if (!error && data?.location) {
                        const loc = data.location as any;
                        if (loc.lat && loc.lng) {
                            newCoords[req.id] = { lat: Number(loc.lat), lng: Number(loc.lng) };
                        }
                    }
                }));
                if (Object.keys(newCoords).length > 0) {
                    setRequestsCoords(prev => ({ ...prev, ...newCoords }));
                }
            } catch (err) {
                console.error("Error fetching coordinates via individual query:", err);
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
