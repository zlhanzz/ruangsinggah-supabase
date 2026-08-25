const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

const lines = content.split('\n');

const startIndex = lines.findIndex((line, idx) => 
  line.includes("agentTab === 'active'") && 
  lines[idx + 1] && 
  lines[idx + 1].includes('<>') && 
  lines[idx + 2] && 
  lines[idx + 2].includes('req.status === \'SUBMITTED\'')
);

if (startIndex !== -1) {
  let endIdx = startIndex;
  while (endIdx < lines.length && !lines[endIdx].includes("agentTab === 'history'")) {
    endIdx++;
  }
  
  let closeIndex = endIdx - 1;
  while (closeIndex > startIndex && !lines[closeIndex].includes(')')) {
    closeIndex--;
  }

  console.log(`Fixing active tab closing parenthesis at line ${closeIndex + 1} from ) to )}`);
  lines[closeIndex] = '                                )}';
  console.log("Successfully fixed active tab closing braces.");
} else {
  console.error("CRITICAL ERROR: active tab render block start not found!");
}

const finalContent = lines.join('\n');

// Convert back to CRLF
content = finalContent.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, content, 'utf8');
