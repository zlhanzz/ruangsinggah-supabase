const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

const lines = content.split('\n');

// 1. Add fields to temporaryRoom Detail Kamar section (around line 3495)
let tempGridEndIdx = -1;
// Scan for the closing div of temporaryRoom Detail Kamar grid
let tempDetailIdx = lines.findIndex(l => l.includes('Nomor Kamar') && l.includes('Nomor Kamar') === false || l.includes('temporaryRoom.name'));
if (tempDetailIdx !== -1) {
  // Find the first </div> after temporaryRoom.type conditional block ends
  let kustomInputEnd = lines.findIndex((l, idx) => idx > tempDetailIdx && l.includes('placeholder="Masukkan tipe kamar kustom..."'));
  if (kustomInputEnd !== -1) {
    // Find the next two closing divs
    let closedDivsCount = 0;
    for (let j = kustomInputEnd + 1; j < kustomInputEnd + 100; j++) {
      if (lines[j].trim() === '</div>') {
        closedDivsCount++;
        if (closedDivsCount === 2) {
          tempGridEndIdx = j;
          break;
        }
      }
    }
  }
}

if (tempGridEndIdx !== -1) {
  console.log("Injecting maxOccupants & additionalCost inputs in temporaryRoom at line:", tempGridEndIdx);
  const tempOccupantsBlock = `                                                              <div className="flex flex-col gap-1.5">
                                                                  <label className="text-[11px] font-bold text-[#584235] uppercase tracking-wider">Maksimal Penghuni</label>
                                                                  <input 
                                                                      type="number"
                                                                      min="1"
                                                                      value={temporaryRoom.maxOccupants || 1}
                                                                      onChange={e => setTemporaryRoom({ ...temporaryRoom, maxOccupants: parseInt(e.target.value) || 1 })}
                                                                      className="w-full h-[40px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white font-bold outline-none text-[#584235]"
                                                                  />
                                                              </div>
                                                              <div className="flex flex-col gap-1.5">
                                                                  <label className="text-[11px] font-bold text-[#584235] uppercase tracking-wider">Biaya Tambahan / Orang (Rp/Bulan)</label>
                                                                  <input 
                                                                      type="text"
                                                                      value={formatThousand(temporaryRoom.additionalCostPerPerson || 0)}
                                                                      onChange={e => setTemporaryRoom({ ...temporaryRoom, additionalCostPerPerson: parseThousand(e.target.value) || 0 })}
                                                                      className="w-full h-[40px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white font-bold outline-none text-[#584235]"
                                                                      placeholder="contoh: 200.000"
                                                                  />
                                                              </div>`;
  lines.splice(tempGridEndIdx, 0, tempOccupantsBlock);
}

// Re-join and split to handle activeRoomIdx
let intermediateContent = lines.join('\n');
const intermediateLines = intermediateContent.split('\n');

// 2. Add fields to activeRoomIdx Detail Kamar section
let activeGridEndIdx = -1;
let activeDetailIdx = intermediateLines.findIndex((l, idx) => idx > tempGridEndIdx + 200 && l.includes('rt.name ||'));
if (activeDetailIdx !== -1) {
  let kustomInputEnd = intermediateLines.findIndex((l, idx) => idx > activeDetailIdx && l.includes('placeholder="Masukkan tipe kamar kustom..."'));
  if (kustomInputEnd !== -1) {
    let closedDivsCount = 0;
    for (let j = kustomInputEnd + 1; j < kustomInputEnd + 100; j++) {
      if (intermediateLines[j].trim() === '</div>') {
        closedDivsCount++;
        if (closedDivsCount === 2) {
          activeGridEndIdx = j;
          break;
        }
      }
    }
  }
}

if (activeGridEndIdx !== -1) {
  console.log("Injecting maxOccupants & additionalCost inputs in activeRoomIdx at line:", activeGridEndIdx);
  const activeOccupantsBlock = `                                                                  <div className="flex flex-col gap-1.5">
                                                                      <label className="text-[11px] font-bold text-[#584235] uppercase tracking-wider">Maksimal Penghuni</label>
                                                                      <input 
                                                                          type="number"
                                                                          min="1"
                                                                          value={rt.maxOccupants || 1}
                                                                          onChange={e => {
                                                                              const updated = [...kmListingForm.roomTypes];
                                                                              updated[activeRoomIdx] = { ...rt, maxOccupants: parseInt(e.target.value) || 1 };
                                                                              setKmListingForm({ ...kmListingForm, roomTypes: updated });
                                                                          }}
                                                                          className="w-full h-[40px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white font-bold outline-none text-[#584235]"
                                                                      />
                                                                  </div>
                                                                  <div className="flex flex-col gap-1.5">
                                                                      <label className="text-[11px] font-bold text-[#584235] uppercase tracking-wider">Biaya Tambahan / Orang (Rp/Bulan)</label>
                                                                      <input 
                                                                          type="text"
                                                                          value={formatThousand(rt.additionalCostPerPerson || 0)}
                                                                          onChange={e => {
                                                                              const updated = [...kmListingForm.roomTypes];
                                                                              updated[activeRoomIdx] = { ...rt, additionalCostPerPerson: parseThousand(e.target.value) || 0 };
                                                                              setKmListingForm({ ...kmListingForm, roomTypes: updated });
                                                                          }}
                                                                          className="w-full h-[40px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white font-bold outline-none text-[#584235]"
                                                                          placeholder="contoh: 200.000"
                                                                      />
                                                                  </div>`;
  intermediateLines.splice(activeGridEndIdx, 0, activeOccupantsBlock);
}

let finalContent = intermediateLines.join('\n');
// Convert back to CRLF
finalContent = finalContent.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, finalContent, 'utf8');

console.log("Occupants inputs successfully added.");
