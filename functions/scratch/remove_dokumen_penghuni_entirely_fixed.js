const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');
const lines = content.split('\n');

// Find all indices of 'Dokumen Penghuni' comments
const indices = [];
lines.forEach((line, idx) => {
  if (line.includes('Dokumen Penghuni') && line.includes('{/*')) {
    indices.push(idx);
  }
});

console.log("Found Dokumen Penghuni comments at indices:", indices.map(i => i + 1));

// Remove them from bottom-to-top to avoid index shifting problems
for (let idx of indices.reverse()) {
  // The div container starts at either idx + 1 or idx + 2
  let containerStart = -1;
  for (let j = idx + 1; j < idx + 5; j++) {
    if (lines[j] && lines[j].includes('<div') && lines[j].includes('border-gray-150')) {
      containerStart = j;
      break;
    }
  }
  
  if (containerStart !== -1) {
    let containerEnd = -1;
    let divCount = 0;
    for (let k = containerStart; k < containerStart + 200; k++) {
      const line = lines[k];
      const hasOpen = line.includes('<div') && !line.includes('</div');
      const hasClose = line.includes('</div');
      
      if (hasOpen) divCount++;
      if (hasClose) divCount--;
      
      if (divCount === 0 && k > containerStart) {
        containerEnd = k;
        break;
      }
    }
    
    if (containerEnd !== -1) {
      console.log(`Removing Dokumen Penghuni container from line ${idx + 1} to ${containerEnd + 1}`);
      lines.splice(idx, containerEnd - idx + 1);
    } else {
      console.log(`CRITICAL: Container end not found for Dokumen Penghuni starting at line ${containerStart + 1}`);
    }
  } else {
    console.log(`CRITICAL: Container start not found for Dokumen Penghuni at line ${idx + 1}`);
  }
}

let finalContent = lines.join('\n');
// Convert back to CRLF
finalContent = finalContent.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, finalContent, 'utf8');

console.log("Dokumen Penghuni panels successfully removed from both temporaryRoom and activeRoomIdx.");
