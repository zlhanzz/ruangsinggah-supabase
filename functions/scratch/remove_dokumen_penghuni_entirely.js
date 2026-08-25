const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');
const lines = content.split('\n');

let replacedTemp = false;
let replacedActive = false;

for (let i = 0; i < lines.length; i++) {
  // Find "Dokumen Penghuni" in temporaryRoom
  if (!replacedTemp && lines[i].includes('Dokumen Penghuni') && lines[i].includes('span') && lines[i-1] && lines[i-1].includes('border-gray-150') && i < 4000) {
    let containerStart = i - 1;
    let containerEnd = -1;
    let divCount = 0;
    for (let j = containerStart; j < containerStart + 100; j++) {
      const line = lines[j];
      const hasOpen = line.includes('<div') && !line.includes('</div');
      const hasClose = line.includes('</div');
      if (hasOpen) divCount++;
      if (hasClose) divCount--;
      if (divCount === 0 && j > containerStart) {
        containerEnd = j;
        break;
      }
    }
    if (containerEnd !== -1) {
      console.log(`Removing temporaryRoom Dokumen Penghuni block at lines ${containerStart+1} to ${containerEnd+1}`);
      lines.splice(containerStart, containerEnd - containerStart + 1);
      replacedTemp = true;
    }
  }
}

// Re-split
let midContent = lines.join('\n');
const lines2 = midContent.split('\n');

for (let i = 0; i < lines2.length; i++) {
  // Find "Dokumen Penghuni" in activeRoomIdx (i > 4200)
  if (!replacedActive && lines2[i].includes('Dokumen Penghuni') && lines2[i].includes('span') && lines2[i-1] && lines2[i-1].includes('border-gray-150') && i > 4200) {
    let containerStart = i - 1;
    let containerEnd = -1;
    let divCount = 0;
    for (let j = containerStart; j < containerStart + 100; j++) {
      const line = lines2[j];
      const hasOpen = line.includes('<div') && !line.includes('</div');
      const hasClose = line.includes('</div');
      if (hasOpen) divCount++;
      if (hasClose) divCount--;
      if (divCount === 0 && j > containerStart) {
        containerEnd = j;
        break;
      }
    }
    if (containerEnd !== -1) {
      console.log(`Removing activeRoomIdx Dokumen Penghuni block at lines ${containerStart+1} to ${containerEnd+1}`);
      lines2.splice(containerStart, containerEnd - containerStart + 1);
      replacedActive = true;
      break;
    }
  }
}

let finalContent = lines2.join('\n');
// Convert back to CRLF
finalContent = finalContent.replace(/\n/g, '\r\n');

fs.writeFileSync(targetFile, finalContent, 'utf8');
console.log("Done removing Dokumen Penghuni panel entirely.");
