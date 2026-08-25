const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

// Clean up $\{ or \{ to ${ or {
content = content.replace(/\\\{isTerisi/g, '${isTerisi');

console.log("Cleaned up remaining bracket escapes in AgentDashboard.tsx.");

// Convert back to CRLF
content = content.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, content, 'utf8');
