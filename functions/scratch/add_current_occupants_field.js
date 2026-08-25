const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

const lines = content.split('\n');

// 1. Add currentOccupants: 1 to the default room initialization
const initIdx = lines.findIndex(l => l.includes("paymentPeriod: 'bulanan',"));
if (initIdx !== -1) {
  console.log(`Adding currentOccupants: 1 to default initialization at line ${initIdx + 1}`);
  lines.splice(initIdx + 1, 0, `                                                         currentOccupants: 1,`);
} else {
  console.error("CRITICAL: paymentPeriod default initialization not found!");
}

// Re-split lines to keep indexes correct
let tempContent = lines.join('\n');
let tempLines = tempContent.split('\n');

// 2. Add input to renderRoomEditor (activeRoomIdx / rt)
// Let's find: value={rt.residentPhone || ''}
const rtPhoneIdx = tempLines.findIndex(l => l.includes("value={rt.residentPhone || ''}"));
if (rtPhoneIdx !== -1) {
  // Find where the wrapping div ends for HP/Whatsapp input
  let insertPos = rtPhoneIdx;
  while (insertPos < tempLines.length && !tempLines[insertPos].includes('</div>')) {
    insertPos++;
  }
  insertPos++; // insert after </div>

  console.log(`Inserting Jumlah Penghuni input for activeRoomIdx after line ${insertPos + 1}`);
  
  const activeInput = `                                                                          <div className="flex flex-col gap-1">
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
                                                                          </div>`;
  
  tempLines.splice(insertPos, 0, activeInput);
} else {
  console.error("CRITICAL: rt.residentPhone input not found!");
}

// Re-split lines to keep indexes correct
tempContent = tempLines.join('\n');
tempLines = tempContent.split('\n');

// 3. Add input to temporaryRoom
const tempPhoneIdx = tempLines.findIndex(l => l.includes("value={temporaryRoom.residentPhone || ''}"));
if (tempPhoneIdx !== -1) {
  // Find where the wrapping div ends for HP/WhatsApp input
  let insertPos = tempPhoneIdx;
  while (insertPos < tempLines.length && !tempLines[insertPos].includes('</div>')) {
    insertPos++;
  }
  insertPos++; // insert after </div>

  console.log(`Inserting Jumlah Penghuni input for temporaryRoom after line ${insertPos + 1}`);
  
  const tempInput = `                                                                       <div className="flex flex-col gap-1">
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
                                                                       </div>`;
  
  tempLines.splice(insertPos, 0, tempInput);
} else {
  console.error("CRITICAL: temporaryRoom.residentPhone input not found!");
}

// Convert back to CRLF
let finalContent = tempLines.join('\n');
finalContent = finalContent.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, finalContent, 'utf8');
console.log("Jumlah Penghuni Saat Ini input field successfully integrated.");
