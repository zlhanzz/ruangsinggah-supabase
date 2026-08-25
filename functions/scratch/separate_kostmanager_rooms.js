const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

const searchStr = `            if (existingProp) {
                console.log("openKostManagerListing: found existing property to load:", existingProp.id);`;

const replacementStr = `            let kmRoomTypes = [];
            if (existingProp) {
                console.log("openKostManagerListing: found existing property to load:", existingProp.id);
                // Fetch from dedicated mitra_kostmanager table to check if there is existing Kost Manager room data
                const { data: kmProp } = await supabase
                    .from('mitra_kostmanager')
                    .select('room_types')
                    .eq('property_id', existingProp.id)
                    .maybeSingle();
                if (kmProp && kmProp.room_types) {
                    kmRoomTypes = kmProp.room_types;
                } else {
                    kmRoomTypes = []; // Start fresh from zero if no dedicated Kost Manager record exists yet
                }`;

if (content.includes(searchStr)) {
  content = content.replace(searchStr, replacementStr);
  
  // Now replace the roomTypes initialization in setKmListingForm inside openKostManagerListing
  content = content.replace(
    "roomTypes: [], // Start empty for Kost Manager onboarding as requested",
    "roomTypes: kmRoomTypes, // Dynamically load from mitra_kostmanager or start fresh from zero"
  );
  console.log("Kost Manager room types successfully separated from normal properties.");
} else {
  console.error("CRITICAL: openKostManagerListing property search block not found!");
}

// Convert back to CRLF
content = content.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, content, 'utf8');
