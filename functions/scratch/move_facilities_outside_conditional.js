const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');
const lines = content.split('\n');

// 1. Move temporaryRoom Facilities Block
let tempFacStartIdx = -1;
let tempFacEndIdx = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Fasilitas Kamar') && lines[i].includes('span') && lines[i-1] && lines[i-1].includes('border-gray-150') && i < 3600) {
    tempFacStartIdx = i - 1; // start of the container div
    // Find matching closing div
    let divCount = 0;
    for (let j = tempFacStartIdx; j < tempFacStartIdx + 100; j++) {
      const line = lines[j];
      const hasOpen = line.includes('<div') && !line.includes('</div');
      const hasClose = line.includes('</div');
      if (hasOpen) divCount++;
      if (hasClose) divCount--;
      if (divCount === 0 && j > tempFacStartIdx) {
        tempFacEndIdx = j;
        break;
      }
    }
    break;
  }
}

if (tempFacStartIdx !== -1 && tempFacEndIdx !== -1) {
  console.log(`Found temporaryRoom facilities at lines ${tempFacStartIdx+1} to ${tempFacEndIdx+1}`);
  const facLines = lines.slice(tempFacStartIdx, tempFacEndIdx + 1);
  // Remove them from current position
  lines.splice(tempFacStartIdx, tempFacEndIdx - tempFacStartIdx + 1);
  
  // Find where temporaryRoom pricing section ends to insert
  let pricingEndIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('Jika tarif Tahunan tidak diisi, tarif tahunan') && i < 3600) {
      // Find the closing div of this section
      for (let j = i; j < i + 10; j++) {
        if (lines[j].includes('</div>')) {
          pricingEndIdx = j;
          break;
        }
      }
      break;
    }
  }
  
  if (pricingEndIdx !== -1) {
    console.log(`Inserting temporaryRoom facilities after line ${pricingEndIdx+1}`);
    lines.splice(pricingEndIdx + 1, 0, ...facLines);
  }
}

// 2. Move activeRoomIdx Facilities Block
// Re-join and split to get fresh indexes
let midContent = lines.join('\n');
const lines2 = midContent.split('\n');

let activeFacStartIdx = -1;
let activeFacEndIdx = -1;

for (let i = 0; i < lines2.length; i++) {
  if (lines2[i].includes('Fasilitas Kamar') && lines2[i].includes('span') && lines2[i-1] && lines2[i-1].includes('border-gray-150') && i > 3800) {
    activeFacStartIdx = i - 1; // start of the container div
    // Find matching closing div
    let divCount = 0;
    for (let j = activeFacStartIdx; j < activeFacStartIdx + 100; j++) {
      const line = lines2[j];
      const hasOpen = line.includes('<div') && !line.includes('</div');
      const hasClose = line.includes('</div');
      if (hasOpen) divCount++;
      if (hasClose) divCount--;
      if (divCount === 0 && j > activeFacStartIdx) {
        activeFacEndIdx = j;
        break;
      }
    }
    break;
  }
}

if (activeFacStartIdx !== -1 && activeFacEndIdx !== -1) {
  console.log(`Found activeRoomIdx facilities at lines ${activeFacStartIdx+1} to ${activeFacEndIdx+1}`);
  const facLines = lines2.slice(activeFacStartIdx, activeFacEndIdx + 1);
  // Remove them from current position
  lines2.splice(activeFacStartIdx, activeFacEndIdx - activeFacStartIdx + 1);
  
  // Find where activeRoomIdx pricing section ends to insert
  let pricingEndIdx = -1;
  for (let i = 0; i < lines2.length; i++) {
    if (lines2[i].includes('Jika tarif Tahunan tidak diisi, tarif tahunan') && i > 3800) {
      // Find the closing div of this section
      for (let j = i; j < i + 10; j++) {
        if (lines2[j].includes('</div>')) {
          pricingEndIdx = j;
          break;
        }
      }
      break;
    }
  }
  
  if (pricingEndIdx !== -1) {
    console.log(`Inserting activeRoomIdx facilities after line ${pricingEndIdx+1}`);
    lines2.splice(pricingEndIdx + 1, 0, ...facLines);
  }
}

let finalContent = lines2.join('\n');
// Convert back to CRLF
finalContent = finalContent.replace(/\n/g, '\r\n');

fs.writeFileSync(targetFile, finalContent, 'utf8');
console.log("Done moving facilities outside conditional sections.");
