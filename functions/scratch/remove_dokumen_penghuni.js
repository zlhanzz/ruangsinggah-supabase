const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');
const lines = content.split('\n');

// 1. Remove Dokumen Penghuni from temporaryRoom (around index 3963)
let tempStart = -1;
let tempEnd = -1;
for (let i = 3900; i < 4000; i++) {
  if (lines[i] && lines[i].includes('Dokumen Penghuni') && lines[i].includes('{/*')) {
    tempStart = i;
    break;
  }
}

if (tempStart !== -1) {
  // Find where the </div> ends. The container starts with <div className="border border-gray-150 rounded-xl p-4...
  // Let's scan forward for the matching closing div of this container.
  // It has a matching `</div>` at line 4070. Let's find it.
  for (let j = tempStart; j < tempStart + 120; j++) {
    if (lines[j] && lines[j].trim() === '</div>' && lines[j-1] && lines[j-1].trim() === '</div>' && lines[j-2] && lines[j-2].trim() === '</div>') {
      // Wait, let's verify line index around 4070
    }
  }
  // Let's search for the line index containing `{/* Save Button for New Room */}` which is around 4074
  let saveBtnIdx = -1;
  for (let j = tempStart; j < tempStart + 120; j++) {
    if (lines[j] && lines[j].includes('Save Button for New Room')) {
      saveBtnIdx = j;
      break;
    }
  }
  if (saveBtnIdx !== -1) {
    // The closing div of Dokumen Penghuni is right before saveBtnIdx (usually 4 lines before)
    for (let k = saveBtnIdx - 1; k >= tempStart; k--) {
      if (lines[k] && lines[k].trim() === '</div>') {
        tempEnd = k;
        break;
      }
    }
  }
}

if (tempStart !== -1 && tempEnd !== -1) {
  console.log("Removing Dokumen Penghuni from temporaryRoom at lines", tempStart + 1, "to", tempEnd + 1);
  // Delete lines from tempStart to tempEnd inclusive
  lines.splice(tempStart, tempEnd - tempStart + 1);
} else {
  console.log("CRITICAL: temporaryRoom Dokumen Penghuni indices not found! tempStart:", tempStart, "tempEnd:", tempEnd);
}

// 2. Remove Dokumen Penghuni from activeRoomIdx form (around index 4755, but after deletion it will be shifted)
// Let's re-join and split to get correct line indices after first deletion
let intermediateContent = lines.join('\n');
const intermediateLines = intermediateContent.split('\n');

let activeStart = -1;
let activeEnd = -1;
for (let i = 4500; i < 4800; i++) {
  if (intermediateLines[i] && intermediateLines[i].includes('Dokumen Penghuni') && intermediateLines[i].includes('{/*')) {
    activeStart = i;
    break;
  }
}

if (activeStart !== -1) {
  let saveBtnIdx = -1;
  for (let j = activeStart; j < activeStart + 150; j++) {
    if (intermediateLines[j] && intermediateLines[j].includes('Simpan Perubahan Button')) {
      saveBtnIdx = j;
      break;
    }
  }
  if (saveBtnIdx !== -1) {
    for (let k = saveBtnIdx - 1; k >= activeStart; k--) {
      if (intermediateLines[k] && intermediateLines[k].trim() === '</div>') {
        activeEnd = k;
        break;
      }
    }
  }
}

if (activeStart !== -1 && activeEnd !== -1) {
  console.log("Removing Dokumen Penghuni from activeRoomIdx at lines", activeStart + 1, "to", activeEnd + 1);
  intermediateLines.splice(activeStart, activeEnd - activeStart + 1);
} else {
  console.log("CRITICAL: activeRoomIdx Dokumen Penghuni indices not found! activeStart:", activeStart, "activeEnd:", activeEnd);
}

let finalContent = intermediateLines.join('\n');
// Convert back to CRLF
finalContent = finalContent.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, finalContent, 'utf8');

console.log("Done removing Dokumen Penghuni.");
