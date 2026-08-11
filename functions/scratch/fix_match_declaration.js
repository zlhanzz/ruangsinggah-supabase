const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

const targetStr = `        // Format raw: -5.1326, 119.4886
        const regexRaw = /^(-?\\d+\\.\\d+)\\s*,\\s*(-?\\d+\\.\\d+)$/;

        let match = url.match(regex1);`;

const replacementStr = `        // Format raw: -5.1326, 119.4886
        const regexRaw = /^(-?\\d+\\.\\d+)\\s*,\\s*(-?\\d+\\.\\d+)$/;

        match = url.match(regex1);`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  console.log("Successfully replaced!");
} else {
  // Whitespace-insensitive fallback
  const cleanTarget = targetStr.replace(/\s+/g, ' ');
  const cleanContent = content.replace(/\s+/g, ' ');
  if (cleanContent.includes(cleanTarget)) {
    const escaped = targetStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
    content = content.replace(new RegExp(escaped), replacementStr);
    console.log("Successfully replaced via regex!");
  } else {
    console.error("Target block not found!");
  }
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log("Done.");
