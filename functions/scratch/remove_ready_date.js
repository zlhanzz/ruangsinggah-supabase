const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');
const lines = content.split('\n');

// 1. Remove Informasi Kamar Kosong from temporaryRoom
let tempStart = -1;
let tempEnd = -1;
for (let i = 3700; i < 3800; i++) {
  if (lines[i] && lines[i].includes('Informasi Kamar Kosong') && lines[i].includes('{/*')) {
    tempStart = i;
    break;
  }
}

if (tempStart !== -1) {
  // The container closes with </div> at line 3782. Let's find it.
  for (let j = tempStart; j < tempStart + 30; j++) {
    if (lines[j] && lines[j].trim() === '</div>' && lines[j-1] && lines[j-1].trim() === '</div>') {
      tempEnd = j;
      break;
    }
  }
}

if (tempStart !== -1 && tempEnd !== -1) {
  console.log("Removing Informasi Kamar Kosong from temporaryRoom at lines", tempStart + 1, "to", tempEnd + 1);
  lines.splice(tempStart, tempEnd - tempStart + 1);
} else {
  console.log("CRITICAL: temporaryRoom Informasi Kamar Kosong indices not found! tempStart:", tempStart, "tempEnd:", tempEnd);
}

// 2. Remove Informasi Kamar Kosong from activeRoomIdx
let intermediateContent = lines.join('\n');
const intermediateLines = intermediateContent.split('\n');

let activeStart = -1;
let activeEnd = -1;
for (let i = 4300; i < 4450; i++) {
  if (intermediateLines[i] && intermediateLines[i].includes('Informasi Kamar Kosong') && intermediateLines[i].includes('{/*')) {
    activeStart = i;
    break;
  }
}

if (activeStart !== -1) {
  // Let's find the closing </div> of this container.
  for (let j = activeStart; j < activeStart + 30; j++) {
    if (intermediateLines[j] && intermediateLines[j].trim() === '</div>' && intermediateLines[j-1] && intermediateLines[j-1].trim() === '</div>') {
      activeEnd = j;
      break;
    }
  }
}

if (activeStart !== -1 && activeEnd !== -1) {
  console.log("Removing Informasi Kamar Kosong from activeRoomIdx at lines", activeStart + 1, "to", activeEnd + 1);
  intermediateLines.splice(activeStart, activeEnd - activeStart + 1);
} else {
  console.log("CRITICAL: activeRoomIdx Informasi Kamar Kosong indices not found! activeStart:", activeStart, "activeEnd:", activeEnd);
}

let finalContent = intermediateLines.join('\n');
// Convert back to CRLF
finalContent = finalContent.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, finalContent, 'utf8');

console.log("Done removing Informasi Kamar Kosong.");
