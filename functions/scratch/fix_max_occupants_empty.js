const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

const lines = content.split('\n');

// 1. Find and replace in temporaryRoom block
const tempInputIdx = lines.findIndex((l) => l.includes('value={temporaryRoom?.maxOccupants || 1}'));
if (tempInputIdx !== -1) {
  console.log(`Found temporaryRoom maxOccupants input at line ${tempInputIdx + 1}`);
  lines[tempInputIdx] = lines[tempInputIdx].replace('value={temporaryRoom?.maxOccupants || 1}', "value={temporaryRoom?.maxOccupants ?? ''}");
  lines[tempInputIdx + 1] = lines[tempInputIdx + 1].replace(
    'onChange={e => setTemporaryRoom({ ...temporaryRoom, maxOccupants: parseInt(e.target.value) || 1 })}',
    "onChange={e => setTemporaryRoom({ ...temporaryRoom, maxOccupants: e.target.value === '' ? '' : (parseInt(e.target.value) || 1) })}"
  );
} else {
  console.error("CRITICAL: temporaryRoom maxOccupants input not found by line index!");
}

// 2. Find and replace in activeRoomIdx block
const activeInputIdx = lines.findIndex((l) => l.includes('value={rt?.maxOccupants || 1}'));
if (activeInputIdx !== -1) {
  console.log(`Found activeRoomIdx maxOccupants input at line ${activeInputIdx + 1}`);
  lines[activeInputIdx] = lines[activeInputIdx].replace('value={rt?.maxOccupants || 1}', "value={rt?.maxOccupants ?? ''}");
  
  // Find the onChange block and replace it
  let onChangeStart = activeInputIdx + 1;
  let onChangeEnd = -1;
  for (let i = onChangeStart; i < onChangeStart + 10; i++) {
    if (lines[i].includes('}}')) {
      onChangeEnd = i;
      break;
    }
  }
  
  if (onChangeEnd !== -1) {
    console.log(`Found activeRoomIdx maxOccupants onChange from line ${onChangeStart + 1} to ${onChangeEnd + 1}`);
    // Replace the inner onChange logic cleanly
    let foundHandler = false;
    for (let i = onChangeStart; i <= onChangeEnd; i++) {
      if (lines[i].includes('maxOccupants: parseInt(e.target.value) || 1')) {
        lines[i] = lines[i].replace(
          'maxOccupants: parseInt(e.target.value) || 1',
          "maxOccupants: e.target.value === '' ? '' : (parseInt(e.target.value) || 1)"
        );
        foundHandler = true;
        break;
      }
    }
    if (!foundHandler) {
      console.error("CRITICAL: activeRoomIdx maxOccupants handler statement not found!");
    }
  } else {
    console.error("CRITICAL: activeRoomIdx maxOccupants onChange closing bracket not found!");
  }
} else {
  console.error("CRITICAL: activeRoomIdx maxOccupants input not found by line index!");
}

// Convert back to CRLF
let finalContent = lines.join('\n');
finalContent = finalContent.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, finalContent, 'utf8');
console.log("maxOccupants inputs successfully fixed via line index parsing.");
