const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

const lines = content.split('\n');

// 1. Add additionalOccupants: [] to the default room initialization
const initIdx = lines.findIndex(l => l.includes("currentOccupants: 1,"));
if (initIdx !== -1) {
  console.log(`Adding additionalOccupants: [] to default initialization at line ${initIdx + 1}`);
  lines.splice(initIdx + 1, 0, `                                                         additionalOccupants: [],`);
} else {
  console.error("CRITICAL: currentOccupants default initialization not found!");
}

// Re-split lines to keep indexes correct
let tempContent = lines.join('\n');
let tempLines = tempContent.split('\n');

// 2. Add sub-inputs to renderRoomEditor (activeRoomIdx / rt) after the "Jenis Langganan" wrapper div
const rtPaymentPeriodIdx = tempLines.findIndex(l => l.includes("const { amount, unit } = parsePaymentPeriod(rt.paymentPeriod || 'bulanan');"));
if (rtPaymentPeriodIdx !== -1) {
  // Find where the wrapping div ends for "Jenis Langganan"
  let insertPos = rtPaymentPeriodIdx;
  // Let's find the closing of the IIFE: })()}
  while (insertPos < tempLines.length && !tempLines[insertPos].includes('})()}')) {
    insertPos++;
  }
  // Then the next line is the closing </div> of "Jenis Langganan" wrapper div
  insertPos++; // index of </div>
  insertPos++; // line after </div>

  console.log(`Inserting Anggota Penghuni inputs for activeRoomIdx after line ${insertPos + 1}`);
  
  const activeSubInputs = `
                                                                          {/* Additional occupants sub-inputs if currentOccupants > 1 */}
                                                                          {Array.from({ length: Math.max(0, (rt.currentOccupants || 1) - 1) }).map((_, idx) => {
                                                                              const occupant = (rt.additionalOccupants || [])[idx] || { name: '', phone: '' };
                                                                              return (
                                                                                  <div key={idx} className="col-span-2 pl-4 mt-2 border-l-2 border-[#ff7a00] flex flex-col gap-2 bg-[#fffaf5] p-3 rounded-lg w-full">
                                                                                      <span className="text-[10px] font-black text-[#ff7a00] uppercase tracking-wider">Anggota Penghuni {idx + 2}</span>
                                                                                      <div className="grid grid-cols-2 gap-2.5">
                                                                                          <div className="flex flex-col gap-1">
                                                                                              <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Nama Lengkap</label>
                                                                                              <input 
                                                                                                  type="text"
                                                                                                  value={occupant.name || ''}
                                                                                                  onChange={e => {
                                                                                                      const updatedList = [...(rt.additionalOccupants || [])];
                                                                                                      while (updatedList.length <= idx) updatedList.push({ name: '', phone: '' });
                                                                                                      updatedList[idx] = { ...updatedList[idx], name: e.target.value };
                                                                                                      const updated = [...kmListingForm.roomTypes];
                                                                                                      updated[activeRoomIdx] = { ...rt, additionalOccupants: updatedList };
                                                                                                      setKmListingForm({ ...kmListingForm, roomTypes: updated });
                                                                                                  }}
                                                                                                  className="w-full h-[36px] px-2.5 border border-[#e0c0af] rounded-lg text-xs bg-white text-gray-750 outline-none font-bold"
                                                                                                  placeholder="Nama Lengkap"
                                                                                              />
                                                                                          </div>
                                                                                          <div className="flex flex-col gap-1">
                                                                                              <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">No. WhatsApp</label>
                                                                                              <input 
                                                                                                  type="text"
                                                                                                  value={occupant.phone || ''}
                                                                                                  onChange={e => {
                                                                                                      const updatedList = [...(rt.additionalOccupants || [])];
                                                                                                      while (updatedList.length <= idx) updatedList.push({ name: '', phone: '' });
                                                                                                      updatedList[idx] = { ...updatedList[idx], phone: e.target.value };
                                                                                                      const updated = [...kmListingForm.roomTypes];
                                                                                                      updated[activeRoomIdx] = { ...rt, additionalOccupants: updatedList };
                                                                                                      setKmListingForm({ ...kmListingForm, roomTypes: updated });
                                                                                                  }}
                                                                                                  className="w-full h-[36px] px-2.5 border border-[#e0c0af] rounded-lg text-xs bg-white text-gray-750 outline-none"
                                                                                                  placeholder="08xxxxxxxx"
                                                                                              />
                                                                                          </div>
                                                                                      </div>
                                                                                  </div>
                                                                              );
                                                                          })}`;
  
  tempLines.splice(insertPos, 0, activeSubInputs);
} else {
  console.error("CRITICAL: rt.paymentPeriod IIFE block not found!");
}

