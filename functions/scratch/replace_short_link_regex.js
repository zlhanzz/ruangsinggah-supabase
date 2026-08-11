const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

const targetStr = `            // Search for coordinates in the HTML page content
            const centerRegex = /center=(-?\\d+\\.\\d+)%2C(-?\\d+\\.\\d+)/;
            let match = html.match(centerRegex);
            
            if (!match) {
                const llRegex = /ll=(-?\\d+\\.\\d+),(-?\\d+\\.\\d+)/;
                match = html.match(llRegex);
            }
            
            if (!match) {
                const mapUrlRegex = /@(-?\\d+\\.\\d+),(-?\\d+\\.\\d+)/;
                match = html.match(mapUrlRegex);
            }
            
            if (!match) {
                const qRegex = /[?&]q=(-?\\d+\\.\\d+),(-?\\d+\\.\\d+)/;
                match = html.match(qRegex);
            }`;

const replacementStr = `            // Search for coordinates in the HTML page content
            const centerRegex = /center(?:=|\\\\u003d)(-?\\d+\\.\\d+)(?:%2C|,)(-?\\d+\\.\\d+)/i;
            let match = html.match(centerRegex);
            
            if (!match) {
                const mapUrlRegex = /(?:@|%40)(-?\\d+\\.\\d+),(?:%2C|,)?(-?\\d+\\.\\d+)/i;
                match = html.match(mapUrlRegex);
            }
            
            if (!match) {
                const llRegex = /ll(?:=|\\\\u003d)(-?\\d+\\.\\d+)(?:%2C|,)(-?\\d+\\.\\d+)/i;
                match = html.match(llRegex);
            }
            
            if (!match) {
                const qRegex = /[?&]q(?:=|\\\\u003d)(-?\\d+\\.\\d+)(?:%2C|,)(-?\\d+\\.\\d+)/i;
                match = html.match(qRegex);
            }`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  console.log("Successfully replaced exact!");
} else {
  // Try normalized replacement
  const cleanTarget = targetStr.replace(/\s+/g, ' ');
  const cleanContent = content.replace(/\s+/g, ' ');
  if (cleanContent.includes(cleanTarget)) {
    const escaped = targetStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
    content = content.replace(new RegExp(escaped), replacementStr);
    console.log("Successfully replaced using regex!");
  } else {
    console.error("Could not find the target helper block in the file!");
  }
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log("Done.");
