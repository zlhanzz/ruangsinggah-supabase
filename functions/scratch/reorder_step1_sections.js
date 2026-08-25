const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

const lines = content.split('\n');

// 1. Locate the Landmark container
let landmarkHeadingIdx = lines.findIndex(l => l.includes('Fasilitas & Landmark Terdekat'));
if (landmarkHeadingIdx !== -1) {
  let containerStart = lines.lastIndexOf('                                            <div className="border border-[#e0c0af] rounded-xl p-4 flex flex-col gap-3 bg-[#f8f9ff]">', landmarkHeadingIdx);
  if (containerStart === -1) {
    containerStart = lines.lastIndexOf('                                            <div className="border border-[#e0c0af] rounded-xl p-4 flex flex-col gap-3 bg-gray-50/30">', landmarkHeadingIdx);
  }
  
  let peraturanIdx = lines.findIndex((l, idx) => idx > landmarkHeadingIdx && l.includes('Peraturan Kost'));
  if (peraturanIdx !== -1) {
    let containerEnd = lines.lastIndexOf('                                            </div>', peraturanIdx);
    if (containerEnd !== -1) {
      console.log(`Found Landmark container from line ${containerStart + 1} to ${containerEnd + 1}`);
      
      const landmarkLines = lines.slice(containerStart, containerEnd + 1);
      
      // Remove it from current position
      lines.splice(containerStart, (containerEnd - containerStart) + 1);
      
      // 2. Find where Lokasi GPS container ends
      let gpsButtonIdx = lines.findIndex(l => l.includes('Kunci Koordinat Presisi Saat Ini'));
      if (gpsButtonIdx !== -1) {
        let gpsClose1 = lines.findIndex((l, idx) => idx > gpsButtonIdx && l.trim() === '</div>');
        let gpsClose2 = lines.findIndex((l, idx) => idx > gpsClose1 && l.trim() === '</div>');
        
        if (gpsClose2 !== -1) {
          console.log(`Inserting Landmark container after Lokasi GPS at line ${gpsClose2 + 2}`);
          lines.splice(gpsClose2 + 1, 0, ...landmarkLines);
        }
      }
    }
  }
}

let finalContent = lines.join('\n');
// Convert back to CRLF
finalContent = finalContent.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, finalContent, 'utf8');

console.log("Done reordering step 1 sections.");
