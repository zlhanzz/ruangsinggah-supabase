const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
// Read fresh from git if possible, or just read the current file
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');
const lines = content.split('\n');

function clearPrefilledRoomTypes(startIdx) {
  let searchIdx = lines.findIndex((l, idx) => idx >= startIdx && l.includes('roomTypes: ['));
  console.log(`SearchIdx for startIdx ${startIdx}: ${searchIdx}`);
  if (searchIdx === -1) return false;
  
  // Find the closing ],
  let endIdx = -1;
  for (let i = searchIdx; i < searchIdx + 40; i++) {
    if (lines[i].includes('],') && lines[i].trim() === '],') {
      endIdx = i;
      break;
    }
  }
  console.log(`EndIdx for searchIdx ${searchIdx}: ${endIdx}`);
  
  if (endIdx !== -1) {
    console.log(`Found prefilled roomTypes from line ${searchIdx + 1} to ${endIdx + 1}. Replacing with empty array.`);
    lines.splice(searchIdx, (endIdx - searchIdx) + 1, '        roomTypes: [],');
    return searchIdx + 1; // Return next index to continue searching from
  }
  return false;
}

let nextStart = clearPrefilledRoomTypes(0);
if (nextStart) {
  clearPrefilledRoomTypes(nextStart);
}
