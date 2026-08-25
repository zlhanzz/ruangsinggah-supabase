const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

// Replace the recursive definition
content = content.replace(
  `    const closeKostManagerListing = () => {
        closeKostManagerListing();
        setSearchParams({ status: agentTab });
    };`,
  `    const closeKostManagerListing = () => {
        setIsEditingKostManager(null);
        setSearchParams({ status: agentTab });
    };`
);

// Convert back to CRLF
content = content.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, content, 'utf8');

console.log("Recursive closeKostManagerListing calls successfully replaced.");
