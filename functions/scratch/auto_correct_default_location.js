const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

// 1. Target the declaration position after kmActiveTab state declaration
const stateTarget = `    const [kmActiveTab, setKmActiveTab] = useState<'info' | 'rooms'>('info');`;

const stateReplacement = `    const [kmActiveTab, setKmActiveTab] = useState<'info' | 'rooms'>('info');
    const hasAutoGeocodedRef = useRef<Record<string, boolean>>({});

    // Auto-correct default location coordinates based on text address
    useEffect(() => {
        if (!isEditingKostManager) return;
        const reqId = isEditingKostManager.id;
        if (hasAutoGeocodedRef.current[reqId]) return;
        
        const loc = kmListingForm.location;
        const addr = kmListingForm.address;
        
        if (loc && Math.abs(loc.lat - (-5.147665)) < 0.0001 && Math.abs(loc.lng - 119.432731) < 0.0001 && addr && addr.length > 5) {
            hasAutoGeocodedRef.current[reqId] = true;
            
            const parts = addr.split(',');
            const query1 = parts.slice(0, Math.min(parts.length, 3)).join(', ');
            
            console.log("Auto-correcting default coordinates. Query 1:", query1);
            fetch(\`https://nominatim.openstreetmap.org/search?format=json&q=\${encodeURIComponent(query1)}&limit=1\`)
                .then(res => res.json())
                .then(data => {
                    if (data && data.length > 0) {
                        const newLoc = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
                        console.log("Auto-corrected default location coordinates to:", newLoc);
                        setKmListingForm(prev => ({
                            ...prev,
                            location: newLoc
                        }));
                    } else {
                        // Fallback query: Street + City
                        const query2 = parts[0] + ", Makassar";
                        console.log("Query 1 failed. Try fallback Query 2:", query2);
                        fetch(\`https://nominatim.openstreetmap.org/search?format=json&q=\${encodeURIComponent(query2)}&limit=1\`)
                            .then(res2 => res2.json())
                            .then(data2 => {
                                if (data2 && data2.length > 0) {
                                    const newLoc = { lat: parseFloat(data2[0].lat), lng: parseFloat(data2[0].lon) };
                                    console.log("Auto-corrected location coordinates using Query 2 to:", newLoc);
                                    setKmListingForm(prev => ({
                                        ...prev,
                                        location: newLoc
                                    }));
                                }
                            })
                            .catch(e => console.error("Auto geocoding fallback error:", e));
                    }
                })
                .catch(e => console.error("Auto geocoding error:", e));
        }
    }, [isEditingKostManager, kmListingForm.location, kmListingForm.address]);`;

if (content.includes(stateTarget)) {
  content = content.replace(stateTarget, stateReplacement);
  console.log("Auto-correct coordinates hook successfully updated with robust queries.");
} else {
  console.error("CRITICAL: kmActiveTab state declaration not found!");
}

// Convert back to CRLF
content = content.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, content, 'utf8');
