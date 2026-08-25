const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');
const lines = content.split('\n');

// Find conditional block start for temporaryRoom
let insertIdx = -1;
for (let i = 2500; i < 3600; i++) {
  if (lines[i] && lines[i].includes('temporaryRoom.name?.trim()') && lines[i].includes('temporaryRoom.status') && lines[i].includes('&& (')) {
    // Found the start of the conditional block
    // Let's insert the copy helper right after the next line containing '<>'
    for (let j = i; j < i + 5; j++) {
      if (lines[j].includes('<>')) {
        insertIdx = j + 1;
        break;
      }
    }
    break;
  }
}

if (insertIdx !== -1) {
  console.log("Inserting Copy Room configuration helper at line", insertIdx + 1);
  const copyHelper = `                                                     {/* Copy configuration dropdown if other rooms exist */}
                                                     {kmListingForm.roomTypes && kmListingForm.roomTypes.length > 0 && (
                                                         <div className="border border-[#d3e4fe] bg-[#eff4ff]/30 rounded-xl p-4 flex flex-col gap-2">
                                                             <label className="text-[11px] font-black text-[#264191] uppercase tracking-wider">Salin Tarif & Fasilitas Dari Kamar Lain</label>
                                                             <select 
                                                                 value=""
                                                                 onChange={e => {
                                                                     const selectedIdx = parseInt(e.target.value);
                                                                     const sourceRoom = kmListingForm.roomTypes[selectedIdx];
                                                                     if (sourceRoom) {
                                                                         setTemporaryRoom({
                                                                             ...temporaryRoom,
                                                                             price: sourceRoom.price || '',
                                                                             pricing: sourceRoom.pricing ? JSON.parse(JSON.stringify(sourceRoom.pricing)) : [{ period: 'bulanan', price: '' }],
                                                                             roomFacilities: sourceRoom.roomFacilities ? [...sourceRoom.roomFacilities] : [],
                                                                             bathroomFacilities: sourceRoom.bathroomFacilities ? [...sourceRoom.bathroomFacilities] : [],
                                                                             maxOccupants: sourceRoom.maxOccupants ?? '',
                                                                             extraOccupantFee: sourceRoom.extraOccupantFee ?? ''
                                                                         });
                                                                         alert(\`Tarif & Fasilitas berhasil disalin dari Kamar \${sourceRoom.name}!\`);
                                                                     }
                                                                 }}
                                                                 className="w-full h-[40px] px-3 border border-[#b4cdfe] rounded-lg text-xs bg-white font-bold outline-none text-[#264191]"
                                                             >
                                                                 <option value="" disabled>-- Pilih Kamar Sumber --</option>
                                                                 {kmListingForm.roomTypes.map((r: any, rIdx: number) => (
                                                                     <option key={rIdx} value={rIdx}>
                                                                         Kamar {r.name} ({r.type || 'Standard'} - {r.floor || 'Lantai 1'})
                                                                     </option>
                                                                 ))}
                                                             </select>
                                                         </div>
                                                     )}`;
  lines.splice(insertIdx, 0, copyHelper);
} else {
  console.log("CRITICAL: insertIdx NOT found!");
}

let finalContent = lines.join('\n');
// Convert back to CRLF
finalContent = finalContent.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, finalContent, 'utf8');

console.log("Done adding copy room configuration feature.");
