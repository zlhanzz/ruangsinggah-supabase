const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

const targetStr = `                    owner_uid: req.user_id,
                    roomTypes: existingProp.room_types || [],
                    facilities: existingProp.facilities || ['WiFi', 'Parkir Motor'],`;

const replacementStr = `                    owner_uid: req.user_id,
                    roomTypes: [], // Start empty for Kost Manager onboarding as requested
                    facilities: existingProp.facilities || ['WiFi', 'Parkir Motor'],`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  console.log("Successfully replaced exact!");
} else {
  console.error("Target block not found!");
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log("Done.");
