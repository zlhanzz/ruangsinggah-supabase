const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');
const lines = content.split('\n');

// 1. Reorganize temporaryRoom (Index 3340 to 3424)
const tempStatusStart = 3340;
const tempDetailEnd = 3424; // This is the line containing "Skema Tarif / Harga Kamar Section" - 1

const newTempDetailContainer = `                                                     {/* Detail Kamar Section */}
                                                     <div className="border border-gray-150 rounded-xl p-4 flex flex-col gap-3.5 bg-gray-50/30">
                                                         <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100 pb-1">Detail Kamar</span>
                                                         <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                             <div className="flex flex-col gap-1.5">
                                                                 <label className="text-[11px] font-bold text-[#584235] uppercase tracking-wider">Nomor Kamar</label>
                                                                 <input 
                                                                     type="text"
                                                                     value={temporaryRoom.name || ''}
                                                                     onChange={e => setTemporaryRoom({ ...temporaryRoom, name: e.target.value })}
                                                                     className="w-full h-[40px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white font-bold outline-none text-[#584235]"
                                                                     placeholder="Nomor Kamar"
                                                                 />
                                                             </div>
                                                             <div className="flex flex-col gap-1.5">
                                                                 <label className="text-[11px] font-bold text-[#584235] uppercase tracking-wider">Lantai</label>
                                                                 <select 
                                                                     value={temporaryRoom.floor || 'Lantai 1'}
                                                                     onChange={e => setTemporaryRoom({ ...temporaryRoom, floor: e.target.value })}
                                                                     className="w-full h-[40px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white font-bold outline-none text-[#584235]"
                                                                 >
                                                                     <option value="Lantai 1">Lantai 1</option>
                                                                     <option value="Lantai 2">Lantai 2</option>
                                                                     <option value="Lantai 3">Lantai 3</option>
                                                                     <option value="Lantai 4">Lantai 4</option>
                                                                 </select>
                                                             </div>
                                                             <div className="md:col-span-2 flex flex-col gap-1.5">
                                                                 <label className="text-[11px] font-bold text-[#584235] uppercase tracking-wider">Tipe Kamar</label>
                                                                 <select 
                                                                     value={['Standard', 'Premium', 'Deluxe', ''].includes(temporaryRoom.type || '') ? (temporaryRoom.type || '') : '__custom__'}
                                                                     onChange={e => {
                                                                         const val = e.target.value;
                                                                         if (val === '__custom__') {
                                                                             setTemporaryRoom({ ...temporaryRoom, type: 'Kustom' });
                                                                         } else {
                                                                             setTemporaryRoom({ ...temporaryRoom, type: val });
                                                                         }
                                                                     }}
                                                                     className="w-full h-[40px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white font-bold outline-none text-[#584235]"
                                                                 >
                                                                     <option value="" disabled hidden>Pilih Tipe Kamar</option>
                                                                     <option value="Standard">Standard</option>
                                                                     <option value="Premium">Premium</option>
                                                                     <option value="Deluxe">Deluxe</option>
                                                                     <option value="__custom__">Tipe Kustom...</option>
                                                                 </select>
                                                                 {!['Standard', 'Premium', 'Deluxe', ''].includes(temporaryRoom.type || '') && (
                                                                     <div className="mt-1.5">
                                                                         <input 
                                                                             type="text"
                                                                             value={temporaryRoom.type === 'Kustom' ? '' : temporaryRoom.type}
                                                                             onChange={e => setTemporaryRoom({ ...temporaryRoom, type: e.target.value })}
                                                                             placeholder="Masukkan tipe kamar kustom..."
                                                                             className="w-full h-[40px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white font-bold outline-none text-[#584235]"
                                                                         />
                                                                     </div>
                                                                 )}
                                                             </div>
                                                             
                                                             {/* Status Kamar (Last Input) */}
                                                             <div className="md:col-span-2 flex flex-col gap-1.5 mt-2 border-t border-gray-100 pt-3">
                                                                 <label className="text-[11px] font-bold text-[#584235] uppercase tracking-wider">Status Kamar</label>
                                                                 <div className="flex gap-2">
                                                                     <button 
                                                                         type="button"
                                                                         onClick={() => setTemporaryRoom({ ...temporaryRoom, status: 'Terisi', isAvailable: false })}
                                                                         className={\`flex-1 py-3 px-4 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all active:scale-95 text-center \${(temporaryRoom.status === 'Terisi') ? 'bg-green-500 text-white border-green-500 shadow-sm' : 'border-gray-300 text-gray-600 bg-white hover:bg-gray-50'}\`}
                                                                     >
                                                                         Terisi
                                                                     </button>
                                                                     <button 
                                                                         type="button"
                                                                         onClick={() => setTemporaryRoom({ ...temporaryRoom, status: 'Kosong', isAvailable: true })}
                                                                         className={\`flex-1 py-3 px-4 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all active:scale-95 text-center \${(temporaryRoom.status === 'Kosong') ? 'bg-[#ff7a00] text-white border-[#ff7a00] shadow-sm' : 'border-gray-300 text-gray-600 bg-white hover:bg-gray-50'}\`}
                                                                     >
                                                                         Kosong
                                                                     </button>
                                                                 </div>
                                                             </div>
                                                         </div>
                                                     </div>

                                                     {/* Conditional form display based on detail fields completed */}
                                                     {!!(temporaryRoom.name?.trim() && (temporaryRoom.floor || 'Lantai 1') && temporaryRoom.type && temporaryRoom.type !== 'Kustom' && temporaryRoom.status) && (
                                                         <>`;

