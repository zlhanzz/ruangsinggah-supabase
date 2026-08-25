const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

const lines = content.split('\n');

const searchIdx = lines.findIndex(l => l.includes("onClick={() => setLandmarkInputMethod('search')}"));
const searchEndIdx = lines.findIndex(l => l.includes("Konversi Link GMaps"));

if (searchIdx !== -1 && searchEndIdx !== -1) {
  // Let's replace the entire buttons layout
  const startLine = searchIdx - 2; // start of the button container item
  const endLine = searchEndIdx + 2; // end of the second button
  
  console.log(`Replacing landmark toggle buttons from line ${startLine + 1} to ${endLine + 1}`);
  
  const replacement = `                                                                  <button
                                                                      type="button"
                                                                      onClick={() => setLandmarkInputMethod('search')}
                                                                      className={\`flex-1 py-2 text-[10px] font-extrabold uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-1 \\\${landmarkInputMethod === 'search' ? 'bg-[#ff7a00] text-white shadow-md' : 'text-[#584235] hover:text-orange-600 hover:bg-gray-200/50'}\`}
                                                                  >
                                                                      <span className="material-symbols-outlined text-[12px]">search</span>
                                                                      Cari Nama Lokasi
                                                                  </button>
                                                                  <button
                                                                      type="button"
                                                                      onClick={() => setLandmarkInputMethod('gmaps')}
                                                                      className={\`flex-1 py-2 text-[10px] font-extrabold uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-1 \\\${landmarkInputMethod === 'gmaps' ? 'bg-[#ff7a00] text-white shadow-md' : 'text-[#584235] hover:text-orange-600 hover:bg-gray-200/50'}\`}
                                                                  >
                                                                      <span className="material-symbols-outlined text-[12px]">link</span>
                                                                      Konversi Link GMaps
                                                                  </button>`;
                                                                  
  lines.splice(startLine, (endLine - startLine) + 1, replacement);
  
  content = lines.join('\n');
  
  // Also clean up any escaped strings that Vite might have written
  content = content.replace(/\\\\\${landmarkInputMethod/g, '${landmarkInputMethod');
  content = content.replace(/\\\${landmarkInputMethod/g, '${landmarkInputMethod');
  
  console.log("Landmark choice styles fixed and enhanced successfully.");
} else {
  console.error("CRITICAL: landmarkInputMethod search line not found!");
}

// Convert back to CRLF
content = content.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, content, 'utf8');
