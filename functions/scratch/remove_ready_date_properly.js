const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');
const lines = content.split('\n');

// 1. Remove the readyDate input block from activeRoomIdx form (around line 4382)
let activeHeaderIdx = lines.findIndex(l => l.includes('Informasi Kamar Kosong') && l.includes('span') && l.includes('pb-1'));
if (activeHeaderIdx !== -1) {
  console.log("Replacing activeRoomIdx header at index:", activeHeaderIdx);
  lines[activeHeaderIdx] = lines[activeHeaderIdx].replace('Informasi Kamar Kosong', 'Harga Sewa Kamar');
  
  // Find readyDate input wrapper block right after header
  let inputStart = -1;
  let inputEnd = -1;
  for (let i = activeHeaderIdx; i < activeHeaderIdx + 10; i++) {
    if (lines[i].includes('Tanggal Kamar Siap Huni')) {
      // Find the start of parent div (usually lines[i-1])
      inputStart = i - 1;
      break;
    }
  }
  
  if (inputStart !== -1) {
    // Find the closing div of Tanggal Kamar Siap Huni input wrapper
    for (let j = inputStart; j < inputStart + 15; j++) {
      if (lines[j].trim() === '</div>') {
        inputEnd = j;
        break;
      }
    }
  }
  
  if (inputStart !== -1 && inputEnd !== -1) {
    console.log("Removing activeRoomIdx readyDate input at lines:", inputStart + 1, "to", inputEnd + 1);
    lines.splice(inputStart, inputEnd - inputStart + 1);
  } else {
    console.log("CRITICAL: activeRoomIdx readyDate input not found! inputStart:", inputStart, "inputEnd:", inputEnd);
  }
} else {
  console.log("CRITICAL: activeHeaderIdx NOT found!");
}

let finalContent = lines.join('\n');
// Convert back to CRLF
finalContent = finalContent.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, finalContent, 'utf8');

console.log("Done properly removing readyDate fields.");