// Replace lines between tempStatusStart and tempDetailEnd
// Let's verify by printing what we are replacing first
console.log("Replacing temporaryRoom lines:", tempStatusStart + 1, "to", tempDetailEnd);
lines.splice(tempStatusStart, tempDetailEnd - tempStatusStart, newTempDetailContainer);

// Now find index for "Silakan pilih status kamar" in shifted lines
let newSilakanIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Silakan pilih status kamar (Terisi / Kosong)')) {
    newSilakanIdx = i;
    break;
  }
}

if (newSilakanIdx !== -1) {
  // The conditional block wrapper ends here.
  // We want to replace from newSilakanIdx - 2 to newSilakanIdx + 3
  // Let's see:
  // lines[newSilakanIdx - 2] is </>, lines[newSilakanIdx - 1] is ) : (, lines[newSilakanIdx] is <div ...>, ..., lines[newSilakanIdx + 3] is )}
  console.log("Replacing temporaryRoom conditional footer around index", newSilakanIdx);
  lines.splice(newSilakanIdx - 2, 6, `                                                         </>\n                                                     )}`);
} else {
  console.log("CRITICAL: newSilakanIdx NOT found!");
}

// 2. Reorganize activeRoomIdx (rt)
// Re-split content
let midContent = lines.join('\n');
const lines2 = midContent.split('\n');

let activeStatusStart = -1;
let activeDetailEnd = -1;

for (let i = 0; i < lines2.length; i++) {
  if (lines2[i].includes('Status Kamar') && lines2[i].includes('h3') && i > 4000) {
    activeStatusStart = i - 1; // get start of status block
    break;
  }
}

for (let i = activeStatusStart; i < lines2.length; i++) {
  if (lines2[i].includes('Skema Tarif / Harga Kamar Section') && i > 4000) {
    activeDetailEnd = i - 1; // get end of detail block
    break;
  }
}

