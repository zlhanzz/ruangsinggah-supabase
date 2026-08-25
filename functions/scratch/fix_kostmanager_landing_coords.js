const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/KostManagerLanding.tsx');
let code = fs.readFileSync(targetFile, 'utf8');

const target = `            setFormData({
              kostName: first.title || '',
              kostType: first.type || '',
              totalRooms: totalRoomsCalculated > 0 ? String(totalRoomsCalculated) : '10',
              emptyRooms: '0',
              address: first.address || '',
              googleMapsLink: ''
            });`;

const replacement = `            // Construct maps link from coordinates if available
            let mapsLink = '';
            if (first.location && first.location.lat && first.location.lng) {
              mapsLink = \`https://www.google.com/maps?q=\${first.location.lat},\${first.location.lng}\`;
              setMapCoords({ lat: Number(first.location.lat), lng: Number(first.location.lng) });
            }

            setFormData({
              kostName: first.title || '',
              kostType: first.type || '',
              totalRooms: totalRoomsCalculated > 0 ? String(totalRoomsCalculated) : '10',
              emptyRooms: '0',
              address: first.address || '',
              googleMapsLink: mapsLink
            });`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    console.log("KostManagerLanding.tsx initial load coordinates fix successfully applied.");
} else {
    // Try LF
    const targetLF = target.replace(/\r\n/g, '\n');
    const codeLF = code.replace(/\r\n/g, '\n');
    if (codeLF.includes(targetLF)) {
        code = codeLF.replace(targetLF, replacement);
        console.log("KostManagerLanding.tsx initial load coordinates fix (LF) successfully applied.");
    } else {
        console.error("ERROR: target not found in KostManagerLanding.tsx!");
    }
}

fs.writeFileSync(targetFile, code, 'utf8');
console.log("Done patching KostManagerLanding.tsx.");
