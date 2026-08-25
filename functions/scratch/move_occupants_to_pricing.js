const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

const lines = content.split('\n');

// 1. Find temporaryRoom Skema Tarif header and insert inputs
let tempPricingIdx = lines.findIndex(l => l.includes('Skema Tarif / Harga Kamar') && l.includes('text-[#584235]') && l.includes('span'));
if (tempPricingIdx !== -1) {
  // Find the closing </div> of this card header row, which is usually a few lines below
  let headerRowEnd = -1;
  for (let k = tempPricingIdx + 1; k < tempPricingIdx + 20; k++) {
    if (lines[k].trim() === '</div>') {
      headerRowEnd = k;
      break;
    }
  }

  if (headerRowEnd !== -1) {
    console.log("Injecting maxOccupants & additionalCost inputs in temporaryRoom pricing section at line:", headerRowEnd + 2);
    const tempOccupantsBlock = `                                                          {/* Occupants & Additional Cost fields */}
                                                          <div className="grid grid-cols-2 gap-3 border-b border-gray-100 pb-3 mb-1">
                                                              <div className="flex flex-col gap-1">
                                                                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Maksimal Penghuni</label>
                                                                  <input 
                                                                      type="number"
                                                                      min="1"
                                                                      value={temporaryRoom.maxOccupants || 1}
                                                                      onChange={e => setTemporaryRoom({ ...temporaryRoom, maxOccupants: parseInt(e.target.value) || 1 })}
                                                                      className="w-full h-[36px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white font-bold outline-none text-[#584235]"
                                                                  />
                                                              </div>
                                                              <div className="flex flex-col gap-1">
                                                                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Biaya Tambahan / Orang (Rp/Bulan)</label>
                                                                  <input 
                                                                      type="text"
                                                                      value={formatThousand(temporaryRoom.additionalCostPerPerson || 0)}
                                                                      onChange={e => setTemporaryRoom({ ...temporaryRoom, additionalCostPerPerson: parseThousand(e.target.value) || 0 })}
                                                                      className="w-full h-[36px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white font-bold outline-none text-[#584235]"
                                                                      placeholder="contoh: 200.000"
                                                                  />
                                                              </div>
                                                          </div>`;
    lines.splice(headerRowEnd + 1, 0, tempOccupantsBlock);
  }
}

// Re-join and split to handle activeRoomIdx
let intermediateContent = lines.join('\n');
const intermediateLines = intermediateContent.split('\n');

// 2. Find activeRoomIdx Skema Tarif header and insert inputs
let activePricingIdx = intermediateLines.findIndex((l, idx) => idx > tempPricingIdx + 300 && l.includes('Skema Tarif / Harga Kamar') && l.includes('text-[#584235]') && l.includes('span'));
if (activePricingIdx !== -1) {
  let headerRowEnd = -1;
  for (let k = activePricingIdx + 1; k < activePricingIdx + 20; k++) {
    if (intermediateLines[k].trim() === '</div>') {
      headerRowEnd = k;
      break;
    }
  }

  if (headerRowEnd !== -1) {
    console.log("Injecting maxOccupants & additionalCost inputs in activeRoomIdx pricing section at line:", headerRowEnd + 2);
    const activeOccupantsBlock = `                                                          {/* Occupants & Additional Cost fields */}
                                                          <div className="grid grid-cols-2 gap-3 border-b border-gray-100 pb-3 mb-1">
                                                              <div className="flex flex-col gap-1">
                                                                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Maksimal Penghuni</label>
                                                                  <input 
                                                                      type="number"
                                                                      min="1"
                                                                      value={rt.maxOccupants || 1}
                                                                      onChange={e => {
                                                                          const updated = [...kmListingForm.roomTypes];
                                                                          updated[activeRoomIdx] = { ...rt, maxOccupants: parseInt(e.target.value) || 1 };
                                                                          setKmListingForm({ ...kmListingForm, roomTypes: updated });
                                                                      }}
                                                                      className="w-full h-[36px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white font-bold outline-none text-[#584235]"
                                                                  />
                                                              </div>
                                                              <div className="flex flex-col gap-1">
                                                                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Biaya Tambahan / Orang (Rp/Bulan)</label>
                                                                  <input 
                                                                      type="text"
                                                                      value={formatThousand(rt.additionalCostPerPerson || 0)}
                                                                      onChange={e => {
                                                                          const updated = [...kmListingForm.roomTypes];
                                                                          updated[activeRoomIdx] = { ...rt, additionalCostPerPerson: parseThousand(e.target.value) || 0 };
                                                                          setKmListingForm({ ...kmListingForm, roomTypes: updated });
                                                                      }}
                                                                      className="w-full h-[36px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white font-bold outline-none text-[#584235]"
                                                                      placeholder="contoh: 200.000"
                                                                  />
                                                              </div>
                                                          </div>`;
    intermediateLines.splice(headerRowEnd + 1, 0, activeOccupantsBlock);
  }
}

let finalContent = intermediateLines.join('\n');
// Convert back to CRLF
finalContent = finalContent.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, finalContent, 'utf8');

console.log("Occupants inputs successfully repositioned to pricing section.");
