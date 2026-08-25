const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

const targetStr = `                return;
            }
            console.error("Failed to fetch existing property details:", err);
        }`;

const replacementStr = `                return;
            }
        } catch (err) {
            console.error("Failed to fetch existing property details:", err);
        }`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  console.log("Successfully fixed try-catch braces in AgentDashboard.tsx");
} else {
  console.log("WARNING: Target string not found in AgentDashboard.tsx!");
}

// Convert back to CRLF
content = content.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, content, 'utf8');
