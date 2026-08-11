const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

// 1. Update existingProp route initialization
const oldInitBlock = `                    image_urls: existingProp.image_urls || [],
                    campuses: existingProp.campuses || []
                });`;

const newInitBlock = `                    image_urls: existingProp.image_urls || [],
                    campuses: existingProp.campuses || [],
                    publicBathroomFacilities: existingProp.metadata?.publicBathroomFacilities || []
                });`;

if (content.includes(oldInitBlock)) {
  content = content.replace(oldInitBlock, newInitBlock);
  console.log("existingProp route initialization updated.");
}

// 2. Update fallback route initialization
const oldFallbackBlock = `            image_urls: [],
            campuses: []
        });`;

const newFallbackBlock = `            image_urls: [],
            campuses: [],
            publicBathroomFacilities: []
        });`;

if (content.includes(oldFallbackBlock)) {
  content = content.replace(oldFallbackBlock, newFallbackBlock);
  console.log("fallback route initialization updated.");
}

// Convert back to CRLF
content = content.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, content, 'utf8');

console.log("Done.");
