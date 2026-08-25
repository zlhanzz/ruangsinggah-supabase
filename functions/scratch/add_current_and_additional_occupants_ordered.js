const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

const lines = content.split('\n');

// 1. Add currentOccupants: 1 and additionalOccupants: [] to default room initialization
const initIdx = lines.findIndex(l => l.includes("paymentPeriod: 'bulanan',"));
if (initIdx !== -1) {
  console.log(`Adding occupants defaults to initialization at line ${initIdx + 1}`);
  lines.splice(initIdx + 1, 0, 
    `                                                         currentOccupants: 1,`,
    `                                                         additionalOccupants: [],`
  );
} else {
  console.error("CRITICAL: paymentPeriod default initialization not found!");
}

let tempContent = lines.join('\n');
let tempLines = tempContent.split('\n');

// 2. Add currentOccupants and additionalOccupants to renderRoomEditor (activeRoomIdx / rt)
const rtEndIdx = tempLines.findIndex(l => l.includes("value={rt.endDate || ''}"));
if (rtEndIdx !== -1) {
  // Find the end of the wrapping <div className="grid grid-cols-2 gap-2"> for dates
  let insertPos = rtEndIdx;
  let closeCount = 0;
  while (insertPos < tempLines.length && closeCount < 2) {
    if (tempLines[insertPos].includes('</div>')) {
      closeCount++;
    }
    insertPos++;
  }

  console.log(`Inserting occupants fields for activeRoomIdx after line ${insertPos}`);
  
  const activeBlock = `
                                                                           <div className="flex flex-col gap-1">
                                                                               <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Jumlah Penghuni Saat Ini</label>
                                                                               <div className="flex items-center gap-2">
                                                                                   <input 
                                                                                       type="number"
                                                                                       min="1"
                                                                                       value={rt.currentOccupants ?? 1}
                                                                                       onChange={e => {
                                                                                           const val = e.target.value === '' ? '' : (parseInt(e.target.value) || 1);
                                                                                           const updated = [...kmListingForm.roomTypes];
                                                                                           updated[activeRoomIdx] = { ...rt, currentOccupants: val };
                                                                                           setKmListingForm({ ...kmListingForm, roomTypes: updated });
                                                                                       }}
                                                                                       className="w-full h-[40px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white text-gray-700 outline-none font-bold"
                                                                                       placeholder="Jumlah penghuni saat ini"
                                                                                   />
                                                                                   <span className="text-xs font-bold text-gray-500 uppercase">Orang</span>
                                                                               </div>
                                                                           </div>

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
  
  tempLines.splice(insertPos, 0, activeBlock);
} else {
  console.error("CRITICAL: rt.endDate input not found!");
}

// Re-split lines to keep indexes correct
tempContent = tempLines.join('\n');
tempLines = tempContent.split('\n');

// 3. Add currentOccupants and additionalOccupants to temporaryRoom
const tempEndIdx = tempLines.findIndex(l => l.includes("value={temporaryRoom.endDate || ''}"));
if (tempEndIdx !== -1) {
  // Find the end of the wrapping <div className="grid grid-cols-2 gap-2"> for dates
  let insertPos = tempEndIdx;
  let closeCount = 0;
  while (insertPos < tempLines.length && closeCount < 2) {
    if (tempLines[insertPos].includes('</div>')) {
      closeCount++;
    }
    insertPos++;
  }

  console.log(`Inserting occupants fields for temporaryRoom after line ${insertPos}`);
  
  const tempBlock = `
                                                                       <div className="flex flex-col gap-1">
                                                                           <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Jumlah Penghuni Saat Ini</label>
                                                                           <div className="flex items-center gap-2">
                                                                               <input 
                                                                                   type="number"
                                                                                   min="1"
                                                                                   value={temporaryRoom.currentOccupants ?? 1}
                                                                                   onChange={e => {
                                                                                       const val = e.target.value === '' ? '' : (parseInt(e.target.value) || 1);
                                                                                       setTemporaryRoom({ ...temporaryRoom, currentOccupants: val });
                                                                                   }}
                                                                                   className="w-full h-[40px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white text-gray-700 outline-none font-bold"
                                                                                   placeholder="Jumlah penghuni saat ini"
                                                                               />
                                                                               <span className="text-xs font-bold text-gray-500 uppercase">Orang</span>
                                                                           </div>
                                                                       </div>

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
  
  tempLines.splice(insertPos, 0, tempBlock);
} else {
  console.error("CRITICAL: temporaryRoom.endDate input not found!");
}

// Convert back to CRLF
let finalContent = tempLines.join('\n');
finalContent = finalContent.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, finalContent, 'utf8');
console.log("Current and additional occupants inputs successfully integrated with custom order.");
