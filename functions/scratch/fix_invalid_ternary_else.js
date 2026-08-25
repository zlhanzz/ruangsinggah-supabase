const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

// 1. Fix temporaryRoom ternary else
const targetTemp = `                                                          </>
                                                      ) : (
                                                          /* TERISI: PENDATAAN PENGHUNI */
                                                          <>`;

const replacementTemp = `                                                          </>
                                                      )}
                                                      {temporaryRoom.status === 'Terisi' && (
                                                          <>`;

if (content.includes(targetTemp)) {
  content = content.replace(targetTemp, replacementTemp);
  console.log("Successfully replaced temporaryRoom ternary else with conditional render.");
} else {
  console.log("WARNING: targetTemp not found!");
}

// 2. Fix activeRoomIdx ternary else
const targetActive = `                                                          </>
                                                      ) : (
                                                          /* TERISI: PENDATAAN PENGHUNI */
                                                          <>`;

const replacementActive = `                                                          </>
                                                      )}
                                                      {rt.status === 'Terisi' && (
                                                          <>`;

// Note: Because targetTemp and targetActive are identical strings, we need to be careful.
// Let's replace the first occurrence as temporaryRoom and the second as activeRoomIdx.
// To do this reliably, let's use split/join or find index.
const lines = content.split('\n');
let tempIdx = lines.findIndex((l, idx) => l.includes(') : (') && lines[idx + 1] && lines[idx + 1].includes('TERISI: PENDATAAN PENGHUNI') && idx < 4200);
let activeIdx = lines.findIndex((l, idx) => l.includes(') : (') && lines[idx + 1] && lines[idx + 1].includes('TERISI: PENDATAAN PENGHUNI') && idx >= 4200);

if (tempIdx !== -1) {
  console.log(`Found temporaryRoom ternary else at line ${tempIdx + 1}`);
  lines.splice(tempIdx, 4, 
    `                                                          </>`,
    `                                                      )}`,
    `                                                      {temporaryRoom.status === 'Terisi' && (`,
    `                                                          <>`
  );
}

// Re-split to get updated line indexes
const midContent = lines.join('\n');
const lines2 = midContent.split('\n');

let activeIdxUpdated = lines2.findIndex((l, idx) => l.includes(') : (') && lines2[idx + 1] && lines2[idx + 1].includes('TERISI: PENDATAAN PENGHUNI') && idx >= 4200);
if (activeIdxUpdated !== -1) {
  console.log(`Found activeRoomIdx ternary else at line ${activeIdxUpdated + 1}`);
  lines2.splice(activeIdxUpdated, 4, 
    `                                                          </>`,
    `                                                      )}`,
    `                                                      {rt.status === 'Terisi' && (`,
    `                                                          <>`
  );
}

let finalContent = lines2.join('\n');
// Convert back to CRLF
finalContent = finalContent.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, finalContent, 'utf8');

console.log("Ternary else branches successfully fixed.");
