const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

const lines = content.split('\n');

const searchIdx = lines.findIndex(l => l.includes("onClick={() => setLandmarkInputMethod('gmaps')}"));
if (searchIdx !== -1) {
  let closeBtnIdx = searchIdx;
  while (closeBtnIdx < lines.length && !lines[closeBtnIdx].includes("</button>")) {
    closeBtnIdx++;
  }
  
  // Unconditionally insert </div>
  lines.splice(closeBtnIdx + 1, 0, "                                                              </div>");
  console.log(`Unconditionally inserted tabs closing div after line ${closeBtnIdx + 1}`);
} else {
  console.error("CRITICAL: gmaps button not found!");
}

content = lines.join('\n');

// Convert back to CRLF
content = content.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, content, 'utf8');
