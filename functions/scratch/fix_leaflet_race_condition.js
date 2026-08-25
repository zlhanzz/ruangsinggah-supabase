const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

// 1. Fix kmLandmarkMapInstance invalidateSize
const landmarkTimeoutTarget = `            setTimeout(() => {
                map.invalidateSize();
            }, 250);`;

const landmarkTimeoutReplacement = `            setTimeout(() => {
                if (kmLandmarkMapInstance.current === map) {
                    map.invalidateSize();
                }
            }, 250);`;

if (content.includes(landmarkTimeoutTarget)) {
  content = content.replace(landmarkTimeoutTarget, landmarkTimeoutReplacement);
  console.log("Landmark map invalidateSize timeout safe check added.");
} else {
  console.error("CRITICAL: Landmark map timeout target not found!");
}

// 2. Fix kmMapInstance invalidateSize
const mapTimeoutTarget = `            setTimeout(() => {
                map.invalidateSize();
            }, 250);`;

const mapTimeoutReplacement = `            setTimeout(() => {
                if (kmMapInstance.current === map) {
                    map.invalidateSize();
                }
            }, 250);`;

if (content.includes(mapTimeoutTarget)) {
  content = content.replace(mapTimeoutTarget, mapTimeoutReplacement);
  console.log("Main map invalidateSize timeout safe check added.");
} else {
  console.error("CRITICAL: Main map timeout target not found!");
}

// Convert back to CRLF
content = content.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, content, 'utf8');