const newActiveDetailContainer = `                                                          {/* Detail Kamar Section */}
                                                          <div className="border border-gray-150 rounded-xl p-4 flex flex-col gap-3.5 bg-gray-50/30">
                                                              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100 pb-1">Detail Kamar</span>
                                                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                  <div className="flex flex-col gap-1.5">
                                                                      <label className="text-[11px] font-bold text-[#584235] uppercase tracking-wider">Nomor Kamar</label>
                                                                      <input 
                                                                          type="text"
                                                                          value={rt.name || ''}
                                                                          onChange={e => {
                                                                              const updated = [...kmListingForm.roomTypes];
                                                                              updated[activeRoomIdx] = { ...rt, name: e.target.value };
                                                                              setKmListingForm({ ...kmListingForm, roomTypes: updated });
                                                                          }}
                                                                          className="w-full h-[40px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white font-bold outline-none text-[#584235]"
                                                                          placeholder="Nomor Kamar"
                                                                      />
                                                                  </div>
                                                                  <div className="flex flex-col gap-1.5">
                                                                      <label className="text-[11px] font-bold text-[#584235] uppercase tracking-wider">Lantai</label>
                                                                      <select 
                                                                          value={rt.floor || ''}
                                                                          onChange={e => {
                                                                              const updated = [...kmListingForm.roomTypes];
                                                                              updated[activeRoomIdx] = { ...rt, floor: e.target.value };
                                                                              setKmListingForm({ ...kmListingForm, roomTypes: updated });
                                                                          }}
                                                                          className="w-full h-[40px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white font-bold outline-none text-[#584235]"
                                                                      >
                                                                          <option value="" disabled hidden>Pilih Lantai</option>
                                                                          <option value="Lantai 1">Lantai 1</option>
                                                                          <option value="Lantai 2">Lantai 2</option>
                                                                          <option value="Lantai 3">Lantai 3</option>
                                                                          <option value="Lantai 4">Lantai 4</option>
                                                                      </select>
                                                                  </div>
                                                                  <div className="md:col-span-2 flex flex-col gap-1.5">
                                                                      <label className="text-[11px] font-bold text-[#584235] uppercase tracking-wider">Tipe Kamar</label>
                                                                      <select 
                                                                          value={['Standard', 'Premium', 'Deluxe', ''].includes(rt.type || '') ? (rt.type || '') : '__custom__'}
                                                                          onChange={e => {
                                                                              const val = e.target.value;
                                                                              const updated = [...kmListingForm.roomTypes];
                                                                              if (val === '__custom__') {
                                                                                  updated[activeRoomIdx] = { ...rt, type: 'Kustom' };
                                                                              } else {
                                                                                  updated[activeRoomIdx] = { ...rt, type: val };
                                                                              }
                                                                              setKmListingForm({ ...kmListingForm, roomTypes: updated });
                                                                          }}
                                                                          className="w-full h-[40px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white font-bold outline-none text-[#584235]"
                                                                      >
                                                                          <option value="" disabled hidden>Pilih Tipe Kamar</option>
                                                                          <option value="Standard">Standard</option>
                                                                          <option value="Premium">Premium</option>
                                                                          <option value="Deluxe">Deluxe</option>
                                                                          <option value="__custom__">Tipe Kustom...</option>
                                                                      </select>
                                                                      {!['Standard', 'Premium', 'Deluxe', ''].includes(rt.type || '') && (
                                                                          <div className="mt-1.5">
                                                                              <input 
                                                                                  type="text"
                                                                                  value={rt.type === 'Kustom' ? '' : rt.type}
                                                                                  onChange={e => {
                                                                                      const updated = [...kmListingForm.roomTypes];
                                                                                      updated[activeRoomIdx] = { ...rt, type: e.target.value };
                                                                                      setKmListingForm({ ...kmListingForm, roomTypes: updated });
                                                                                  }}
                                                                                  placeholder="Masukkan tipe kamar kustom..."
                                                                                  className="w-full h-[40px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white font-bold outline-none text-[#584235]"
                                                                              />
                                                                          </div>
                                                                      )}
                                                                  </div>
                                                                  
                                                                  {/* Status Kamar (Last Input) */}
                                                                  <div className="md:col-span-2 flex flex-col gap-1.5 mt-2 border-t border-gray-100 pt-3">
                                                                      <label className="text-[11px] font-bold text-[#584235] uppercase tracking-wider">Status Kamar</label>
                                                                      <div className="flex gap-2">
                                                                          <button 
                                                                              type="button"
                                                                              onClick={() => {
                                                                                  const updated = [...kmListingForm.roomTypes];
                                                                                  updated[activeRoomIdx] = { ...rt, status: 'Terisi', isAvailable: false };
                                                                                  setKmListingForm({ ...kmListingForm, roomTypes: updated });
                                                                              }}
                                                                              className={\`flex-1 py-3 px-4 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all active:scale-95 text-center \${isOccupied ? 'bg-green-500 text-white border-green-500 shadow-sm' : 'border-gray-300 text-gray-600 bg-white hover:bg-gray-50'}\`}
                                                                          >
                                                                              Terisi
                                                                          </button>
                                                                          <button 
                                                                              type="button"
                                                                              onClick={() => {
                                                                                  const updated = [...kmListingForm.roomTypes];
                                                                                  updated[activeRoomIdx] = { ...rt, status: 'Kosong', isAvailable: true };
                                                                                  setKmListingForm({ ...kmListingForm, roomTypes: updated });
                                                                              }}
                                                                              className={\`flex-1 py-3 px-4 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all active:scale-95 text-center \${!isOccupied ? 'bg-[#ff7a00] text-white border-[#ff7a00] shadow-sm' : 'border-gray-300 text-gray-600 bg-white hover:bg-gray-50'}\`}
                                                                          >
                                                                              Kosong
                                                                          </button>
                                                                      </div>
                                                                  </div>
                                                              </div>
                                                          </div>

                                                          {/* Conditional form display based on detail fields completed */}
                                                          {!!(rt.name?.trim() && rt.floor && rt.type && rt.type !== 'Kustom' && rt.status) && (
                                                              <>`;

if (activeStatusStart !== -1 && activeDetailEnd !== -1) {
  console.log("Replacing activeRoomIdx lines:", activeStatusStart + 1, "to", activeDetailEnd + 1);
  lines2.splice(activeStatusStart, activeDetailEnd - activeStatusStart + 1, newActiveDetailContainer);
  
  // Find where "Selesai & Tutup Editor" button starts in shifted lines
  let newSelesaiIdx = -1;
  for (let i = 0; i < lines2.length; i++) {
    if (lines2[i].includes('Selesai & Tutup Editor') && i > 4000) {
      newSelesaiIdx = i;
      break;
    }
  }
  
  if (newSelesaiIdx !== -1) {
    // Insert the closing conditional tag just before the button
    // Let's verify by printing what is before it
    console.log("Inserting activeRoomIdx closing wrapper at line", newSelesaiIdx + 1);
    lines2.splice(newSelesaiIdx - 1, 0, `                                                          </>\n                                                          )}`);
  } else {
    console.log("CRITICAL: newSelesaiIdx NOT found!");
  }
} else {
  console.log("CRITICAL: activeStatusStart/activeDetailEnd NOT found!");
}

let finalContent = lines2.join('\n');
// Convert back to CRLF
finalContent = finalContent.replace(/\n/g, '\r\n');

fs.writeFileSync(targetFile, finalContent, 'utf8');
console.log("Done reorganizing Detail Kamar flow.");
