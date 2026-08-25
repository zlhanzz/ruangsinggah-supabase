const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');
const lines = content.split('\n');

// 1. Extract temporaryRoom Foto Kamar section
let tempPhotoStart = -1;
let tempPhotoEnd = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Dokumentasi Foto Kamar') && lines[i].includes('span') && lines[i-1] && lines[i-1].includes('border-gray-150') && i < 4000) {
    tempPhotoStart = i - 1;
    let divCount = 0;
    for (let j = tempPhotoStart; j < tempPhotoStart + 150; j++) {
      const line = lines[j];
      const hasOpen = line.includes('<div') && !line.includes('</div');
      const hasClose = line.includes('</div');
      if (hasOpen) divCount++;
      if (hasClose) divCount--;
      if (divCount === 0 && j > tempPhotoStart) {
        tempPhotoEnd = j;
        break;
      }
    }
    break;
  }
}

if (tempPhotoStart !== -1 && tempPhotoEnd !== -1) {
  console.log(`Extracting temporaryRoom photo block from lines ${tempPhotoStart+1} to ${tempPhotoEnd+1}`);
  const photoLines = lines.slice(tempPhotoStart, tempPhotoEnd + 1);
  lines.splice(tempPhotoStart, tempPhotoEnd - tempPhotoStart + 1);
  
  // Find where CONDITIONAL SECTIONS starts for temporaryRoom (which is under 3800 now)
  let insertIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('CONDITIONAL SECTIONS') && lines[i+1] && lines[i+1].includes('temporaryRoom.isAvailable') && i < 3800) {
      insertIdx = i;
      break;
    }
  }
  
  if (insertIdx !== -1) {
    console.log(`Inserting temporaryRoom photo block at line ${insertIdx+1}`);
    lines.splice(insertIdx, 0, ...photoLines);
  } else {
    console.log("Could not find temporaryRoom insertIdx!");
  }
}

// 2. Extract activeRoomIdx Foto Kamar section
let midContent = lines.join('\n');
const lines2 = midContent.split('\n');

let activePhotoStart = -1;
let activePhotoEnd = -1;

for (let i = 0; i < lines2.length; i++) {
  if (lines2[i].includes('Dokumentasi Foto Kamar') && lines2[i].includes('span') && lines2[i-1] && lines2[i-1].includes('border-gray-150') && i > 4100) {
    activePhotoStart = i - 1;
    let divCount = 0;
    for (let j = activePhotoStart; j < activePhotoStart + 150; j++) {
      const line = lines2[j];
      const hasOpen = line.includes('<div') && !line.includes('</div');
      const hasClose = line.includes('</div');
      if (hasOpen) divCount++;
      if (hasClose) divCount--;
      if (divCount === 0 && j > activePhotoStart) {
        activePhotoEnd = j;
        break;
      }
    }
    break;
  }
}

if (activePhotoStart !== -1 && activePhotoEnd !== -1) {
  console.log(`Extracting activeRoomIdx photo block from lines ${activePhotoStart+1} to ${activePhotoEnd+1}`);
  const photoLines = lines2.slice(activePhotoStart, activePhotoEnd + 1);
  lines2.splice(activePhotoStart, activePhotoEnd - activePhotoStart + 1);
  
  // Find where CONDITIONAL SECTIONS starts for activeRoomIdx
  let insertIdx = -1;
  for (let i = 0; i < lines2.length; i++) {
    if (lines2[i].includes('CONDITIONAL SECTIONS') && lines2[i+1] && lines2[i+1].includes('isOccupied') && i > 4000) {
      insertIdx = i;
      break;
    }
  }
  
  if (insertIdx !== -1) {
    console.log(`Inserting activeRoomIdx photo block at line ${insertIdx+1}`);
    lines2.splice(insertIdx, 0, ...photoLines);
  } else {
    console.log("Could not find activeRoomIdx insertIdx!");
  }
}

let finalContent = lines2.join('\n');
// Convert back to CRLF
finalContent = finalContent.replace(/\n/g, '\r\n');

fs.writeFileSync(targetFile, finalContent, 'utf8');
console.log("Done moving Foto Kamar section out of conditional blocks.");
