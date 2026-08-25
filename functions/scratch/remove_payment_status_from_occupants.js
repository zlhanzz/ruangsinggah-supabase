const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

const lines = content.split('\n');

// Helper to find absolute matches for block removal
const findBlockBoundaries = (linesArray, keyword) => {
  const startLabelIdx = linesArray.findIndex(l => l.includes("Status Pembayaran") && l.includes("label"));
  if (startLabelIdx === -1) return null;

  let startIdx = startLabelIdx;
  while (startIdx > 0 && !linesArray[startIdx].includes('{/* Status Pembayaran */}')) {
    startIdx--;
  }

  // Find where the conditional block ends
  let endIdx = startLabelIdx;
  let found = false;
  for (let i = startLabelIdx; i < linesArray.length; i++) {
    if (linesArray[i].includes(`${keyword}.isPaid === false && (`)) {
      // Find the closing )} on its own line
      for (let j = i + 1; j < linesArray.length; j++) {
        if (/^\s*\)\}\s*$/.test(linesArray[j])) {
          endIdx = j;
          found = true;
          break;
        }
      }
    }
    if (found) break;
  }

  if (found) {
    return { startIdx, endIdx };
  }
  return null;
};

// 1. Remove from temporaryRoom
const tempBounds = findBlockBoundaries(lines, 'temporaryRoom');
if (tempBounds) {
  console.log(`Removing temporaryRoom payment status block from line ${tempBounds.startIdx + 1} to ${tempBounds.endIdx + 1}`);
  lines.splice(tempBounds.startIdx, (tempBounds.endIdx - tempBounds.startIdx + 1));
} else {
  console.error("CRITICAL: temporaryRoom payment status block boundaries not found!");
}

// 2. Remove from activeRoomIdx (rt)
const newContent = lines.join('\n');
const newLines = newContent.split('\n');

const activeBounds = findBlockBoundaries(newLines, 'rt');
if (activeBounds) {
  console.log(`Removing activeRoomIdx payment status block from line ${activeBounds.startIdx + 1} to ${activeBounds.endIdx + 1}`);
  newLines.splice(activeBounds.startIdx, (activeBounds.endIdx - activeBounds.startIdx + 1));
} else {
  console.error("CRITICAL: activeRoomIdx payment status block boundaries not found!");
}

// Convert back to CRLF
let finalContent = newLines.join('\n');
finalContent = finalContent.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, finalContent, 'utf8');
console.log("Status Pembayaran fields successfully removed cleanly.");
