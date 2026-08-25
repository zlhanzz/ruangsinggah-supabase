const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

const searchStr = `    useEffect(() => {
        if (kmLandmarkMarkerInstance.current && landmarkLocation) {
            kmLandmarkMarkerInstance.current.setLatLng([landmarkLocation.lat, landmarkLocation.lng]);
            if (kmLandmarkMapInstance.current) {
                kmLandmarkMapInstance.current.panTo([landmarkLocation.lat, landmarkLocation.lng]);
            }
        }
    }, [landmarkLocation.lat, landmarkLocation.lng]);`;

const replacementStr = `    useEffect(() => {
        if (kmLandmarkMarkerInstance.current && landmarkLocation) {
            kmLandmarkMarkerInstance.current.setLatLng([landmarkLocation.lat, landmarkLocation.lng]);
            if (kmLandmarkMapInstance.current) {
                kmLandmarkMapInstance.current.panTo([landmarkLocation.lat, landmarkLocation.lng]);
            }
        }
    }, [landmarkLocation.lat, landmarkLocation.lng]);

    // Invalidate landmark map size when input method switches to ensure rendering remains clean
    useEffect(() => {
        if (kmLandmarkMapInstance.current) {
            setTimeout(() => {
                kmLandmarkMapInstance.current?.invalidateSize();
            }, 100);
        }
    }, [landmarkInputMethod]);`;

if (content.includes(searchStr)) {
  content = content.replace(searchStr, replacementStr);
  console.log("Landmark map size invalidator added successfully.");
} else {
  console.error("CRITICAL: searchStr not found!");
}

// Convert back to CRLF
content = content.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, content, 'utf8');
