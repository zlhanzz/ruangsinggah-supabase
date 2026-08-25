const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

const oldBtn = `                                         <button
                                             type="button"
                                             onClick={() => setIsEditingKostManager(null)}
                                             className="flex-1 h-[48px] border border-[#ff7a00] text-[#ff7a00] rounded-full font-bold text-xs uppercase tracking-wider hover:bg-orange-50 transition-colors"
                                         >
                                             Simpan Draft
                                         </button>`;

const newBtn = `                                         <button
                                             type="button"
                                             onClick={() => setIsEditingKostManager(null)}
                                             className="flex-1 h-[48px] border border-[#ff7a00] text-[#ff7a00] rounded-full font-bold text-xs uppercase tracking-wider hover:bg-orange-50 transition-colors"
                                         >
                                             Keluar
                                         </button>`;

if (content.includes(oldBtn)) {
  content = content.replace(oldBtn, newBtn);
  console.log("Draft button successfully renamed to Keluar.");
} else {
  console.log("CRITICAL: oldBtn NOT found!");
}

// Convert back to CRLF
content = content.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, content, 'utf8');
