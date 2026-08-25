const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');
const lines = content.split('\n');

// 1. Fix temporaryRoom bridge
let tempButtonIdx = lines.findIndex(l => l.includes('placeholder="Kategori Foto Kamar Baru'));
let tempTerisiIdx = lines.findIndex(l => l.includes("temporaryRoom.status === 'Terisi' && ("));

console.log("tempButtonIdx:", tempButtonIdx, "tempTerisiIdx:", tempTerisiIdx);

if (tempButtonIdx !== -1 && tempTerisiIdx !== -1) {
  let firstClose = lines.findIndex((l, idx) => idx > tempButtonIdx && l.trim() === '</div>');
  let secondClose = lines.findIndex((l, idx) => idx > firstClose && l.trim() === '</div>');
  
  console.log("firstClose:", firstClose, "secondClose:", secondClose);
  if (secondClose !== -1 && secondClose < tempTerisiIdx) {
    console.log(`Clearing temporaryRoom bridge lines between ${secondClose + 2} and ${tempTerisiIdx + 1}`);
    lines.splice(secondClose + 1, tempTerisiIdx - secondClose - 1);
  }
}

// Re-split to handle updated lines
let content2 = lines.join('\n');
const lines2 = content2.split('\n');

// 2. Fix activeRoomIdx bridge
let activeButtonIdx = lines2.findIndex((l, idx) => l.includes('placeholder="Kategori Foto Kamar Baru') && idx > 4200);
let activeTerisiIdx = lines2.findIndex(l => l.includes("rt.status === 'Terisi' && ("));

console.log("activeButtonIdx:", activeButtonIdx, "activeTerisiIdx:", activeTerisiIdx);

if (activeButtonIdx !== -1 && activeTerisiIdx !== -1) {
  let firstClose = lines2.findIndex((l, idx) => idx > activeButtonIdx && l.trim() === '</div>');
  let secondClose = lines2.findIndex((l, idx) => idx > firstClose && l.trim() === '</div>');
  
  console.log("firstClose:", firstClose, "secondClose:", secondClose);
  if (secondClose !== -1 && secondClose < activeTerisiIdx) {
    console.log(`Clearing activeRoomIdx bridge lines between ${secondClose + 2} and ${activeTerisiIdx + 1}`);
    lines2.splice(secondClose + 1, activeTerisiIdx - secondClose - 1);
  }
}

// 3. Fix closing brackets of resident info section
let content3 = lines2.join('\n');
const lines3 = content3.split('\n');

let tempSaveBtnIdx = lines3.findIndex(l => l.includes('Save Button for New Room'));
if (tempSaveBtnIdx !== -1) {
  let lastDivIdx = -1;
  for (let k = tempSaveBtnIdx - 1; k >= tempSaveBtnIdx - 20; k--) {
    if (lines3[k].trim() === '</div>') {
      lastDivIdx = k;
      break;
    }
  }
  
  if (lastDivIdx !== -1) {
    console.log(`Fixing temporaryRoom closing brackets after line ${lastDivIdx + 1}`);
    lines3.splice(lastDivIdx + 1, tempSaveBtnIdx - lastDivIdx - 1,
      `                                                              </>`,
      `                                                          )}`,
      `                                                          `
    );
  }
}

// For activeRoomIdx editor
let content4 = lines3.join('\n');
const lines4 = content4.split('\n');

let activeSaveBtnIdx = lines4.findIndex(l => l.includes('Selesai & Tutup Editor') || l.includes('Simpan Perubahan Button'));
if (activeSaveBtnIdx !== -1) {
  let lastDivIdx = -1;
  for (let k = activeSaveBtnIdx - 1; k >= activeSaveBtnIdx - 25; k--) {
    if (lines4[k].trim() === '</div>') {
      lastDivIdx = k;
      break;
    }
  }
  
  if (lastDivIdx !== -1) {
    console.log(`Fixing activeRoomIdx closing brackets after line ${lastDivIdx + 1}`);
    lines4.splice(lastDivIdx + 1, activeSaveBtnIdx - lastDivIdx - 1,
      `                                                              </>`,
      `                                                          )}`,
      `                                                          `
    );
  }
}

let finalContent = lines4.join('\n');
// Convert back to CRLF
finalContent = finalContent.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, finalContent, 'utf8');

console.log("Layout rebuild finished cleanly.");
