const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

// Find the auto-save useEffect
const targetStr = "if (isEditingKostManager && kmListingForm.owner_uid) {";
const replacementStr = "if (isEditingKostManager && kmListingForm.owner_uid && kmListingForm.owner_uid === isEditingKostManager.user_id) {";

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  console.log("Auto-save draft guard successfully updated to prevent race conditions.");
} else {
  console.error("CRITICAL: Auto-save draft check not found!");
}

// Convert back to CRLF
content = content.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, content, 'utf8');
