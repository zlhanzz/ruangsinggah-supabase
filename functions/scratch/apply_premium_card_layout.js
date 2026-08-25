const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

// Search for the beginning of map loop in AgentDashboard
const startPattern = '                    {filteredRequests.map((req: SurveyRequest) => (';
const startIdx = content.indexOf(startPattern);

if (startIdx === -1) {
  if (content.includes('isKostManager')) {
    console.log("Premium card layout already present in AgentDashboard.tsx. Skipping.");
    process.exit(0);
  }
  console.error("CRITICAL ERROR: Could not find start loop pattern in AgentDashboard.tsx!");
  process.exit(1);
}

// Find next conditional block search helper
const nextBlockPattern = '                    {filteredRequests.length === 0';
const nextBlockIdx = content.indexOf(nextBlockPattern, startIdx);

if (nextBlockIdx === -1) {
  console.error("CRITICAL ERROR: Could not find next block pattern in AgentDashboard.tsx!");
  process.exit(1);
}

// Search backwards from nextBlockIdx for the ending "}" of the map loop
const endIdx = content.lastIndexOf('}', nextBlockIdx);

if (endIdx === -1 || endIdx < startIdx) {
  console.error("CRITICAL ERROR: Could not find ending brace of map loop in AgentDashboard.tsx!");
  process.exit(1);
}

// Read premium card replacement JSX from local replacement.txt
const replacementPath = path.join(__dirname, 'replacement.txt');
if (!fs.existsSync(replacementPath)) {
  console.error(`CRITICAL ERROR: Local replacement.txt not found at ${replacementPath}!`);
  process.exit(1);
}
let replacement = fs.readFileSync(replacementPath, 'utf8');
replacement = replacement.replace(/\r\n/g, '\n');

// Perform replacement
content = content.substring(0, startIdx) + replacement + content.substring(endIdx + 1);
console.log("Premium Card Loop replacement injected successfully from local replacement.txt.");

// Convert back to CRLF
content = content.replace(/\n/g, '\r\n');
fs.writeFileSync(filePath, content, 'utf8');
console.log("apply_premium_card_layout logic completed.");
