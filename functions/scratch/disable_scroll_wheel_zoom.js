const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

// 1. Disable scrollWheelZoom on Landmark Map
const landmarkMapTarget = `            const map = L.map(kmLandmarkMapRef.current, {
                zoomControl: false,
                attributionControl: false
            }).setView([initialLat, initialLng], 15);`;

const landmarkMapReplacement = `            const map = L.map(kmLandmarkMapRef.current, {
                zoomControl: false,
                attributionControl: false,
                scrollWheelZoom: false
            }).setView([initialLat, initialLng], 15);`;

if (content.includes(landmarkMapTarget)) {
  content = content.replace(landmarkMapTarget, landmarkMapReplacement);
  console.log("Landmark map scrollWheelZoom successfully disabled.");
} else {
  console.error("Landmark map target not found!");
}

// 2. Disable scrollWheelZoom on Main Map
const mainMapTarget = `            const map = L.map(kmMapRef.current, {
                zoomControl: false,
                attributionControl: false
            }).setView([initialLat, initialLng], 15);`;

const mainMapReplacement = `            const map = L.map(kmMapRef.current, {
                zoomControl: false,
                attributionControl: false,
                scrollWheelZoom: false
            }).setView([initialLat, initialLng], 15);`;

if (content.includes(mainMapTarget)) {
  content = content.replace(mainMapTarget, mainMapReplacement);
  console.log("Main map scrollWheelZoom successfully disabled.");
} else {
  console.error("Main map target not found!");
}

// Convert back to CRLF
content = content.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, content, 'utf8');
console.log("disable_scroll_wheel_zoom logic completed.");