// Re-split lines to keep indexes correct
tempContent = tempLines.join('\n');
tempLines = tempContent.split('\n');

// 3. Add sub-inputs to temporaryRoom after the "Jenis Langganan" wrapper div
const tempPaymentPeriodIdx = tempLines.findIndex(l => l.includes("const { amount, unit } = parsePaymentPeriod(temporaryRoom.paymentPeriod || 'bulanan');"));
if (tempPaymentPeriodIdx !== -1) {
  // Find where the wrapping div ends for "Jenis Langganan"
  let insertPos = tempPaymentPeriodIdx;
  // Let's find the closing of the IIFE: })()}
  while (insertPos < tempLines.length && !tempLines[insertPos].includes('})()}')) {
    insertPos++;
  }
  // Then the next line is the closing </div> of "Jenis Langganan" wrapper div
  insertPos++; // index of </div>
  insertPos++; // line after </div>

  console.log(`Inserting Anggota Penghuni inputs for temporaryRoom after line ${insertPos + 1}`);
  
  const tempSubInputs = `
                                                                       {/* Additional occupants sub-inputs if currentOccupants > 1 */}
                                                                       {Array.from({ length: Math.max(0, (temporaryRoom.currentOccupants || 1) - 1) }).map((_, idx) => {
                                                                           const occupant = (temporaryRoom.additionalOccupants || [])[idx] || { name: '', phone: '' };
                                                                           return (
                                                                               <div key={idx} className="col-span-2 pl-4 mt-2 border-l-2 border-[#ff7a00] flex flex-col gap-2 bg-[#fffaf5] p-3 rounded-lg w-full">
                                                                                   <span className="text-[10px] font-black text-[#ff7a00] uppercase tracking-wider">Anggota Penghuni {idx + 2}</span>
                                                                                   <div className="grid grid-cols-2 gap-2.5">
                                                                                       <div className="flex flex-col gap-1">
                                                                                           <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Nama Lengkap</label>
                                                                                           <input 
                                                                                               type="text"
                                                                                               value={occupant.name || ''}
                                                                                               onChange={e => {
                                                                                                   const updatedList = [...(temporaryRoom.additionalOccupants || [])];
                                                                                                   while (updatedList.length <= idx) updatedList.push({ name: '', phone: '' });
                                                                                                   updatedList[idx] = { ...updatedList[idx], name: e.target.value };
                                                                                                   setTemporaryRoom({ ...temporaryRoom, additionalOccupants: updatedList });
                                                                                               }}
                                                                                               className="w-full h-[36px] px-2.5 border border-[#e0c0af] rounded-lg text-xs bg-white text-gray-755 outline-none font-bold"
                                                                                               placeholder="Nama Lengkap"
                                                                                           />
                                                                                       </div>
                                                                                       <div className="flex flex-col gap-1">
                                                                                           <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">No. WhatsApp</label>
                                                                                           <input 
                                                                                               type="text"
                                                                                               value={occupant.phone || ''}
                                                                                               onChange={e => {
                                                                                                   const updatedList = [...(temporaryRoom.additionalOccupants || [])];
                                                                                                   while (updatedList.length <= idx) updatedList.push({ name: '', phone: '' });
                                                                                                   updatedList[idx] = { ...updatedList[idx], phone: e.target.value };
                                                                                                   setTemporaryRoom({ ...temporaryRoom, additionalOccupants: updatedList });
                                                                                               }}
                                                                                               className="w-full h-[36px] px-2.5 border border-[#e0c0af] rounded-lg text-xs bg-white text-gray-755 outline-none"
                                                                                               placeholder="08xxxxxxxx"
                                                                                           />
                                                                                       </div>
                                                                                   </div>
                                                                               </div>
                                                                           );
                                                                       })}`;
  
  tempLines.splice(insertPos, 0, tempSubInputs);
} else {
  console.error("CRITICAL: temporaryRoom.paymentPeriod IIFE block not found!");
}

// Convert back to CRLF
let finalContent = tempLines.join('\n');
finalContent = finalContent.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, finalContent, 'utf8');
console.log("Anggota Penghuni sub-inputs successfully integrated.");
