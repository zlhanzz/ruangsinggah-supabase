const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

const lines = content.split('\n');

// Helper to remove prefilled roomTypes block from a specific starting line
function clearPrefilledRoomTypes(startIdx) {
  // Only match unreplaced roomTypes: [ (ignore roomTypes: [])
  let searchIdx = lines.findIndex((l, idx) => idx >= startIdx && l.includes('roomTypes: [') && !l.includes('roomTypes: []'));
  if (searchIdx === -1) return false;
  
  // Find the closing ],
  let endIdx = -1;
  for (let i = searchIdx; i < searchIdx + 40; i++) {
    if (lines[i].includes('],') && lines[i].trim() === '],') {
      endIdx = i;
      break;
    }
  }
  
  if (endIdx !== -1) {
    console.log(`Found prefilled roomTypes from line ${searchIdx + 1} to ${endIdx + 1}. Replacing with empty array.`);
    lines.splice(searchIdx, (endIdx - searchIdx) + 1, '        roomTypes: [],');
    return searchIdx + 1; // Return next index to continue searching from
  }
  return false;
}

// 1. Clear first occurrence (default state declaration)
let nextStart = clearPrefilledRoomTypes(0);

// 2. Clear second occurrence (fallback initialization)
if (nextStart) {
  clearPrefilledRoomTypes(nextStart);
}

let finalContent = lines.join('\n');
// Convert back to CRLF
finalContent = finalContent.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, finalContent, 'utf8');
console.log("Done making default room types empty.");
