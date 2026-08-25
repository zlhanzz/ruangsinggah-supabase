const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');
const lines = content.split('\n');

// 1. Find floor select in temporaryRoom
let floorSelectIdx = -1;
for (let i = 3300; i < 3500; i++) {
  if (lines[i] && lines[i].includes('temporaryRoom.floor || \'Lantai 1\'')) {
    floorSelectIdx = i;
    break;
  }
}

if (floorSelectIdx !== -1) {
  console.log("Replacing floor select fallback in temporaryRoom at line", floorSelectIdx + 1);
  lines[floorSelectIdx] = lines[floorSelectIdx].replace("temporaryRoom.floor || 'Lantai 1'", "temporaryRoom.floor || ''");
  
  // Also insert the placeholder option
  let optionIdx = -1;
  for (let j = floorSelectIdx; j < floorSelectIdx + 10; j++) {
    if (lines[j].includes('<option value="Lantai 1">')) {
      optionIdx = j;
      break;
    }
  }
  if (optionIdx !== -1) {
    console.log("Inserting Pilih Lantai placeholder option before Lantai 1 option at line", optionIdx + 1);
    lines.splice(optionIdx, 0, '                                                                      <option value="" disabled hidden>Pilih Lantai</option>');
  }
} else {
  console.log("CRITICAL: floorSelectIdx NOT found!");
}

// 2. Adjust conditional validation block
let validationIdx = -1;
for (let i = 3300; i < 3600; i++) {
  if (lines[i] && lines[i].includes('temporaryRoom.floor || \'Lantai 1\'') && lines[i].includes('temporaryRoom.name?.trim()')) {
    validationIdx = i;
    break;
  }
}

if (validationIdx !== -1) {
  console.log("Replacing validation floor check at line", validationIdx + 1);
  lines[validationIdx] = lines[validationIdx].replace("(temporaryRoom.floor || 'Lantai 1')", "temporaryRoom.floor");
} else {
  console.log("CRITICAL: validationIdx NOT found!");
}

let finalContent = lines.join('\n');
// Convert back to CRLF
finalContent = finalContent.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, finalContent, 'utf8');

console.log("Done neutralizing floor input.");
